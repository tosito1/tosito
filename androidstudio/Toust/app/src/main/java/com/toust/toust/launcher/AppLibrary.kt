package com.toust.toust.launcher

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ── App Library ──────────────────────────────────────────────────
@Composable
fun AppLibrary(allApps: List<AppInfo>, onTap: (AppInfo) -> Unit, onClose: () -> Unit) {
    var query by remember { mutableStateOf("") }
    val filtered = remember(query, allApps) {
        if (query.isBlank()) allApps
        else allApps.filter { it.label.contains(query, ignoreCase = true) }
    }

    // Group by first letter for section headers
    val grouped = remember(filtered) {
        filtered.groupBy { it.label.first().uppercaseChar() }.toSortedMap()
    }

    Column(Modifier.fillMaxSize().background(Color.Black.copy(0.82f)).statusBarsPadding()) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically) {
            Text("Biblioteca de Apps", fontSize = 20.sp, fontWeight = FontWeight.Bold,
                color = Color.White, modifier = Modifier.weight(1f))
            TextButton(onClick = onClose) { Text("Cerrar", color = AccentBlue) }
        }

        // Search bar
        Box(Modifier.fillMaxWidth().padding(horizontal = 16.dp)
            .clip(RoundedCornerShape(12.dp)).background(Color.White.copy(0.12f))) {
            Row(Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Search, null, tint = Color.White.copy(0.5f),
                    modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                BasicSearchField(query, { query = it }, Modifier.weight(1f))
            }
        }
        Spacer(Modifier.height(8.dp))

        // Grid with section headers
        LazyVerticalGrid(
            columns = GridCells.Fixed(4),
            modifier = Modifier.fillMaxSize().padding(horizontal = 12.dp),
            contentPadding = PaddingValues(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            grouped.forEach { (letter, apps) ->
                // Section header spanning full width
                item(span = { GridItemSpan(4) }) {
                    Text(
                        "$letter", fontSize = 18.sp, fontWeight = FontWeight.Bold,
                        color = Color.White.copy(0.8f),
                        modifier = Modifier.padding(top = 8.dp, bottom = 2.dp, start = 4.dp)
                    )
                }
                items(apps) { app ->
                    val bmp = remember(app.packageName) { app.icon.toBitmap(256).asImageBitmap() }
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.clickable { onTap(app) }.padding(4.dp)
                    ) {
                        Image(BitmapPainter(bmp), app.label,
                            modifier = Modifier.size(ICON_SIZE).clip(ICON_SHAPE)
                                .shadow(8.dp, ICON_SHAPE),
                            contentScale = ContentScale.Crop)
                        Spacer(Modifier.height(4.dp))
                        Text(app.label, fontSize = 10.sp, color = Color.White, maxLines = 1,
                            overflow = TextOverflow.Ellipsis, textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth())
                    }
                }
            }
        }
    }
}
