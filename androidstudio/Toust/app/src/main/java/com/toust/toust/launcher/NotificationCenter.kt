package com.toust.toust.launcher

import androidx.compose.animation.core.tween
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.text.SimpleDateFormat
import java.util.*

// ── Notification Center ──────────────────────────────────────────
@Composable
fun NotificationCenter(
    notifications: List<NotificationData>,
    appMap: Map<String, AppInfo>,
    time: String,
    date: String,
    onDismissNotif: (NotificationData) -> Unit,
    onClearAll: () -> Unit,
    onClose: () -> Unit
) {
    val sdf = remember { SimpleDateFormat("HH:mm", Locale.getDefault()) }

    // Group by app
    val grouped = remember(notifications) {
        notifications.groupBy { it.pkg }.toList()
    }

    Box(
        Modifier.fillMaxSize()
            .background(Color.Black.copy(0.75f))
            .pointerInput(Unit) {
                detectVerticalDragGestures { _, delta ->
                    if (delta > 80f) onClose()
                }
            }
            .clickable { onClose() }
    ) {
        Column(
            Modifier.fillMaxSize()
                .statusBarsPadding()
                .clickable(enabled = false) {}
        ) {
            // Header with time/date
            Column(
                Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 16.dp)
            ) {
                Text(time, fontSize = 56.sp, fontWeight = FontWeight.W100, color = Color.White,
                    letterSpacing = (-2).sp)
                Text(date, fontSize = 16.sp, fontWeight = FontWeight.Medium,
                    color = Color.White.copy(0.7f))
            }

            // Notifications
            if (notifications.isEmpty()) {
                Box(
                    Modifier.fillMaxWidth().padding(48.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Notifications, null,
                            tint = Color.White.copy(0.3f), modifier = Modifier.size(48.dp))
                        Spacer(Modifier.height(12.dp))
                        Text("Sin notificaciones", fontSize = 16.sp,
                            color = Color.White.copy(0.4f), fontWeight = FontWeight.Medium)
                    }
                }
            } else {
                Row(
                    Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Notificaciones", fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold, color = Color.White.copy(0.7f))
                    TextButton(onClick = onClearAll) {
                        Text("Borrar todo", color = AccentBlue, fontSize = 13.sp)
                    }
                }

                LazyColumn(
                    Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    grouped.forEach { (pkg, notifs) ->
                        val appInfo = appMap[pkg]
                        items(notifs) { notif ->
                            NotificationCard(
                                notif    = notif,
                                appInfo  = appInfo,
                                sdf      = sdf,
                                onDismiss = { onDismissNotif(notif) }
                            )
                        }
                    }
                    item { Spacer(Modifier.height(80.dp)) }
                }
            }
        }
    }
}

@Composable
private fun NotificationCard(
    notif: NotificationData,
    appInfo: AppInfo?,
    sdf: SimpleDateFormat,
    onDismiss: () -> Unit
) {
    Box(
        Modifier.fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(
                Brush.verticalGradient(listOf(
                    IOSGray2.copy(0.90f),
                    IOSGray1.copy(0.85f)
                ))
            )
            .border(0.5.dp, Color.White.copy(0.10f), RoundedCornerShape(14.dp))
            .padding(14.dp)
    ) {
        Row(verticalAlignment = Alignment.Top) {
            // App icon
            if (appInfo != null) {
                val bmp = remember(appInfo.packageName) {
                    appInfo.icon.toBitmap(64).asImageBitmap()
                }
                Image(BitmapPainter(bmp), null,
                    modifier = Modifier.size(36.dp).clip(RoundedCornerShape(8.dp)),
                    contentScale = ContentScale.Crop)
            } else {
                Box(Modifier.size(36.dp).clip(RoundedCornerShape(8.dp))
                    .background(IOSGray3))
            }
            Spacer(Modifier.width(12.dp))

            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        appInfo?.label ?: notif.pkg,
                        fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
                        color = Color.White.copy(0.8f),
                        modifier = Modifier.weight(1f), maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        sdf.format(Date(notif.time)),
                        fontSize = 11.sp, color = Color.White.copy(0.4f)
                    )
                }
                if (notif.title.isNotBlank()) {
                    Text(notif.title, fontSize = 14.sp, fontWeight = FontWeight.Medium,
                        color = Color.White, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                if (notif.text.isNotBlank()) {
                    Text(notif.text, fontSize = 13.sp, color = Color.White.copy(0.7f),
                        maxLines = 3, overflow = TextOverflow.Ellipsis)
                }
            }
        }
    }
}
