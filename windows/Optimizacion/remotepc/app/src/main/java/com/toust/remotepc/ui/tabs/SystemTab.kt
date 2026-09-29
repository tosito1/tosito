package com.toust.remotepc.ui.tabs

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.toust.remotepc.data.WebSocketManager
import com.toust.remotepc.ui.components.SysBtn
import com.toust.remotepc.ui.theme.RedError
import com.toust.remotepc.ui.theme.TextSecondary

@Composable
fun SystemTab(ws: WebSocketManager, onConfirm: (String) -> Unit) {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Control del sistema", color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            SysBtn("Bloquear", Icons.Default.Lock, Color(0xFF4FC3F7), Modifier.weight(1f)) { ws.lockPc() }
            SysBtn("Suspender", Icons.Default.BedtimeOff, Color(0xFF9C27B0), Modifier.weight(1f)) { ws.sleepPc() }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            SysBtn("Pantalla\napagada", Icons.Default.Monitor, TextSecondary, Modifier.weight(1f)) { ws.screenOff() }
            SysBtn("Reiniciar", Icons.Default.Refresh, Color(0xFFFFCA28), Modifier.weight(1f)) { onConfirm("Reiniciar") }
        }
        SysBtn("Apagar PC", Icons.Default.PowerSettingsNew, RedError, Modifier.fillMaxWidth()) { onConfirm("Apagar") }
    }
}
