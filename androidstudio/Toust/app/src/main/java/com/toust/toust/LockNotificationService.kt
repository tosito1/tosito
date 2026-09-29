package com.toust.toust

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.toust.toust.launcher.NotificationData
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.CopyOnWriteArrayList

class LockNotificationService : NotificationListenerService() {

    companion object {
        /** Lista thread-safe de notificaciones activas (sin permanentes) */
        val sbnList = CopyOnWriteArrayList<StatusBarNotification>()

        @Volatile var connected = false

        // ── Launcher badge counts (per-package notification count) ──
        private val _badgeCounts = MutableStateFlow<Map<String, Int>>(emptyMap())
        val badgeCounts: StateFlow<Map<String, Int>> = _badgeCounts.asStateFlow()

        // ── Launcher notification data for Notification Center ──
        private val _notifications = MutableStateFlow<List<NotificationData>>(emptyList())
        val notifications: StateFlow<List<NotificationData>> = _notifications.asStateFlow()

        fun clearAll() {
            _notifications.value = emptyList()
            _badgeCounts.value = emptyMap()
        }

        private fun refreshData() {
            // Badge counts
            _badgeCounts.value = sbnList.groupBy { it.packageName }
                .mapValues { it.value.size }

            // Notification data for Notification Center
            _notifications.value = sbnList.mapNotNull { sbn ->
                try {
                    val extras = sbn.notification.extras
                    NotificationData(
                        pkg   = sbn.packageName,
                        title = extras.getCharSequence("android.title")?.toString() ?: "",
                        text  = extras.getCharSequence("android.text")?.toString() ?: "",
                        time  = sbn.postTime
                    )
                } catch (_: Exception) { null }
            }
        }
    }

    // ── Ciclo de vida ─────────────────────────────────────────────

    override fun onListenerConnected() {
        connected = true
        sbnList.clear()
        activeNotifications
            ?.filter { !it.isOngoing }
            ?.let { sbnList.addAll(it) }
        refreshData()
    }

    override fun onListenerDisconnected() {
        connected = false
        sbnList.clear()
        refreshData()
    }

    // ── Eventos ───────────────────────────────────────────────────

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        if (sbn.isOngoing) return
        sbnList.removeAll { it.key == sbn.key }
        sbnList.add(0, sbn)
        // Mantener máximo 50 entradas
        while (sbnList.size > 50) sbnList.removeAt(sbnList.lastIndex)
        refreshData()
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        sbnList.removeAll { it.key == sbn.key }
        refreshData()
    }
}
