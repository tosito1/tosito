package com.toust.toust

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Receptor de alarma de respaldo.
 * La alarma principal ya apunta directamente al servicio via PendingIntent.getService().
 * Este receiver actúa como resguardo extra para el caso de que el S.O.
 * use BroadcastReceiver en lugar de Service (según versión de Android).
 */
class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // Rearrancar el servicio si fue matado por el sistema
        PinChangerService.startService(context)
    }
}
