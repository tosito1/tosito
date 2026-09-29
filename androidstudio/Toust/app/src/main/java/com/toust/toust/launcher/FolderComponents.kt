package com.toust.toust.launcher

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ── Folder Overlay ───────────────────────────────────────────────
@Composable
fun FolderOverlay(
    folder: Slot.Folder,
    appMap: Map<String, AppInfo>,
    isEditing: Boolean,
    onTapApp: (AppInfo) -> Unit,
    onClose: () -> Unit,
    onRename: (String) -> Unit,
    onRemoveApp: (String) -> Unit
) {
    var nameEdit by remember(folder.id) { mutableStateOf(folder.name) }
    var editName by remember { mutableStateOf(false) }

    // Spring animation for open
    val overlayAlpha by animateFloatAsState(1f, tween(250), label = "fo")
    val overlayScale by animateFloatAsState(1f,
        spring(dampingRatio = Spring.DampingRatioLowBouncy, stiffness = Spring.StiffnessMedium), label = "fs")

    Box(Modifier.fillMaxSize()
        .graphicsLayer { alpha = overlayAlpha; scaleX = overlayScale; scaleY = overlayScale }
        .background(Color.Black.copy(0.72f))
        .clickable { onClose() },
        contentAlignment = Alignment.Center) {
        Box(Modifier.fillMaxWidth(0.88f)
            .clickable(enabled = false) {}
            .clip(RoundedCornerShape(22.dp))
            .background(IOSGray2.copy(0.96f))
            .border(0.5.dp, Color.White.copy(0.12f), RoundedCornerShape(22.dp))
            .padding(20.dp)
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                // Folder name
                Row(verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center, modifier = Modifier.fillMaxWidth()) {
                    if (editName) {
                        OutlinedTextField(
                            value = nameEdit,
                            onValueChange = { nameEdit = it },
                            singleLine = true,
                            colors = TextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedContainerColor = Color.White.copy(0.10f),
                                unfocusedContainerColor = Color.White.copy(0.06f),
                                focusedIndicatorColor = AccentBlue,
                                unfocusedIndicatorColor = Color.Transparent
                            ),
                            modifier = Modifier.weight(1f),
                            textStyle = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.SemiBold),
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done)
                        )
                        TextButton(onClick = { onRename(nameEdit); editName = false }) {
                            Text("OK", color = AccentBlue, fontWeight = FontWeight.Bold)
                        }
                    } else {
                        Text(folder.name, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Spacer(Modifier.width(8.dp))
                        Icon(Icons.Default.Edit, null, tint = Color.White.copy(0.5f),
                            modifier = Modifier.size(18.dp).clickable { editName = true })
                    }
                }
                Spacer(Modifier.height(16.dp))

                // App grid inside folder
                LazyVerticalGrid(
                    columns = GridCells.Fixed(3),
                    modifier = Modifier.heightIn(max = 400.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(folder.apps) { pkg ->
                        val app = appMap[pkg] ?: return@items
                        val bmp = remember(pkg) { app.icon.toBitmap(256).asImageBitmap() }
                        Column(horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.clickable { onTapApp(app) }) {
                            Box {
                                Image(BitmapPainter(bmp), app.label,
                                    modifier = Modifier.size(60.dp).clip(ICON_SHAPE),
                                    contentScale = ContentScale.Crop)
                                if (isEditing) {
                                    Box(Modifier.size(20.dp).align(Alignment.TopStart).offset((-4).dp, (-4).dp)
                                        .clip(CircleShape).background(IOSRed)
                                        .clickable { onRemoveApp(pkg) }, contentAlignment = Alignment.Center) {
                                        Text("−", color = Color.White, fontSize = 14.sp,
                                            fontWeight = FontWeight.Bold, lineHeight = 14.sp)
                                    }
                                }
                            }
                            Spacer(Modifier.height(4.dp))
                            Text(app.label, fontSize = 10.sp, color = Color.White, maxLines = 1,
                                overflow = TextOverflow.Ellipsis, textAlign = TextAlign.Center,
                                modifier = Modifier.fillMaxWidth())
                        }
                    }
                }

                Spacer(Modifier.height(14.dp))
                TextButton(onClick = onClose, modifier = Modifier.fillMaxWidth()) {
                    Text("Cerrar", color = AccentBlue, fontSize = 16.sp, fontWeight = FontWeight.Medium)
                }
            }
        }
    }
}
