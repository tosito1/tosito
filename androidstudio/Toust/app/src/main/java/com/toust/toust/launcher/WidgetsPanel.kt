package com.toust.toust.launcher

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Calendar

// ── Widgets Panel (Today View) ───────────────────────────────────
@Composable
fun WidgetsPanel(time: String, date: String, onClose: () -> Unit) {
    val ctx = LocalContext.current
    val batteryPct = remember { getBatteryPctForWidget(ctx) }
    val isCharging = remember { isBatteryCharging(ctx) }

    Column(
        Modifier.fillMaxSize()
            .background(Color.Black.copy(0.80f))
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .clickable { onClose() }
    ) {
        // Header
        Column(
            Modifier.fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 16.dp)
                .clickable(enabled = false) {}
        ) {
            Text(time, fontSize = 56.sp, fontWeight = FontWeight.W100, color = Color.White,
                letterSpacing = (-2).sp)
            Text(date, fontSize = 16.sp, fontWeight = FontWeight.Medium,
                color = Color.White.copy(0.7f))
        }
        Spacer(Modifier.height(8.dp))

        // Widget cards
        Column(
            Modifier.fillMaxWidth()
                .padding(horizontal = 16.dp)
                .clickable(enabled = false) {},
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Battery Widget
            WidgetCard(
                title = "Batería",
                icon = if (isCharging) Icons.Default.BatteryChargingFull else Icons.Default.BatteryFull,
                gradient = if (batteryPct <= 20)
                    Brush.linearGradient(listOf(IOSRed.copy(0.3f), IOSRed.copy(0.1f)))
                else
                    Brush.linearGradient(listOf(IOSGreen.copy(0.3f), IOSGreen.copy(0.1f)))
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        Modifier.size(56.dp).clip(CircleShape)
                            .background(if (batteryPct <= 20) IOSRed.copy(0.2f) else IOSGreen.copy(0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("${batteryPct}%", fontSize = 16.sp, fontWeight = FontWeight.Bold,
                            color = if (batteryPct <= 20) IOSRed else IOSGreen)
                    }
                    Column {
                        Text(
                            if (isCharging) "Cargando" else "En batería",
                            fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color.White
                        )
                        Text(
                            when {
                                batteryPct >= 80 -> "Nivel excelente"
                                batteryPct >= 50 -> "Nivel bueno"
                                batteryPct >= 20 -> "Nivel moderado"
                                else -> "Batería baja"
                            },
                            fontSize = 13.sp, color = Color.White.copy(0.6f)
                        )
                    }
                }
                Spacer(Modifier.height(8.dp))
                // Battery bar
                Box(
                    Modifier.fillMaxWidth().height(8.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(Color.White.copy(0.10f))
                ) {
                    Box(
                        Modifier.fillMaxHeight()
                            .fillMaxWidth(batteryPct / 100f)
                            .clip(RoundedCornerShape(4.dp))
                            .background(if (batteryPct <= 20) IOSRed else IOSGreen)
                    )
                }
            }

            // Calendar Widget
            WidgetCard(
                title = "Calendario",
                icon = Icons.Default.CalendarToday,
                gradient = Brush.linearGradient(listOf(IOSRed.copy(0.25f), IOSOrange.copy(0.10f)))
            ) {
                val cal = Calendar.getInstance()
                val dayOfWeek = when (cal.get(Calendar.DAY_OF_WEEK)) {
                    Calendar.MONDAY -> "Lunes"
                    Calendar.TUESDAY -> "Martes"
                    Calendar.WEDNESDAY -> "Miércoles"
                    Calendar.THURSDAY -> "Jueves"
                    Calendar.FRIDAY -> "Viernes"
                    Calendar.SATURDAY -> "Sábado"
                    else -> "Domingo"
                }
                Column {
                    Text(dayOfWeek.uppercase(), fontSize = 11.sp, fontWeight = FontWeight.SemiBold,
                        color = IOSRed, letterSpacing = 1.sp)
                    Text("${cal.get(Calendar.DAY_OF_MONTH)}", fontSize = 42.sp,
                        fontWeight = FontWeight.W200, color = Color.White)
                }
            }

            // Quick Actions Widget
            WidgetCard(
                title = "Acciones rápidas",
                icon = Icons.Default.TouchApp,
                gradient = Brush.linearGradient(listOf(AccentBlue.copy(0.25f), IOSPurple.copy(0.10f)))
            ) {
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    QuickActionButton(Icons.Default.Wifi, "Wi-Fi") {
                        ctx.startActivity(Intent(android.provider.Settings.ACTION_WIFI_SETTINGS)
                            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                    }
                    QuickActionButton(Icons.Default.Bluetooth, "Bluetooth") {
                        ctx.startActivity(Intent(android.provider.Settings.ACTION_BLUETOOTH_SETTINGS)
                            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                    }
                    QuickActionButton(Icons.Default.FlashlightOn, "Linterna") {
                        // toggleFlashlight handled by Control Center
                    }
                    QuickActionButton(Icons.Default.CameraAlt, "Cámara") {
                        val intent = Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE)
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        runCatching { ctx.startActivity(intent) }
                    }
                }
            }

            // Weather placeholder
            WidgetCard(
                title = "Tiempo",
                icon = Icons.Default.Cloud,
                gradient = Brush.linearGradient(listOf(IOSTeal.copy(0.25f), AccentBlue.copy(0.10f)))
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(Icons.Default.WbSunny, null, tint = IOSOrange,
                        modifier = Modifier.size(40.dp))
                    Column {
                        Text("--°C", fontSize = 28.sp, fontWeight = FontWeight.W300, color = Color.White)
                        Text("Toca para abrir el tiempo", fontSize = 12.sp,
                            color = Color.White.copy(0.5f))
                    }
                }
            }

            Spacer(Modifier.height(100.dp))
        }
    }
}

@Composable
private fun WidgetCard(
    title: String,
    icon: ImageVector,
    gradient: Brush,
    content: @Composable ColumnScope.() -> Unit
) {
    Box(
        Modifier.fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(gradient)
            .background(IOSGray2.copy(0.60f))
            .border(0.5.dp, Color.White.copy(0.10f), RoundedCornerShape(18.dp))
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(icon, null, tint = Color.White.copy(0.6f), modifier = Modifier.size(16.dp))
                Text(title.uppercase(), fontSize = 11.sp, fontWeight = FontWeight.SemiBold,
                    color = Color.White.copy(0.5f), letterSpacing = 1.sp)
            }
            Spacer(Modifier.height(12.dp))
            content()
        }
    }
}

@Composable
private fun QuickActionButton(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable { onClick() }
    ) {
        Box(
            Modifier.size(44.dp).clip(CircleShape)
                .background(Color.White.copy(0.12f))
                .border(0.5.dp, Color.White.copy(0.15f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = Color.White, modifier = Modifier.size(20.dp))
        }
        Spacer(Modifier.height(4.dp))
        Text(label, fontSize = 10.sp, color = Color.White.copy(0.7f),
            textAlign = TextAlign.Center)
    }
}

// ── Battery helpers for widget ───────────────────────────────────
private fun getBatteryPctForWidget(ctx: Context): Int {
    return try {
        val batteryStatus = ctx.registerReceiver(null,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val level = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        if (level >= 0 && scale > 0) (level * 100 / scale) else 50
    } catch (_: Exception) { 50 }
}

private fun isBatteryCharging(ctx: Context): Boolean {
    return try {
        val batteryStatus = ctx.registerReceiver(null,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val status = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        status == BatteryManager.BATTERY_STATUS_CHARGING ||
            status == BatteryManager.BATTERY_STATUS_FULL
    } catch (_: Exception) { false }
}
