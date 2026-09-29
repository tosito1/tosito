package com.toust.remotepc.ui.tabs

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.toust.remotepc.PcStats
import com.toust.remotepc.data.WebSocketManager
import com.toust.remotepc.ui.components.OptBtn
import com.toust.remotepc.ui.components.StatRow
import com.toust.remotepc.ui.theme.*

data class OptActionData(val title: String, val desc: String, val action: () -> Unit)

@Composable
fun OptimizerTab(ws: WebSocketManager, stats: PcStats) {
    var confirmDialog by remember { mutableStateOf<OptActionData?>(null) }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(12.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        // Stats card
        if (stats.ramTotal > 0) {
            Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = BgCard)) {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Estado en tiempo real", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    StatRow("CPU", stats.cpu, "%", AccentBlue)
                    StatRow("RAM", stats.ramPct, "% (${stats.ramUsed}MB / ${stats.ramTotal}MB)", GreenOk)
                }
            }
        }

        // Básico
        Text("LIMPIEZA BÁSICA", color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Black, letterSpacing = 2.sp)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OptBtn("RAM", "Liberar\nmemoria", Icons.Default.Memory, GreenOk, Modifier.weight(1f)) { ws.freeRam() }
            OptBtn("TEMP", "Archivos\ntemp", Icons.Default.DeleteSweep, Color(0xFFFFCA28), Modifier.weight(1f)) { ws.quickClean() }
            OptBtn("PAPELERA", "Vaciar\npapelera", Icons.Default.Delete, RedError, Modifier.weight(1f)) { ws.cleanRecycle() }
        }

        // Gaming & Red
        Text("RENDIMIENTO & RED", color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Black, letterSpacing = 2.sp)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OptBtn("BOOSTER", "Game\nBooster", Icons.Default.SportsEsports, Color(0xFFE040FB), Modifier.weight(1f)) { 
                confirmDialog = OptActionData("Game Booster", "¿Activar modo máximo rendimiento para juegos? Esto priorizará CPU/GPU y pausará procesos en segundo plano.") { ws.runGameBooster() }
            }
            OptBtn("RED", "Optimizar\nConexión", Icons.Default.NetworkCheck, Color(0xFF00E5FF), Modifier.weight(1f)) { 
                confirmDialog = OptActionData("Optimizar Red", "¿Aplicar mejoras de latencia y resetear adaptadores de red?") { ws.runNetworkOptimize() }
            }
            OptBtn("DNS", "Gaming\nDNS", Icons.Default.Dns, Color(0xFF00B0FF), Modifier.weight(1f)) { 
                confirmDialog = OptActionData("DNS Gaming", "¿Cambiar los servidores DNS a Cloudflare (1.1.1.1) para menor ping?") { ws.runDnsOptimize() }
            }
        }

        // Avanzado
        Text("SISTEMA AVANZADO", color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Black, letterSpacing = 2.sp)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OptBtn("DEBLOAT", "Windows\nDebloat", Icons.Default.CleaningServices, Color(0xFFFF5252), Modifier.weight(1f)) { 
                confirmDialog = OptActionData("Windows Debloat", "¿Eliminar bloatware y aplicaciones innecesarias preinstaladas de Windows?") { ws.runDebloat() }
            }
            OptBtn("SERVICIOS", "Optimizar\nServicios", Icons.Default.SettingsSuggest, Color(0xFFFF9800), Modifier.weight(1f)) { 
                confirmDialog = OptActionData("Servicios", "¿Desactivar servicios innecesarios de Windows para ahorrar RAM?") { ws.runServiceOptimize() }
            }
            OptBtn("PRIVACIDAD", "Mejorar\nPrivacidad", Icons.Default.Security, Color(0xFF69F0AE), Modifier.weight(1f)) { 
                confirmDialog = OptActionData("Privacidad", "¿Bloquear telemetría de Windows y rastreo de datos?") { ws.runPrivacyOptimize() }
            }
        }
        Spacer(Modifier.height(16.dp))
    }

    // Dialogo de confirmación
    if (confirmDialog != null) {
        AlertDialog(
            onDismissRequest = { confirmDialog = null },
            title = { Text(confirmDialog!!.title, color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = { Text(confirmDialog!!.desc, color = TextSecondary, fontSize = 14.sp) },
            containerColor = BgCard,
            confirmButton = {
                TextButton(onClick = { 
                    confirmDialog!!.action()
                    confirmDialog = null 
                }) { Text("Ejecutar", color = AccentBlue, fontWeight = FontWeight.Bold) }
            },
            dismissButton = {
                TextButton(onClick = { confirmDialog = null }) { Text("Cancelar", color = TextSecondary) }
            }
        )
    }
}
