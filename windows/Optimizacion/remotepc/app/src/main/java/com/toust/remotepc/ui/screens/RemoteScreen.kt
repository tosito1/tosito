package com.toust.remotepc.ui.screens

import com.toust.remotepc.ui.theme.*
import com.toust.remotepc.ui.components.*
import com.toust.remotepc.ui.tabs.*
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.toust.remotepc.PcStats
import com.toust.remotepc.RemoteUiState
import com.toust.remotepc.RemoteViewModel
import com.toust.remotepc.data.WebSocketManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// ── Tab enum ──────────────────────────────────────────────────────────────────
private enum class ControlTab { TRACKPAD, OPTIMIZER, MEDIA, SYSTEM }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RemoteScreen(viewModel: RemoteViewModel) {
    val uiState      by viewModel.uiState.collectAsState()
    val wsState       = uiState.wsState
    val ws            = viewModel.wsManager
    var isFullscreen  by remember { mutableStateOf(false) }
    var showKeyboard  by remember { mutableStateOf(false) }
    var keyboardText  by remember { mutableStateOf("") }
    var activeTab     by remember { mutableStateOf(ControlTab.TRACKPAD) }
    var showConfirm   by remember { mutableStateOf<String?>(null) }
    val scope         = rememberCoroutineScope()
    val snackbarState = remember { SnackbarHostState() }

    // Polling de stats cada 3s
    LaunchedEffect(wsState) {
        if (wsState == WebSocketManager.ConnectionState.CONNECTED) {
            while (true) {
                ws.getStats()
                delay(3000)
            }
        }
    }

    LaunchedEffect(uiState.statusMessage) {
        uiState.statusMessage?.let {
            snackbarState.showSnackbar(it, duration = SnackbarDuration.Short)
            viewModel.clearStatus()
        }
    }

    val streamUrl = (uiState.selectedPc?.tunnelUrl?.trimEnd('/') ?: "") + "/stream"
    val isConnected = wsState == WebSocketManager.ConnectionState.CONNECTED

    Box(Modifier.fillMaxSize().background(Color.Black)) {
        Column(Modifier.fillMaxSize()) {
            // ── Header ────────────────────────────────────────────────────────
            if (!isFullscreen) {
                RemoteTopBar(
                    pcName = uiState.selectedPc?.machineName ?: "PC",
                    wsState = wsState,
                    stats = uiState.pcStats,
                    uiState = uiState,
                    viewModel = viewModel,
                    onBack = { viewModel.onDisconnect() },
                    onFullscreen = { isFullscreen = true }
                )
            }

            // ── Stream ────────────────────────────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(if (isFullscreen) 1f else 0.40f)
                    .background(Color.Black),
                contentAlignment = Alignment.Center
            ) {
                if (isConnected) {
                    MjpegView(
                        url = streamUrl,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Fit
                    )
                    if (isFullscreen) {
                        TrackpadLayer(
                            modifier = Modifier.fillMaxSize(),
                            onMoveRel = { dx, dy -> ws.mouseMoveRel(dx, dy) },
                            onTap = { ws.mouseClick("LEFT") },
                            onTwoFingerTap = { ws.mouseClick("RIGHT") },
                            onDoubleTap = { ws.mouseDoubleClick() },
                            onScroll = { ws.mouseScroll(it) }
                        )
                        // Floating buttons fullscreen
                        Box(Modifier.fillMaxSize()) {
                            SmallFab(Icons.Default.FullscreenExit, Modifier.align(Alignment.TopEnd).padding(12.dp)) { isFullscreen = false }
                            SmallFab(Icons.Default.Keyboard, Modifier.align(Alignment.BottomEnd).padding(12.dp)) { showKeyboard = true }
                            SmallFab(Icons.Default.Mouse, Modifier.align(Alignment.BottomStart).padding(12.dp)) { ws.mouseClick("LEFT") }
                        }
                    }
                } else {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        CircularProgressIndicator(color = AccentBlue, modifier = Modifier.size(36.dp))
                        Text(when (wsState) {
                            WebSocketManager.ConnectionState.CONNECTING -> "Conectando..."
                            WebSocketManager.ConnectionState.AUTHENTICATING -> "Autenticando..."
                            else -> "Reconectando..."
                        }, color = TextSecondary, fontSize = 14.sp)
                    }
                }
            }

            // ── Tab bar + content (solo cuando no es fullscreen) ──────────────
            if (!isFullscreen) {
                // Content por tab (Cambiado de posición arriba de las Tabs)
                Box(Modifier.fillMaxWidth().weight(0.60f)) {
                    when (activeTab) {
                        ControlTab.TRACKPAD -> TrackpadTab(
                            ws = ws,
                            onFullscreen = { isFullscreen = true },
                            onKeyboard = { showKeyboard = true }
                        )
                        ControlTab.OPTIMIZER -> OptimizerTab(ws = ws, stats = uiState.pcStats)
                        ControlTab.MEDIA -> MediaTab(ws = ws, viewModel = viewModel)
                        ControlTab.SYSTEM -> SystemTab(
                            ws = ws,
                            onConfirm = { showConfirm = it }
                        )
                    }
                }

                // Tabs - Floating Glass Pill (Movido al fondo)
                Card(
                    modifier = Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, bottom = 12.dp, top = 8.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = GlassCard),
                    border = androidx.compose.foundation.BorderStroke(1.dp, GlassBorder),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                ) {
                    Row(
                        Modifier.fillMaxWidth().padding(4.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        TabItem(Icons.Default.Mouse, "Trackpad", activeTab == ControlTab.TRACKPAD, Modifier.weight(1f)) { activeTab = ControlTab.TRACKPAD }
                        TabItem(Icons.Default.Speed, "Optimizar", activeTab == ControlTab.OPTIMIZER, Modifier.weight(1f)) { activeTab = ControlTab.OPTIMIZER }
                        TabItem(Icons.Default.MusicNote, "Media", activeTab == ControlTab.MEDIA, Modifier.weight(1f)) { activeTab = ControlTab.MEDIA }
                        TabItem(Icons.Default.Computer, "Sistema", activeTab == ControlTab.SYSTEM, Modifier.weight(1f)) { activeTab = ControlTab.SYSTEM }
                    }
                }
            }
        }

        SnackbarHost(snackbarState, Modifier.align(Alignment.BottomCenter))
    }

    // ── Dialogs ───────────────────────────────────────────────────────────────
    if (showKeyboard) {
        AlertDialog(
            onDismissRequest = { showKeyboard = false; keyboardText = "" },
            containerColor = BgCard,
            title = { Text("Escribir en el PC", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                OutlinedTextField(
                    value = keyboardText,
                    onValueChange = { keyboardText = it },
                    label = { Text("Texto", color = TextSecondary) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = TextPrimary, unfocusedTextColor = TextPrimary, focusedBorderColor = AccentBlue, unfocusedBorderColor = TextSecondary)
                )
            },
            confirmButton = {
                Button(onClick = { if (keyboardText.isNotEmpty()) ws.typeText(keyboardText); showKeyboard = false; keyboardText = "" }, colors = ButtonDefaults.buttonColors(containerColor = AccentBlue)) {
                    Text("Enviar", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = { TextButton(onClick = { showKeyboard = false; keyboardText = "" }) { Text("Cancelar", color = TextSecondary) } }
        )
    }

    showConfirm?.let { action ->
        AlertDialog(
            onDismissRequest = { showConfirm = null },
            containerColor = BgCard,
            title = { Text("¿Confirmar?", color = RedError, fontWeight = FontWeight.Bold) },
            text = { Text("Esta acción es irreversible: $action", color = TextPrimary) },
            confirmButton = {
                Button(onClick = {
                    when (action) {
                        "Apagar" -> ws.shutdown()
                        "Reiniciar" -> ws.restart()
                    }
                    showConfirm = null
                }, colors = ButtonDefaults.buttonColors(containerColor = RedError)) { Text("Confirmar", color = Color.White) }
            },
            dismissButton = { TextButton(onClick = { showConfirm = null }) { Text("Cancelar", color = TextSecondary) } }
        )
    }
}

// ── Top Bar ───────────────────────────────────────────────────────────────────
@Composable
private fun RemoteTopBar(
    pcName: String, wsState: WebSocketManager.ConnectionState,
    stats: PcStats, uiState: RemoteUiState, viewModel: RemoteViewModel,
    onBack: () -> Unit, onFullscreen: () -> Unit
) {
    val dotColor = when (wsState) {
        WebSocketManager.ConnectionState.CONNECTED -> GreenOk
        WebSocketManager.ConnectionState.CONNECTING, WebSocketManager.ConnectionState.AUTHENTICATING -> WarningYellow
        else -> RedError
    }

    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = GlassCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, GlassBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack, modifier = Modifier.size(36.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.05f))) {
                Icon(Icons.Default.ArrowBack, null, tint = TextPrimary, modifier = Modifier.size(18.dp))
            }
            Spacer(Modifier.width(12.dp))
            
            // Indicador de estado neón
            Box(Modifier.size(8.dp).clip(CircleShape).background(dotColor).border(1.dp, dotColor.copy(alpha = 0.5f), CircleShape))
            Spacer(Modifier.width(10.dp))
            
            Column(Modifier.weight(1f)) {
                Text(pcName, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
                if (stats.ramTotal > 0) {
                    Text("CPU ${stats.cpu.toInt()}%  RAM ${stats.ramPct.toInt()}%", color = TextSecondary, fontSize = 10.sp)
                }
            }
            
            // Actions
            IconButton(onClick = { viewModel.toggleAudio() }, modifier = Modifier.size(36.dp)) {
                Icon(
                    if (uiState.isAudioEnabled) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                    null,
                    tint = if (uiState.isAudioEnabled) GreenOk else TextSecondary,
                    modifier = Modifier.size(20.dp)
                )
            }
            IconButton(onClick = onFullscreen, modifier = Modifier.size(36.dp)) {
                Icon(Icons.Default.Fullscreen, null, tint = AccentBlue, modifier = Modifier.size(22.dp))
            }
        }
    }
}
