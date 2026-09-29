package com.toust.remotepc.ui.components

import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput

@Composable
fun TrackpadLayer(
    modifier: Modifier,
    onMoveRel: (Float, Float) -> Unit,
    onTap: () -> Unit,
    onTwoFingerTap: () -> Unit,
    onDoubleTap: () -> Unit,
    onScroll: (Int) -> Unit
) {
    var lastX by remember { mutableFloatStateOf(0f) }
    var lastY by remember { mutableFloatStateOf(0f) }
    var moved by remember { mutableStateOf(false) }
    var touchStartTime by remember { mutableLongStateOf(0L) }
    var fingerCount by remember { mutableIntStateOf(0) }
    var lastTapTime by remember { mutableLongStateOf(0L) }

    Box(modifier = modifier.pointerInput(Unit) {
        awaitEachGesture {
            val down = awaitFirstDown(requireUnconsumed = false)
            lastX = down.position.x; lastY = down.position.y
            moved = false; touchStartTime = System.currentTimeMillis(); fingerCount = 1

            do {
                val event = awaitPointerEvent()
                val ptrs = event.changes.filter { it.pressed }
                if (ptrs.size > fingerCount) fingerCount = ptrs.size
                if (ptrs.isNotEmpty()) {
                    val p = ptrs.first()
                    val dx = p.position.x - lastX; val dy = p.position.y - lastY
                    if (ptrs.size == 2) {
                        val avgY = ptrs.map { it.position.y }.average().toFloat()
                        val scrollDelta = ((lastY - avgY) * 10).toInt()
                        if (kotlin.math.abs(scrollDelta) > 15) { onScroll(scrollDelta); moved = true }
                    } else if (kotlin.math.abs(dx) > 1.5f || kotlin.math.abs(dy) > 1.5f) {
                        val a = if (kotlin.math.abs(dx) > 10f || kotlin.math.abs(dy) > 10f) 1.5f else 1.0f
                        onMoveRel(dx * a, dy * a); moved = true
                    }
                    lastX = p.position.x; lastY = p.position.y; p.consume()
                }
            } while (event.changes.any { it.pressed })

            val elapsed = System.currentTimeMillis() - touchStartTime
            if (!moved && elapsed < 250) {
                if (fingerCount >= 2) { onTwoFingerTap() }
                else {
                    val now = System.currentTimeMillis()
                    if (now - lastTapTime < 300) { onDoubleTap(); lastTapTime = 0 }
                    else { onTap(); lastTapTime = now }
                }
            }
        }
    })
}
