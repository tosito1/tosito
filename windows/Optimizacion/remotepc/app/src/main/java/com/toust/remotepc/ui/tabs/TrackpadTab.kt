package com.toust.remotepc.ui.tabs

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdsClick
import androidx.compose.material.icons.filled.Fullscreen
import androidx.compose.material.icons.filled.Keyboard
import androidx.compose.material.icons.filled.Mouse
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.toust.remotepc.data.WebSocketManager
import com.toust.remotepc.ui.components.ActionBtn
import com.toust.remotepc.ui.components.TrackpadLayer
import com.toust.remotepc.ui.theme.AccentBlue
import com.toust.remotepc.ui.theme.TextSecondary

@Composable
fun TrackpadTab(ws: WebSocketManager, onFullscreen: () -> Unit, onKeyboard: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(8.dp)) {
        // Trackpad
        Box(
            Modifier.fillMaxWidth().weight(1f).clip(RoundedCornerShape(16.dp)).background(Color(0xFF0F111A))
                .border(1.dp, AccentBlue.copy(alpha = 0.15f), RoundedCornerShape(16.dp))
        ) {
            TrackpadLayer(
                modifier = Modifier.fillMaxSize(),
                onMoveRel = { dx, dy -> ws.mouseMoveRel(dx, dy) },
                onTap = { ws.mouseClick("LEFT") },
                onTwoFingerTap = { ws.mouseClick("RIGHT") },
                onDoubleTap = { ws.mouseDoubleClick() },
                onScroll = { ws.mouseScroll(it) }
            )
            Text("DESLIZA AQUÍ", color = Color.White.copy(alpha = 0.04f), fontSize = 16.sp, fontWeight = FontWeight.Black, letterSpacing = 3.sp, modifier = Modifier.align(Alignment.Center))
        }
        Spacer(Modifier.height(6.dp))
        // Botones
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            ActionBtn(Icons.Default.Mouse,       "IZQ",      AccentBlue,              Modifier.weight(1f)) { ws.mouseClick("LEFT") }
            ActionBtn(Icons.Default.Mouse,       "DER",      AccentBlue,              Modifier.weight(1f)) { ws.mouseClick("RIGHT") }
            ActionBtn(Icons.Default.AdsClick,    "DBL",      Color(0xFF9C27B0),       Modifier.weight(1f)) { ws.mouseDoubleClick() }
            ActionBtn(Icons.Default.Keyboard,    "TYPE",     Color(0xFF4FC3F7),       Modifier.weight(1f)) { onKeyboard() }
            ActionBtn(Icons.Default.Fullscreen,  "FULL",     TextSecondary,           Modifier.weight(1f)) { onFullscreen() }
        }
    }
}
