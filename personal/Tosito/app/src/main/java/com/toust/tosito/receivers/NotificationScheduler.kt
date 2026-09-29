package com.toust.tosito.receivers

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import java.util.Calendar

object NotificationScheduler {
    fun scheduleCalendarEvent(context: Context, eventId: Int, eventTimeInMillis: Long, title: String) {
        val prefs = context.getSharedPreferences("TositoPrefs", Context.MODE_PRIVATE)
        val offsetMinutes = prefs.getInt("calendar_alert_offset", 15)

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, NotificationReceiver::class.java).apply {
            putExtra("EXTRA_TYPE", "CALENDAR")
            putExtra("EXTRA_TITLE", "Evento próximo")
            putExtra("EXTRA_MESSAGE", title)
            putExtra("EXTRA_ID", eventId)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            eventId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Schedule before event
        val triggerAtMillis = eventTimeInMillis - (offsetMinutes * 60 * 1000)
        
        // Don't schedule in the past
        if (triggerAtMillis > System.currentTimeMillis()) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
                } else {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
                }
            } catch (e: SecurityException) {
                // Ignore if permission SCHEDULE_EXACT_ALARM is missing (Android 14+)
            }
        }
    }

    fun scheduleDailyMorningAlert(context: Context) {
        val prefs = context.getSharedPreferences("TositoPrefs", Context.MODE_PRIVATE)
        val hour = prefs.getInt("morning_alert_hour", 8)
        val minute = prefs.getInt("morning_alert_minute", 0)

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, NotificationReceiver::class.java).apply {
            putExtra("EXTRA_TYPE", "DAILY_MORNING")
            putExtra("EXTRA_TITLE", "¡Buenos días!")
            putExtra("EXTRA_MESSAGE", "Toca entrenar y cumplir tus macros de hoy.")
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            1001, // daily id
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            
            // If it's already past the time, schedule for tomorrow
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, calendar.timeInMillis, pendingIntent)
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, calendar.timeInMillis, pendingIntent)
            }
        } catch (e: SecurityException) {
            // Ignore if permission SCHEDULE_EXACT_ALARM is missing
        }
    }

    fun scheduleWeeklySummaryAlert(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, NotificationReceiver::class.java).apply {
            putExtra("EXTRA_TYPE", "WEEKLY_SUMMARY")
            putExtra("EXTRA_TITLE", "Resumen Semanal Disponible 📊")
            putExtra("EXTRA_MESSAGE", "Toca para ver cómo te ha ido esta semana con el gym, tu dieta y tus finanzas.")
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            2002, // weekly id
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Find next Sunday at 20:00 (8:00 PM)
        val calendar = Calendar.getInstance().apply {
            set(Calendar.DAY_OF_WEEK, Calendar.SUNDAY)
            set(Calendar.HOUR_OF_DAY, 20)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.WEEK_OF_YEAR, 1)
            }
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, calendar.timeInMillis, pendingIntent)
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, calendar.timeInMillis, pendingIntent)
            }
        } catch (e: SecurityException) {
            // Ignore
        }
    }
}
