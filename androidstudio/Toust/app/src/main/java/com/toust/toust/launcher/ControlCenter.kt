package com.toust.toust.launcher

import android.bluetooth.BluetoothAdapter
import android.content.Context
import android.content.Intent
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.net.wifi.WifiManager
import android.os.Build
import android.provider.Settings
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectVerticalDragGestures
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
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.roundToInt

// ── Control Center ───────────────────────────────────────────────
@Composable
fun ControlCenter(onClose: () -> Unit) {
    val ctx = LocalContext.current

    // State
    var wifiOn       by remember { mutableStateOf(isWifiEnabled(ctx)) }
    var bluetoothOn  by remember { mutableStateOf(isBluetoothEnabled()) }
    var flashOn      by remember { mutableStateOf(false) }
    var airplaneOn   by remember { mutableStateOf(isAirplaneModeOn(ctx)) }
    var brightness   by remember { mutableStateOf(getBrightness(ctx)) }
    var volume       by remember { mutableStateOf(getVolume(ctx)) }

    Box(
        Modifier.fillMaxSize()
            .background(Color.Black.copy(0.75f))
            .pointerInput(Unit) {
                detectVerticalDragGestures { _, delta ->
                    if (delta < -80f) onClose()  // swipe up to close
                }
            }
            .clickable { onClose() }
    ) {
        Column(
            Modifier.fillMaxWidth()
                .align(Alignment.TopEnd)
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp)
                .clickable(enabled = false) {}
        ) {
            // Header
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                Text("Centro de Control", fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold, color = Color.White.copy(0.7f))
            }
            Spacer(Modifier.height(16.dp))

            // Toggle grid (2x2)
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Left column: WiFi + Bluetooth in a group
                Box(
                    Modifier.weight(1f)
                        .clip(RoundedCornerShape(20.dp))
                        .background(IOSGray2.copy(0.80f))
                        .border(0.5.dp, Color.White.copy(0.10f), RoundedCornerShape(20.dp))
                        .padding(12.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        ControlToggleItem(
                            icon = Icons.Default.Wifi,
                            label = "Wi-Fi",
                            isOn = wifiOn,
                            activeColor = AccentBlue,
                            onClick = {
                                // Open WiFi settings
                                ctx.startActivity(Intent(Settings.ACTION_WIFI_SETTINGS)
                                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                                wifiOn = !wifiOn
                            }
                        )
                        ControlToggleItem(
                            icon = Icons.Default.Bluetooth,
                            label = "Bluetooth",
                            isOn = bluetoothOn,
                            activeColor = AccentBlue,
                            onClick = {
                                ctx.startActivity(Intent(Settings.ACTION_BLUETOOTH_SETTINGS)
                                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                                bluetoothOn = !bluetoothOn
                            }
                        )
                        ControlToggleItem(
                            icon = Icons.Default.AirplanemodeActive,
                            label = "Avión",
                            isOn = airplaneOn,
                            activeColor = IOSOrange,
                            onClick = {
                                ctx.startActivity(Intent(Settings.ACTION_AIRPLANE_MODE_SETTINGS)
                                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                            }
                        )
                    }
                }

                // Right column: Flashlight + Rotation + Music
                Column(
                    Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    ControlCenterTile(
                        icon = Icons.Default.FlashlightOn,
                        label = "Linterna",
                        isOn = flashOn,
                        activeColor = Color.White,
                        onClick = {
                            flashOn = !flashOn
                            toggleFlashlight(ctx, flashOn)
                        }
                    )
                    ControlCenterTile(
                        icon = Icons.Default.ScreenRotation,
                        label = "Rotación",
                        isOn = false,
                        activeColor = Color.White,
                        onClick = {
                            ctx.startActivity(Intent(Settings.ACTION_DISPLAY_SETTINGS)
                                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                        }
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            // Brightness Slider
            ControlSlider(
                icon = Icons.Default.LightMode,
                value = brightness,
                onValueChange = { v ->
                    brightness = v
                    setBrightness(ctx, v)
                }
            )

            Spacer(Modifier.height(10.dp))

            // Volume Slider
            ControlSlider(
                icon = Icons.Default.VolumeUp,
                value = volume,
                onValueChange = { v ->
                    volume = v
                    setVolume(ctx, v)
                }
            )

            Spacer(Modifier.height(16.dp))

            // Music controls
            MusicControls()
        }
    }
}

@Composable
private fun ControlToggleItem(
    icon: ImageVector,
    label: String,
    isOn: Boolean,
    activeColor: Color,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Box(
            Modifier.size(36.dp).clip(CircleShape)
                .background(if (isOn) activeColor else IOSGray3),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = Color.White, modifier = Modifier.size(18.dp))
        }
        Column {
            Text(label, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = Color.White)
            Text(
                if (isOn) "Activado" else "Desactivado",
                fontSize = 10.sp, color = Color.White.copy(0.5f)
            )
        }
    }
}

@Composable
private fun ControlCenterTile(
    icon: ImageVector,
    label: String,
    isOn: Boolean,
    activeColor: Color,
    onClick: () -> Unit
) {
    Box(
        Modifier.fillMaxWidth()
            .aspectRatio(1.6f)
            .clip(RoundedCornerShape(16.dp))
            .background(if (isOn) activeColor.copy(0.25f) else IOSGray2.copy(0.80f))
            .border(0.5.dp, Color.White.copy(0.10f), RoundedCornerShape(16.dp))
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(icon, null,
                tint = if (isOn) activeColor else Color.White.copy(0.7f),
                modifier = Modifier.size(24.dp))
            Spacer(Modifier.height(4.dp))
            Text(label, fontSize = 11.sp, color = Color.White.copy(0.8f),
                fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
private fun ControlSlider(
    icon: ImageVector,
    value: Float,
    onValueChange: (Float) -> Unit
) {
    Box(
        Modifier.fillMaxWidth()
            .height(54.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(IOSGray2.copy(0.80f))
            .border(0.5.dp, Color.White.copy(0.10f), RoundedCornerShape(14.dp))
            .padding(horizontal = 16.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxSize()
        ) {
            Icon(icon, null, tint = Color.White.copy(0.7f), modifier = Modifier.size(20.dp))
            Spacer(Modifier.width(12.dp))
            Slider(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.weight(1f),
                colors = SliderDefaults.colors(
                    thumbColor = Color.White,
                    activeTrackColor = Color.White,
                    inactiveTrackColor = Color.White.copy(0.15f)
                )
            )
        }
    }
}

@Composable
private fun MusicControls() {
    Box(
        Modifier.fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(IOSGray2.copy(0.80f))
            .border(0.5.dp, Color.White.copy(0.10f), RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Column {
            Text("Reproduciendo", fontSize = 12.sp, color = Color.White.copy(0.5f))
            Spacer(Modifier.height(4.dp))
            Text("Sin reproducción", fontSize = 14.sp, fontWeight = FontWeight.Medium,
                color = Color.White.copy(0.7f))
            Spacer(Modifier.height(12.dp))
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                Icon(Icons.Default.SkipPrevious, null, tint = Color.White.copy(0.7f),
                    modifier = Modifier.size(28.dp).clickable { })
                Icon(Icons.Default.PlayArrow, null, tint = Color.White,
                    modifier = Modifier.size(32.dp).clickable { })
                Icon(Icons.Default.SkipNext, null, tint = Color.White.copy(0.7f),
                    modifier = Modifier.size(28.dp).clickable { })
            }
        }
    }
}

// ── System Helpers ───────────────────────────────────────────────
private fun isWifiEnabled(ctx: Context): Boolean {
    return try {
        val wm = ctx.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        wm.isWifiEnabled
    } catch (_: Exception) { false }
}

private fun isBluetoothEnabled(): Boolean {
    return try {
        BluetoothAdapter.getDefaultAdapter()?.isEnabled == true
    } catch (_: Exception) { false }
}

private fun isAirplaneModeOn(ctx: Context): Boolean {
    return Settings.Global.getInt(ctx.contentResolver,
        Settings.Global.AIRPLANE_MODE_ON, 0) != 0
}

private fun toggleFlashlight(ctx: Context, on: Boolean) {
    try {
        val cm = ctx.getSystemService(Context.CAMERA_SERVICE) as CameraManager
        val cameraId = cm.cameraIdList.firstOrNull() ?: return
        cm.setTorchMode(cameraId, on)
    } catch (_: Exception) { }
}

private fun getBrightness(ctx: Context): Float {
    return try {
        val b = Settings.System.getInt(ctx.contentResolver,
            Settings.System.SCREEN_BRIGHTNESS, 128)
        b / 255f
    } catch (_: Exception) { 0.5f }
}

private fun setBrightness(ctx: Context, value: Float) {
    try {
        val b = (value * 255).roundToInt().coerceIn(0, 255)
        Settings.System.putInt(ctx.contentResolver,
            Settings.System.SCREEN_BRIGHTNESS, b)
    } catch (_: Exception) { }
}

private fun getVolume(ctx: Context): Float {
    return try {
        val am = ctx.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val current = am.getStreamVolume(AudioManager.STREAM_MUSIC)
        val max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        if (max > 0) current.toFloat() / max else 0.5f
    } catch (_: Exception) { 0.5f }
}

private fun setVolume(ctx: Context, value: Float) {
    try {
        val am = ctx.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        val v = (value * max).roundToInt().coerceIn(0, max)
        am.setStreamVolume(AudioManager.STREAM_MUSIC, v, 0)
    } catch (_: Exception) { }
}
