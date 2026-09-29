package com.toust.toust.launcher

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.telephony.TelephonyManager
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ── iOS-Style Status Bar ─────────────────────────────────────────
@Composable
fun IosStatusBar(time: String) {
    val ctx = LocalContext.current
    val batteryPct = remember { getBatteryPercentage(ctx) }
    val isWifi = remember { isWifiConnected(ctx) }
    val signalBars = remember { getSignalBars(ctx) }

    Row(
        Modifier.fillMaxWidth().statusBarsPadding()
            .padding(horizontal = 24.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Time
        Text(
            time, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color.White,
            style = TextStyle(
                shadow = androidx.compose.ui.graphics.Shadow(
                    Color.Black.copy(0.5f), Offset(0f, 1f), 4f
                )
            )
        )
        Spacer(Modifier.weight(1f))

        // Signal bars
        Row(
            verticalAlignment = Alignment.Bottom,
            horizontalArrangement = Arrangement.spacedBy(1.5.dp)
        ) {
            val heights = listOf(4.dp, 6.dp, 9.dp, 12.dp)
            heights.forEachIndexed { idx, h ->
                val active = idx < signalBars
                Box(
                    Modifier.width(3.dp).height(h)
                        .clip(RoundedCornerShape(1.dp))
                        .background(if (active) Color.White else Color.White.copy(0.3f))
                )
            }
        }
        Spacer(Modifier.width(7.dp))

        // WiFi
        Icon(
            if (isWifi) Icons.Default.Wifi else Icons.Default.WifiOff,
            null, tint = Color.White, modifier = Modifier.size(16.dp)
        )
        Spacer(Modifier.width(6.dp))

        // Battery with percentage
        BatteryIcon(batteryPct)
    }
}

@Composable
fun BatteryIcon(percentage: Int = 75) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        // Battery percentage text
        Text(
            "${percentage}%", fontSize = 11.sp, color = Color.White,
            fontWeight = FontWeight.Medium
        )
        Spacer(Modifier.width(4.dp))
        // Battery body
        Box(
            Modifier.width(22.dp).height(12.dp)
                .border(1.5.dp, Color.White, RoundedCornerShape(3.dp))
                .padding(2.dp)
        ) {
            val fill = (percentage / 100f).coerceIn(0f, 1f)
            val color = when {
                percentage <= 20 -> IOSRed
                percentage <= 40 -> IOSOrange
                else -> Color.White
            }
            Box(
                Modifier.fillMaxHeight().fillMaxWidth(fill)
                    .background(color, RoundedCornerShape(1.dp))
            )
        }
        Spacer(Modifier.width(1.dp))
        Box(
            Modifier.width(2.dp).height(5.dp)
                .background(Color.White, RoundedCornerShape(1.dp))
        )
    }
}

// ── System Info Helpers ──────────────────────────────────────────
private fun getBatteryPercentage(ctx: Context): Int {
    return try {
        val batteryStatus: Intent? = ctx.registerReceiver(null,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val level = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        if (level >= 0 && scale > 0) (level * 100 / scale) else 75
    } catch (_: Exception) { 75 }
}

private fun isWifiConnected(ctx: Context): Boolean {
    return try {
        val cm = ctx.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(network) ?: return false
        caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
    } catch (_: Exception) { false }
}

private fun getSignalBars(ctx: Context): Int {
    return try {
        val tm = ctx.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        val strength = tm.signalStrength
        if (strength != null) {
            val level = strength.level // 0-4
            level.coerceIn(0, 4)
        } else 3
    } catch (_: Exception) { 3 }
}
