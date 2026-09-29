package com.toust.toust

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Se ejecuta al arrancar el dispositivo.
 * Reinicia el PinChangerService automáticamente.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == "com.htc.intent.action.QUICKBOOT_POWERON") {
            PinChangerService.startService(context)
        }
    }
}
