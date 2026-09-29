package com.toust.toust.launcher

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

// ── Layout Persistence ───────────────────────────────────────────
object LauncherLayout {
    private const val KEY_COUNT = "page_count"
    private const val KEY_DOCK  = "dock_v3"

    fun savePages(ctx: Context, pages: List<List<Slot?>>) {
        val sp = ctx.getSharedPreferences(PREFS_KEY, Context.MODE_PRIVATE).edit()
        sp.putInt(KEY_COUNT, pages.size)
        pages.forEachIndexed { i, page ->
            val arr = JSONArray()
            page.forEach { slot -> arr.put(slot?.toJson() ?: JSONObject.NULL) }
            sp.putString("page_$i", arr.toString())
        }
        sp.apply()
    }

    fun loadPages(ctx: Context): MutableList<MutableList<Slot?>>? {
        val sp = ctx.getSharedPreferences(PREFS_KEY, Context.MODE_PRIVATE)
        val n  = sp.getInt(KEY_COUNT, -1)
        if (n <= 0) return null
        return (0 until n).map { i ->
            val raw = sp.getString("page_$i", "[]") ?: "[]"
            val arr = JSONArray(raw)
            (0 until arr.length()).map { j ->
                if (arr.isNull(j)) null
                else Slot.fromJson(arr.getJSONObject(j))
            }.toMutableList()
        }.toMutableList()
    }

    fun saveDock(ctx: Context, dock: List<String?>) {
        val arr = JSONArray()
        dock.forEach { arr.put(it ?: JSONObject.NULL) }
        ctx.getSharedPreferences(PREFS_KEY, Context.MODE_PRIVATE).edit()
            .putString(KEY_DOCK, arr.toString()).apply()
    }

    fun loadDock(ctx: Context): MutableList<String?> {
        val raw = ctx.getSharedPreferences(PREFS_KEY, Context.MODE_PRIVATE)
            .getString(KEY_DOCK, "[]") ?: "[]"
        return runCatching {
            val arr = JSONArray(raw)
            (0 until arr.length()).map { if (arr.isNull(it)) null else arr.getString(it) }
                .toMutableList()
        }.getOrDefault(MutableList(DOCK_MAX) { null })
    }
}
