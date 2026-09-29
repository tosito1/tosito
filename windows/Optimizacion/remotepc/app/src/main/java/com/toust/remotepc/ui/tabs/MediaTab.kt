package com.toust.remotepc.ui.tabs

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.toust.remotepc.RemoteViewModel
import com.toust.remotepc.data.WebSocketManager
import com.toust.remotepc.ui.components.MediaBtn
import com.toust.remotepc.ui.theme.*

@Composable
fun MediaTab(ws: WebSocketManager, viewModel: RemoteViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Controles multimedia", color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            MediaBtn(Icons.Default.SkipPrevious, AccentBlue) { ws.mediaPrev() }
            MediaBtn(Icons.Default.PlayArrow,    GreenOk,  big = true) { ws.mediaPlay() }
            MediaBtn(Icons.Default.Stop,         RedError) { ws.mediaStop() }
            MediaBtn(Icons.Default.SkipNext,     AccentBlue) { ws.mediaNext() }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(20.dp), verticalAlignment = Alignment.CenterVertically) {
            MediaBtn(Icons.Default.VolumeDown, TextSecondary) { ws.volDown() }
            MediaBtn(
                if (uiState.isAudioEnabled) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                if (uiState.isAudioEnabled) GreenOk else Color(0xFFFFCA28)
            ) { viewModel.toggleAudio() }
            MediaBtn(Icons.Default.VolumeUp,   TextSecondary) { ws.volUp() }
        }
        
        Spacer(Modifier.height(8.dp))
        
        Card(
            modifier = Modifier.fillMaxWidth().clickable { viewModel.toggleAudio() },
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = if (uiState.isAudioEnabled) GreenOk.copy(alpha = 0.1f) else BgCard)
        ) {
            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    if (uiState.isAudioEnabled) Icons.Default.Headset else Icons.Default.HeadsetOff,
                    null,
                    tint = if (uiState.isAudioEnabled) GreenOk else TextSecondary
                )
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(
                        if (uiState.isAudioEnabled) "Escuchando audio del PC" else "Audio del PC desactivado",
                        color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold
                    )
                    Text(
                        if (uiState.isAudioEnabled) "Pulsa para silenciar" else "Pulsa para escuchar en el móvil",
                        color = TextSecondary, fontSize = 11.sp
                    )
                }
            }
        }
    }
}
