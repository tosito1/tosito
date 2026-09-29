package com.toust.tosito.utils

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import com.toust.tosito.R

object NotificationHelper {
    private const val CHANNEL_CALENDAR = "calendar_alerts"
    private const val CHANNEL_DAILY = "daily_alerts"

    fun createChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            val calChannel = NotificationChannel(
                CHANNEL_CALENDAR,
                "Eventos del Calendario",
                NotificationManager.IMPORTANCE_HIGH
            )
            val dailyChannel = NotificationChannel(
                CHANNEL_DAILY,
                "Avisos Diarios",
                NotificationManager.IMPORTANCE_DEFAULT
            )

            manager.createNotificationChannel(calChannel)
            manager.createNotificationChannel(dailyChannel)
        }
    }

    fun sendCalendarNotification(context: Context, title: String, message: String, eventId: Int) {
        val builder = NotificationCompat.Builder(context, CHANNEL_CALENDAR)
            .setSmallIcon(android.R.drawable.ic_menu_today)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(eventId, builder.build())
    }

    fun sendDailyNotification(context: Context, title: String, message: String, notifId: Int) {
        val builder = NotificationCompat.Builder(context, CHANNEL_DAILY)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(notifId, builder.build())
    }
}
