package com.toust.toust.launcher

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.PagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ── Clock Widget ─────────────────────────────────────────────────
@Composable
fun ClockWidget(time: String, date: String) {
    Column(Modifier.fillMaxWidth().padding(horizontal = 28.dp, vertical = 4.dp)) {
        Text(time, fontSize = 76.sp, fontWeight = FontWeight.W100, color = Color.White,
            letterSpacing = (-3).sp, lineHeight = 78.sp,
            style = TextStyle(shadow = androidx.compose.ui.graphics.Shadow(
                Color.Black.copy(0.4f), Offset(0f, 2f), 6f)))
        Text(date, fontSize = 17.sp, fontWeight = FontWeight.Medium, color = Color.White.copy(0.82f),
            style = TextStyle(shadow = androidx.compose.ui.graphics.Shadow(
                Color.Black.copy(0.3f), Offset(0f, 1f), 3f)))
    }
}

// ── Page Indicator ───────────────────────────────────────────────
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun PageIndicator(pagerState: PagerState, pageCount: Int) {
    if (pageCount <= 1) return
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically) {
        repeat(pageCount) { i ->
            val sel  = pagerState.currentPage == i
            val sz   by animateDpAsState(if (sel) 7.dp else 5.dp, label = "dot")
            val alph by animateFloatAsState(if (sel) 1f else 0.38f, label = "da")
            Box(Modifier.padding(horizontal = 3.dp).size(sz).clip(CircleShape)
                .background(Color.White.copy(alph)))
        }
    }
}

// ── Glass Button ─────────────────────────────────────────────────
@Composable
fun GlassButton(text: String, color: Color = Color.White, onClick: () -> Unit) {
    Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
        .background(color.copy(0.12f)).border(0.7.dp, color.copy(0.28f), RoundedCornerShape(12.dp))
        .clickable { onClick() }.padding(vertical = 12.dp),
        contentAlignment = Alignment.Center) {
        Text(text, color = color, fontSize = 15.sp, fontWeight = FontWeight.Medium)
    }
}

// ── Basic Search Field ───────────────────────────────────────────
@Composable
fun BasicSearchField(
    value: String, onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "Buscar…",
    fontSize: TextUnit = 15.sp
) {
    androidx.compose.foundation.text.BasicTextField(
        value = value, onValueChange = onValueChange,
        singleLine = true, modifier = modifier,
        textStyle = TextStyle(color = Color.White, fontSize = fontSize),
        decorationBox = { inner ->
            if (value.isEmpty()) Text(placeholder, fontSize = fontSize, color = Color.White.copy(0.5f))
            inner()
        }
    )
}

// ── Context Menu Card ────────────────────────────────────────────
@Composable
fun ContextMenuCard(
    app: AppInfo,
    onDismiss: () -> Unit,
    onInfo: () -> Unit,
    onRemove: () -> Unit,
    onUninstall: () -> Unit
) {
    val bmp = remember(app.packageName) { app.icon.toBitmap(128).asImageBitmap() }
    Box(Modifier.fillMaxWidth(0.75f).clip(RoundedCornerShape(20.dp))
        .background(IOSGray2.copy(0.95f)).padding(20.dp)) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Image(androidx.compose.ui.graphics.painter.BitmapPainter(bmp), app.label,
                modifier = Modifier.size(64.dp).clip(ICON_SHAPE),
                contentScale = androidx.compose.ui.layout.ContentScale.Crop)
            Spacer(Modifier.height(10.dp))
            Text(app.label, fontSize = 17.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(Modifier.height(16.dp))
            GlassButton("Información de la app") { onInfo() }
            Spacer(Modifier.height(8.dp))
            GlassButton("Quitar del escritorio", color = IOSOrange) { onRemove() }
            Spacer(Modifier.height(8.dp))
            GlassButton("Desinstalar", color = IOSRed) { onUninstall() }
            Spacer(Modifier.height(8.dp))
            TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                Text("Cancelar", color = AccentBlue, fontSize = 15.sp)
            }
        }
    }
}

// ── Folder Context Menu ──────────────────────────────────────────
@Composable
fun FolderContextMenu(
    folder: Slot.Folder,
    onDismiss: () -> Unit,
    onRename: (String) -> Unit,
    onDelete: () -> Unit
) {
    var newName by remember { mutableStateOf(folder.name) }
    var renaming by remember { mutableStateOf(false) }

    Box(Modifier.fillMaxSize().clickable { onDismiss() }, contentAlignment = Alignment.Center) {
        Box(Modifier.fillMaxWidth(0.80f).clip(RoundedCornerShape(18.dp))
            .background(IOSGray2.copy(0.97f)).padding(20.dp)
            .clickable(enabled = false) {}) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Carpeta: ${folder.name}", fontSize = 17.sp,
                    fontWeight = FontWeight.Bold, color = Color.White)
                Spacer(Modifier.height(16.dp))
                if (renaming) {
                    OutlinedTextField(
                        value = newName, onValueChange = { newName = it }, singleLine = true,
                        colors = TextFieldDefaults.colors(
                            focusedTextColor = Color.White, unfocusedTextColor = Color.White,
                            focusedContainerColor = Color.White.copy(0.10f),
                            unfocusedContainerColor = Color.White.copy(0.06f),
                            focusedIndicatorColor = AccentBlue,
                            unfocusedIndicatorColor = Color.Transparent
                        ), modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(10.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        TextButton(onClick = { renaming = false; onRename(newName) }) {
                            Text("Guardar", color = AccentBlue, fontWeight = FontWeight.Bold)
                        }
                    }
                } else {
                    GlassButton("Renombrar") { renaming = true }
                    Spacer(Modifier.height(8.dp))
                    GlassButton("Eliminar carpeta", color = IOSRed) { onDelete() }
                }
            }
        }
    }
}

// ── Home Indicator Bar (iOS-style thin line at bottom) ───────────
@Composable
fun HomeIndicatorBar() {
    Box(
        Modifier.fillMaxWidth().padding(bottom = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Box(
            Modifier.width(134.dp).height(5.dp)
                .clip(RoundedCornerShape(2.5.dp))
                .background(Color.White.copy(0.35f))
        )
    }
}


