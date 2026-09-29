package com.toust.tosito.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.toust.tosito.utils.NotificationHelper
import java.util.Calendar

class NotificationReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val type = intent.getStringExtra("EXTRA_TYPE") ?: return
        
        when (type) {
            "CALENDAR" -> {
                val title = intent.getStringExtra("EXTRA_TITLE") ?: "Evento próximo"
                val msg = intent.getStringExtra("EXTRA_MESSAGE") ?: "Tienes un evento en 15 minutos."
                val id = intent.getIntExtra("EXTRA_ID", 200)
                NotificationHelper.sendCalendarNotification(context, title, msg, id)
            }
            "DAILY_MORNING" -> {
                // Here we would ideally fetch data from DB to see if there is gym/meals today.
                // For simplicity in testing the notification, we just send a static one or if extra strings are provided.
                val title = intent.getStringExtra("EXTRA_TITLE") ?: "¡Buenos días!"
                val msg = intent.getStringExtra("EXTRA_MESSAGE") ?: "Revisa tu plan del día en Tosito."
                NotificationHelper.sendDailyNotification(context, title, msg, 300)
                
                // Reschedule for next day
                NotificationScheduler.scheduleDailyMorningAlert(context)
            }
        }
    }
}
