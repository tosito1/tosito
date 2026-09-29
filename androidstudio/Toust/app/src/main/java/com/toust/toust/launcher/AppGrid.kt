package com.toust.toust.launcher

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.PagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.input.pointer.*
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import kotlin.math.absoluteValue

// ── App Grid (Draggable) ─────────────────────────────────────────
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun AppGridDraggable(
    slots: List<Slot?>,
    page: Int,
    isEditing: Boolean,
    pagerState: PagerState,
    dragState: DragState?,
    appMap: Map<String, AppInfo>,
    badgeCounts: Map<String, Int>,
    onTapApp: (AppInfo) -> Unit,
    onTapFolder: (Slot.Folder, Int, Int) -> Unit,
    onLongPress: (slot: Int, Slot) -> Unit,
    onDragMove: (Offset) -> Unit,
    onDropInSlot: (slot: Int) -> Unit,
    onCancelDrag: () -> Unit
) {
    val pageOff   = (pagerState.currentPage - page) + pagerState.currentPageOffsetFraction
    val scl       = 1f - (pageOff.absoluteValue * 0.04f).coerceIn(0f, 0.04f)
    val slotPos   = remember { mutableStateMapOf<Int, Offset>() }

    Column(
        Modifier.fillMaxSize()
            .graphicsLayer { scaleX = scl; scaleY = scl }
            .padding(horizontal = 8.dp, vertical = 4.dp),
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        var idx = 0
        repeat(ROWS) {
            Row(Modifier.fillMaxWidth().weight(1f),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically) {
                repeat(COLS) {
                    val slotIdx   = idx++
                    val slot      = slots.getOrNull(slotIdx)
                    val dragging  = dragState?.fromPage == page && dragState.fromSlot == slotIdx
                    val hovered   = dragState?.let { ds ->
                        slotPos[slotIdx]?.let { pos -> (ds.offset - pos).getDistance() < 80f } == true
                    } == true

                    Box(Modifier.weight(1f).fillMaxHeight()
                        .onGloballyPositioned { c -> slotPos[slotIdx] = c.positionInRoot() },
                        contentAlignment = Alignment.Center) {
                        when {
                            dragging -> Box(Modifier.size(ICON_SIZE).clip(ICON_SHAPE)
                                .background(Color.White.copy(0.08f))
                                .border(1.dp, Color.White.copy(0.20f), ICON_SHAPE))
                            slot is Slot.App -> {
                                val app = appMap[slot.pkg]
                                if (app != null) DraggableAppIcon(
                                    app          = app,
                                    isEditing    = isEditing,
                                    badgeCount   = badgeCounts[slot.pkg] ?: 0,
                                    isMergeTarget = hovered && dragState?.slotOrigin is Slot.App,
                                    onTap        = { onTapApp(app) },
                                    onLongPress  = { off -> onLongPress(slotIdx, slot); onDragMove(off) },
                                    onDragChange = { off -> onDragMove(off) },
                                    onDragEnd    = {
                                        val best = slotPos.minByOrNull { (_, p) ->
                                            dragState?.offset?.let { it - p }?.getDistance() ?: Float.MAX_VALUE
                                        }?.key
                                        if (best != null) onDropInSlot(best) else onCancelDrag()
                                    },
                                    onDragCancel = onCancelDrag
                                )
                            }
                            slot is Slot.Folder -> FolderIcon(
                                folder    = slot,
                                appMap    = appMap,
                                isEditing = isEditing,
                                isMergeTarget = hovered && dragState?.slotOrigin is Slot.App,
                                onTap     = { onTapFolder(slot, page, slotIdx) },
                                onLongPress = { off -> onLongPress(slotIdx, slot); onDragMove(off) },
                                onDragChange = { off -> onDragMove(off) },
                                onDragEnd   = {
                                    val best = slotPos.minByOrNull { (_, p) ->
                                        dragState?.offset?.let { it - p }?.getDistance() ?: Float.MAX_VALUE
                                    }?.key
                                    if (best != null) onDropInSlot(best) else onCancelDrag()
                                },
                                onDragCancel = onCancelDrag
                            )
                        }
                    }
                }
            }
        }
    }
}

// ── Draggable App Icon ───────────────────────────────────────────
@Composable
fun DraggableAppIcon(
    app: AppInfo,
    isEditing: Boolean,
    badgeCount: Int = 0,
    isMergeTarget: Boolean = false,
    onTap: () -> Unit,
    onLongPress: (Offset) -> Unit,
    onDragChange: (Offset) -> Unit,
    onDragEnd: () -> Unit,
    onDragCancel: () -> Unit
) {
    val inf       = rememberInfiniteTransition(label = "j")
    // Random phase per icon for more natural jiggle
    val phase     = remember { (Math.random() * 1000).toInt() }
    val jiggle    by inf.animateFloat(-2.5f, 2.5f,
        infiniteRepeatable(tween(if (isEditing) (85 + phase % 20) else Int.MAX_VALUE, easing = LinearEasing),
            RepeatMode.Reverse), "rot")
    val pressScl  = remember { Animatable(1f) }
    val scope     = rememberCoroutineScope()
    val icon      = remember(app.packageName) { app.icon.toBitmap(256).asImageBitmap() }
    val targetScl = if (isMergeTarget) 1.15f else 1f

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .rotate(if (isEditing) jiggle else 0f)
            .scale(pressScl.value * targetScl)
            .pointerInput(isEditing) {
                if (!isEditing) detectTapGestures(
                    onPress = {
                        scope.launch { pressScl.animateTo(0.87f, tween(70)) }
                        tryAwaitRelease()
                        scope.launch { pressScl.animateTo(1f, spring()) }
                    },
                    onTap       = { onTap() },
                    onLongPress = { off -> onLongPress(off) }
                )
            }
            .pointerInput(isEditing) {
                if (isEditing) detectDragGestures(
                    onDragStart  = { startOffset -> onLongPress(startOffset) },
                    onDrag       = { change, _ -> onDragChange(change.position) },
                    onDragEnd    = { onDragEnd() },
                    onDragCancel = { onDragCancel() }
                )
            }
    ) {
        Box {
            // Shadow
            Box(Modifier.size(ICON_SIZE).shadow(12.dp, ICON_SHAPE,
                ambientColor = Color.Black.copy(0.5f), spotColor = Color.Black.copy(0.4f)))
            // Icon
            Image(BitmapPainter(icon), app.label,
                modifier = Modifier.size(ICON_SIZE).clip(ICON_SHAPE), contentScale = ContentScale.Crop)
            // Shine overlay
            Box(Modifier.size(ICON_SIZE).clip(ICON_SHAPE).background(
                Brush.verticalGradient(listOf(Color.White.copy(0.22f), Color.Transparent),
                    endY = ICON_SIZE.value * 0.50f)))

            // Notification badge
            if (badgeCount > 0 && !isEditing) {
                val badgeText = if (badgeCount > 99) "99+" else "$badgeCount"
                val badgeWidth = if (badgeCount > 9) 24.dp else 20.dp
                Box(
                    Modifier.align(Alignment.TopEnd).offset(4.dp, (-4).dp)
                        .height(20.dp).widthIn(min = badgeWidth)
                        .clip(RoundedCornerShape(10.dp))
                        .background(IOSRed),
                    contentAlignment = Alignment.Center
                ) {
                    Text(badgeText, color = Color.White, fontSize = 11.sp,
                        fontWeight = FontWeight.Bold, lineHeight = 11.sp)
                }
            }

            // Delete badge (edit mode)
            val btnScl by animateFloatAsState(if (isEditing) 1f else 0f,
                spring(dampingRatio = Spring.DampingRatioMediumBouncy), label = "del")
            if (isEditing || btnScl > 0f) {
                Box(
                    Modifier.size(20.dp).align(Alignment.TopStart).offset((-4).dp, (-4).dp)
                        .graphicsLayer { scaleX=btnScl; scaleY=btnScl; alpha=btnScl }
                        .clip(CircleShape).background(IOSGray1)
                        .border(1.5.dp, Color.White.copy(0.85f), CircleShape),
                    contentAlignment = Alignment.Center
                ) { Text("−", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold,
                    lineHeight = 14.sp) }
            }
        }
        Spacer(Modifier.height(4.dp))
        Text(app.label, fontSize = 11.sp, color = Color.White, textAlign = TextAlign.Center,
            maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.width(ICON_SIZE + 10.dp),
            style = TextStyle(shadow = androidx.compose.ui.graphics.Shadow(
                Color.Black.copy(0.70f), Offset(0f,1f), 4f)))
    }
}

// ── Folder Icon ──────────────────────────────────────────────────
@Composable
fun FolderIcon(
    folder: Slot.Folder,
    appMap: Map<String, AppInfo>,
    isEditing: Boolean,
    isMergeTarget: Boolean = false,
    onTap: () -> Unit,
    onLongPress: (Offset) -> Unit,
    onDragChange: (Offset) -> Unit,
    onDragEnd: () -> Unit,
    onDragCancel: () -> Unit
) {
    val inf       = rememberInfiniteTransition(label = "fj")
    val phase     = remember { (Math.random() * 1000).toInt() }
    val jiggle    by inf.animateFloat(-2.5f, 2.5f,
        infiniteRepeatable(tween(if (isEditing) (85 + phase % 20) else Int.MAX_VALUE),
            RepeatMode.Reverse), "frot")
    val scope     = rememberCoroutineScope()
    val pressScl  = remember { Animatable(1f) }
    val targetScl = if (isMergeTarget) 1.14f else 1f

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .rotate(if (isEditing) jiggle else 0f)
            .scale(pressScl.value * targetScl)
            .pointerInput(isEditing) {
                if (!isEditing) detectTapGestures(
                    onPress = {
                        scope.launch { pressScl.animateTo(0.87f, tween(70)) }
                        tryAwaitRelease()
                        scope.launch { pressScl.animateTo(1f, spring()) }
                    },
                    onTap       = { onTap() },
                    onLongPress = { onLongPress(it) }
                )
            }
            .pointerInput(isEditing) {
                if (isEditing) detectDragGestures(
                    onDragStart  = { onLongPress(it) },
                    onDrag       = { _, _ -> },
                    onDragEnd    = { onDragEnd() },
                    onDragCancel = { onDragCancel() }
                )
            }
    ) {
        FolderIconMini(folder, appMap, Modifier.size(ICON_SIZE))
        Spacer(Modifier.height(4.dp))
        Text(folder.name, fontSize = 11.sp, color = Color.White, textAlign = TextAlign.Center,
            maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.width(ICON_SIZE + 10.dp),
            style = TextStyle(shadow = androidx.compose.ui.graphics.Shadow(
                Color.Black.copy(0.70f), Offset(0f,1f), 4f)))
    }
}

// ── Folder Mini Icon ─────────────────────────────────────────────
@Composable
fun FolderIconMini(folder: Slot.Folder, appMap: Map<String, AppInfo>, modifier: Modifier) {
    Box(modifier.clip(ICON_SHAPE).background(
        Brush.linearGradient(listOf(Color(0xFF3A3A56).copy(0.85f), Color(0xFF1C1C2E).copy(0.90f)))
    ).border(0.6.dp, Color.White.copy(0.22f), ICON_SHAPE)) {
        val preview = folder.apps.take(9)
        val cols3   = 3
        val cellSz  = ICON_SIZE * 0.27f

        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(verticalArrangement = Arrangement.spacedBy(2.dp),
                horizontalAlignment = Alignment.CenterHorizontally) {
                for (row in 0 until minOf(3, kotlin.math.ceil(preview.size / cols3.toFloat()).toInt())) {
                    Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                        for (col in 0 until cols3) {
                            val i = row * cols3 + col
                            if (i < preview.size) {
                                val bmp = remember(preview[i]) {
                                    appMap[preview[i]]?.icon?.toBitmap(64)?.asImageBitmap()
                                }
                                if (bmp != null) Image(BitmapPainter(bmp), null,
                                    modifier = Modifier.size(cellSz).clip(RoundedCornerShape(4.dp)),
                                    contentScale = ContentScale.Crop)
                                else Box(Modifier.size(cellSz).background(Color.White.copy(0.10f),
                                    RoundedCornerShape(4.dp)))
                            } else {
                                Box(Modifier.size(cellSz))
                            }
                        }
                    }
                }
            }
        }
        // Badge if many apps
        if (folder.apps.size > 9) {
            Box(
                Modifier.align(Alignment.TopEnd).offset((-2).dp, 2.dp)
                    .size(16.dp).clip(CircleShape).background(IOSRed),
                contentAlignment = Alignment.Center
            ) {
                Text("${folder.apps.size - 9}+", fontSize = 7.sp, color = Color.White,
                    fontWeight = FontWeight.Bold)
            }
        }
    }
}
