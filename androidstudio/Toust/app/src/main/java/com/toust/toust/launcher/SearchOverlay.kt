package com.toust.toust.launcher

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ── Search Overlay (Spotlight) ───────────────────────────────────
@Composable
fun SearchOverlay(
    apps: List<AppInfo>,
    recentApps: List<String> = emptyList(),
    onTap: (AppInfo) -> Unit,
    onClose: () -> Unit
) {
    var query by remember { mutableStateOf("") }
    val results = remember(query, apps) {
        if (query.isBlank()) emptyList()
        else apps.filter { it.label.contains(query, ignoreCase = true) ||
                it.packageName.contains(query, ignoreCase = true) }.take(12)
    }

    // Suggested apps (most recent)
    val suggestions = remember(recentApps, apps) {
        val appMap = apps.associateBy { it.packageName }
        recentApps.take(8).mapNotNull { appMap[it] }
    }

    Box(Modifier.fillMaxSize().background(Color.Black.copy(0.65f))
        .clickable { onClose() }) {
        Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp)
            .padding(top = 80.dp).clickable(enabled = false) {}) {
            // Search bar
            Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp))
                .background(Color.White.copy(0.18f))) {
                Row(Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Search, null, tint = Color.White.copy(0.7f),
                        modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(10.dp))
                    BasicSearchField(query, { query = it },
                        Modifier.weight(1f), placeholder = "Buscar apps…", fontSize = 17.sp)
                    if (query.isNotEmpty()) Icon(Icons.Default.Close, null,
                        tint = Color.White.copy(0.6f),
                        modifier = Modifier.size(18.dp).clickable { query = "" })
                }
            }

            // Suggestions (when empty query)
            if (query.isBlank() && suggestions.isNotEmpty()) {
                Spacer(Modifier.height(16.dp))
                Text("Sugerencias de Siri", fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold, color = Color.White.copy(0.7f))
                Spacer(Modifier.height(8.dp))
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    suggestions.take(4).forEach { app ->
                        val bmp = remember(app.packageName) { app.icon.toBitmap(128).asImageBitmap() }
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.clickable { onTap(app) }
                        ) {
                            Image(BitmapPainter(bmp), app.label,
                                modifier = Modifier.size(52.dp).clip(ICON_SHAPE),
                                contentScale = ContentScale.Crop)
                            Spacer(Modifier.height(4.dp))
                            Text(app.label, fontSize = 10.sp, color = Color.White,
                                maxLines = 1, fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }

            // Results list
            if (results.isNotEmpty()) {
                Spacer(Modifier.height(8.dp))
                Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp))
                    .background(IOSGray1.copy(0.95f))) {
                    LazyColumn {
                        items(results) { app ->
                            val bmp = remember(app.packageName) {
                                app.icon.toBitmap(128).asImageBitmap()
                            }
                            Row(Modifier.fillMaxWidth().clickable { onTap(app) }
                                .padding(horizontal = 14.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically) {
                                Image(BitmapPainter(bmp), app.label,
                                    modifier = Modifier.size(40.dp).clip(RoundedCornerShape(10.dp)),
                                    contentScale = ContentScale.Crop)
                                Spacer(Modifier.width(12.dp))
                                Column {
                                    Text(app.label, fontSize = 16.sp, color = Color.White,
                                        fontWeight = FontWeight.Medium)
                                    Text(app.packageName, fontSize = 11.sp,
                                        color = Color.White.copy(0.4f), maxLines = 1)
                                }
                            }
                            HorizontalDivider(color = Color.White.copy(0.08f), thickness = 0.5.dp,
                                modifier = Modifier.padding(horizontal = 14.dp))
                        }
                    }
                }
            }
        }
    }
}
