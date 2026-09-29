package com.toust.toust.launcher

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

// ── Constants ────────────────────────────────────────────────────
const val COLS      = 4
const val ROWS      = 6
const val PER_PAGE  = COLS * ROWS
const val DOCK_MAX  = 4
val ICON_SIZE       = 60.dp
val ICON_SHAPE      = RoundedCornerShape(13.dp)
val AccentBlue      = Color(0xFF0A84FF)
const val PREFS_KEY = "launcher_layout_v3"

// ── Color palette ────────────────────────────────────────────────
val IOSDark         = Color(0xFF050510)
val IOSGray1        = Color(0xFF1C1C1E)
val IOSGray2        = Color(0xFF2C2C2E)
val IOSGray3        = Color(0xFF3A3A3C)
val IOSGray4        = Color(0xFF8E8E93)
val IOSRed          = Color(0xFFFF3B30)
val IOSGreen        = Color(0xFF34C759)
val IOSOrange       = Color(0xFFFF9F0A)
val IOSTeal         = Color(0xFF5AC8FA)
val IOSPurple       = Color(0xFF5E5CE6)

// ── Slot model (App or Folder) ───────────────────────────────────
sealed class Slot {
    data class App(val pkg: String) : Slot()
    data class Folder(
        val id: String = UUID.randomUUID().toString(),
        val name: String,
        val apps: List<String>
    ) : Slot()

    fun toJson(): JSONObject = when (this) {
        is App    -> JSONObject().put("t", "a").put("p", pkg)
        is Folder -> JSONObject().put("t", "f")
                        .put("id", id).put("n", name)
                        .put("apps", JSONArray(apps))
    }

    companion object {
        fun fromJson(obj: JSONObject): Slot? = runCatching {
            when (obj.getString("t")) {
                "a"  -> App(obj.getString("p"))
                "f"  -> {
                    val arr  = obj.getJSONArray("apps")
                    val list = (0 until arr.length()).map { arr.getString(it) }
                    Folder(obj.getString("id"), obj.getString("n"), list)
                }
                else -> null
            }
        }.getOrNull()
    }
}

// ── Data models ──────────────────────────────────────────────────
data class AppInfo(
    val label: String,
    val packageName: String,
    val activityName: String,
    val icon: Drawable
)

data class DragState(
    val slotOrigin: Slot,
    val fromPage: Int,
    val fromSlot: Int,
    val fromDock: Boolean = false,
    var offset: androidx.compose.ui.geometry.Offset = androidx.compose.ui.geometry.Offset.Zero,
    var mergeTarget: Pair<Int,Int>? = null
) {
    val pkg get() = when (slotOrigin) { is Slot.App -> slotOrigin.pkg; else -> "" }
}

// ── Notification badge data ──────────────────────────────────────
data class NotificationData(
    val pkg: String,
    val title: String,
    val text: String,
    val time: Long,
    val icon: Drawable? = null
)

// ── Helpers ──────────────────────────────────────────────────────
fun Drawable.toBitmap(size: Int = 256): Bitmap {
    if (this is BitmapDrawable && bitmap != null && bitmap!!.width > 0) return bitmap!!
    val bm = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    Canvas(bm).also { c -> setBounds(0, 0, c.width, c.height); draw(c) }
    return bm
}
