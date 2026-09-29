package com.toust.remotepc.ui.screens

import com.toust.remotepc.ui.theme.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Computer
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.toust.remotepc.RemoteViewModel
import com.toust.remotepc.data.PcInfo
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun SetupScreen(viewModel: RemoteViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    var showPairDialog by remember { mutableStateOf(false) }
    var pairCode by remember { mutableStateOf("") }
    var pcToDelete by remember { mutableStateOf<PcInfo?>(null) }

    Box(modifier = Modifier.fillMaxSize().background(BgDark)) {
        // Fondos Dinámicos
        Box(modifier = Modifier.fillMaxSize()) {
            Box(Modifier.align(Alignment.TopEnd).offset(x = 100.dp, y = (-100).dp).size(350.dp).background(Brush.radialGradient(listOf(AccentBlue.copy(alpha = 0.2f), Color.Transparent)), CircleShape))
            Box(Modifier.align(Alignment.BottomStart).offset(x = (-100).dp, y = 150.dp).size(400.dp).background(Brush.radialGradient(listOf(AccentPurple.copy(alpha = 0.2f), Color.Transparent)), CircleShape))
        }

        Column(modifier = Modifier.fillMaxSize().padding(horizontal = 24.dp)) {
            // Header
            Spacer(Modifier.height(60.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Mis Equipos", fontSize = 32.sp, fontWeight = FontWeight.Black, color = TextPrimary, letterSpacing = (-0.5).sp)
                    Text("Vinculados a tu cuenta", fontSize = 14.sp, color = TextSecondary)
                }
                // Botón Vincular
                IconButton(
                    onClick = { showPairDialog = true },
                    modifier = Modifier.size(56.dp).clip(CircleShape).background(AccentBlue.copy(alpha = 0.1f))
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Vincular", tint = AccentBlue)
                }
            }
            
            Spacer(Modifier.height(30.dp))

            if (uiState.isLoading && uiState.availablePcs.isEmpty()) {
                LoadingPcCard()
            } else if (uiState.availablePcs.isEmpty()) {
                EmptyPcState(onPairClick = { showPairDialog = true })
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    items(uiState.availablePcs) { pc ->
                        PcCard(
                            pc = pc,
                            onClick = { viewModel.onPcSelected(pc) },
                            onDeleteClick = { pcToDelete = pc }
                        )
                    }
                    item { Spacer(Modifier.height(100.dp)) }
                }
            }
        }

        // Diálogo de Vinculación
        if (showPairDialog) {
            AlertDialog(
                onDismissRequest = { showPairDialog = false },
                containerColor = GlassCard,
                title = { Text("Vincular nuevo PC", color = TextPrimary, fontWeight = FontWeight.Bold) },
                text = {
                    Column {
                        Text("Introduce el código de 6 dígitos que aparece en el Optimizador de tu ordenador.", color = TextSecondary, fontSize = 14.sp)
                        Spacer(Modifier.height(20.dp))
                        OutlinedTextField(
                            value = pairCode,
                            onValueChange = { if (it.length <= 6) pairCode = it },
                            label = { Text("Código de 6 dígitos") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary,
                                focusedBorderColor = AccentBlue,
                                unfocusedBorderColor = GlassBorder
                            )
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            viewModel.pairPc(pairCode)
                            showPairDialog = false
                            pairCode = ""
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = AccentBlue),
                        enabled = pairCode.length == 6
                    ) {
                        Text("Vincular ahora", color = BgDark)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showPairDialog = false }) {
                        Text("Cancelar", color = TextSecondary)
                    }
                }
            )
        }

        // Diálogo de Confirmación de Desvinculación
        if (pcToDelete != null) {
            AlertDialog(
                onDismissRequest = { pcToDelete = null },
                containerColor = GlassCard,
                title = { Text("Desvincular Equipo", color = TextPrimary, fontWeight = FontWeight.Bold) },
                text = {
                    Text(
                        "¿Estás seguro de que quieres desvincular el equipo '${pcToDelete?.machineName}'?\n\n" +
                        "Ya no podrás controlarlo de forma remota a menos que vuelvas a introducir su PIN de vinculación.",
                        color = TextSecondary,
                        fontSize = 14.sp
                    )
                },
                confirmButton = {
                    Button(
                        onClick = {
                            pcToDelete?.let { viewModel.unlinkPc(it) }
                            pcToDelete = null
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF5350))
                    ) {
                        Text("Desvincular", color = Color.White)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { pcToDelete = null }) {
                        Text("Cancelar", color = TextSecondary)
                    }
                }
            )
        }
        
        // Snackbar/Mensajes
        uiState.statusMessage?.let { msg ->
            Box(Modifier.align(Alignment.BottomCenter).padding(20.dp)) {
                Surface(color = GreenOk, shape = RoundedCornerShape(12.dp)) {
                    Text(msg, modifier = Modifier.padding(16.dp), color = BgDark, fontWeight = FontWeight.Bold)
                }
            }
            LaunchedEffect(msg) { kotlinx.coroutines.delay(3000); viewModel.clearStatus() }
        }
    }
}

@Composable
private fun PcCard(pc: PcInfo, onClick: () -> Unit, onDeleteClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = GlassCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, GlassBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Icono Neón
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(56.dp).clip(CircleShape)
                    .background(Brush.radialGradient(listOf(AccentBlue.copy(alpha = 0.3f), Color.Transparent)))
                    .border(1.dp, AccentBlue.copy(alpha = 0.5f), CircleShape)
            ) {
                Icon(Icons.Default.Computer, contentDescription = null, tint = AccentBlue, modifier = Modifier.size(28.dp))
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(pc.machineName, fontSize = 18.sp, fontWeight = FontWeight.Black, color = TextPrimary, letterSpacing = (-0.5).sp)
                Spacer(Modifier.height(2.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(6.dp).clip(CircleShape).background(GreenOk))
                    Spacer(Modifier.width(6.dp))
                    Text("Túnel activo · Cifrado", fontSize = 12.sp, color = GreenOk, fontWeight = FontWeight.Bold)
                }
                if (pc.updatedAt.isNotEmpty()) {
                    val formatted = runCatching {
                        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                        val date = sdf.parse(pc.updatedAt.take(19))
                        SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(date ?: Date())
                    }.getOrDefault(pc.updatedAt.take(16))
                    Text("Visto hoy a las $formatted", fontSize = 11.sp, color = TextSecondary, modifier = Modifier.padding(top = 4.dp))
                }
            }

            // Acciones de la Tarjeta
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                IconButton(
                    onClick = onDeleteClick,
                    modifier = Modifier.size(40.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.05f))
                ) {
                    Icon(Icons.Default.Delete, contentDescription = "Desvincular", tint = Color(0xFFEF5350), modifier = Modifier.size(20.dp))
                }
                Box(Modifier.size(40.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.05f)), contentAlignment = Alignment.Center) {
                    Text("›", fontSize = 24.sp, color = AccentBlue, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun LoadingPcCard() {
    val infiniteTransition = rememberInfiniteTransition(label = "loading")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(1200, easing = LinearEasing)), label = "rotation"
    )
    Column(
        modifier = Modifier.fillMaxWidth().padding(vertical = 60.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Box(Modifier.size(64.dp).clip(CircleShape).background(AccentBlue.copy(alpha = 0.1f)), contentAlignment = Alignment.Center) {
            Icon(Icons.Default.Refresh, contentDescription = null, tint = AccentBlue, modifier = Modifier.size(32.dp).rotate(rotation))
        }
        Text("Sincronizando con la red...", color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        Text("Buscando estaciones de trabajo...", color = TextSecondary, fontSize = 13.sp, textAlign = TextAlign.Center)
    }
}

@Composable
private fun EmptyPcState(onPairClick: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(vertical = 60.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Box(Modifier.size(80.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.05f)), contentAlignment = Alignment.Center) {
            Icon(Icons.Default.WifiOff, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(40.dp))
        }
        Text("Sin equipos", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Black)
        Text("No tienes ningún PC vinculado a esta cuenta.", color = TextSecondary, fontSize = 14.sp, textAlign = TextAlign.Center, lineHeight = 22.sp)
        
        Spacer(Modifier.height(8.dp))
        
        Button(
            onClick = onPairClick,
            colors = ButtonDefaults.buttonColors(containerColor = AccentBlue.copy(alpha = 0.1f)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = null, tint = AccentBlue, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text("Vincular el primero", color = AccentBlue, fontWeight = FontWeight.Bold)
        }
    }
}
