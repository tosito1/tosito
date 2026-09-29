package com.toust.toust.launcher

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ── Premium Dock ─────────────────────────────────────────────────
@Composable
fun PremiumDock(
    pkgs: List<String?>,
    appMap: Map<String, AppInfo>,
    isEditing: Boolean,
    dragState: DragState?,
    onTap: (AppInfo) -> Unit,
    onOpenSettings: () -> Unit,
    onSearch: () -> Unit,
    onOpenLibrary: () -> Unit,
    onDropInDock: (slot: Int) -> Unit
) {
    val dockApps = remember(pkgs.hashCode()) { pkgs.map { it?.let { p -> appMap[p] } } }

    Box(Modifier.fillMaxWidth().padding(horizontal = 12.dp)) {
        // Glassmorphism background
        Box(Modifier.matchParentSize().clip(RoundedCornerShape(36.dp))
            .background(Color.White.copy(0.15f)))
        Box(Modifier.matchParentSize().clip(RoundedCornerShape(36.dp))
            .background(
                Brush.verticalGradient(listOf(
                    Color.White.copy(0.20f),
                    Color.White.copy(0.05f)
                ))
            ))
        Box(Modifier.matchParentSize().clip(RoundedCornerShape(36.dp)).border(
            0.8.dp, Brush.verticalGradient(listOf(Color.White.copy(0.60f), Color.White.copy(0.10f))),
            RoundedCornerShape(36.dp)))

        Row(Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 11.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically) {
            dockApps.forEachIndexed { slot, app ->
                if (app != null) DockAppIcon(app, isEditing, onTap = { onTap(app) },
                    onDragEnd = { onDropInDock(slot) })
                else Box(Modifier.size(60.dp).clip(ICON_SHAPE).background(Color.White.copy(0.07f))
                    .border(1.dp, Color.White.copy(0.14f), ICON_SHAPE)
                    .clickable { if (dragState != null) onDropInDock(slot) })
            }
            DockSpecialButton(Icons.Default.Search, "Buscar",
                Brush.linearGradient(listOf(AccentBlue, IOSPurple)), onSearch)
            DockSpecialButton(Icons.Default.Settings, "Ajustes",
                Brush.linearGradient(listOf(IOSGray4, IOSGray3)), onOpenSettings)
        }
    }
}

@Composable
fun DockAppIcon(app: AppInfo, isEditing: Boolean, onTap: () -> Unit, onDragEnd: () -> Unit) {
    val icon   = remember(app.packageName) { app.icon.toBitmap(256).asImageBitmap() }
    val inf    = rememberInfiniteTransition(label = "dj")
    val phase  = remember { (Math.random() * 1000).toInt() }
    val jiggle by inf.animateFloat(-2.5f, 2.5f,
        infiniteRepeatable(tween(if (isEditing) (85 + phase % 20) else Int.MAX_VALUE),
            RepeatMode.Reverse), "dr")
    Box(Modifier.size(60.dp).rotate(if (isEditing) jiggle else 0f)
        .shadow(12.dp, ICON_SHAPE).clip(ICON_SHAPE)
        .clickable { if (!isEditing) onTap() }
        .pointerInput(isEditing) {
            if (isEditing) detectDragGestures(onDragEnd = { onDragEnd() }, onDrag = { _, _ -> })
        }) {
        Image(BitmapPainter(icon), app.label, modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop)
        Box(Modifier.fillMaxSize().background(
            Brush.verticalGradient(listOf(Color.White.copy(0.18f), Color.Transparent), endY = 60f)))
    }
}

@Composable
fun DockSpecialButton(
    icon: ImageVector, label: String,
    gradient: Brush, onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable { onClick() }
    ) {
        Box(Modifier.size(60.dp).shadow(12.dp, ICON_SHAPE).clip(ICON_SHAPE).background(gradient),
            contentAlignment = Alignment.Center) {
            Box(Modifier.size(40.dp).clip(CircleShape).background(IOSGray1.copy(0.80f)),
                contentAlignment = Alignment.Center) {
                Icon(icon, null, tint = Color.White, modifier = Modifier.size(22.dp))
            }
        }
        Spacer(Modifier.height(3.dp))
        Text(label, fontSize = 10.sp, color = Color.White, textAlign = TextAlign.Center,
            style = TextStyle(shadow = androidx.compose.ui.graphics.Shadow(
                Color.Black.copy(0.5f), Offset(0f,1f), 3f)))
    }
}
