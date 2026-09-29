package com.toust.toust

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.SystemClock
import androidx.core.app.NotificationCompat

/**
 * Servicio en primer plano que actúa como guardian del bloqueo:
 *  1. Escucha ACTION_SCREEN_ON  → arma el bloqueo y lanza LockScreenActivity.
 *  2. Escucha ACTION_SCREEN_OFF → marca el dispositivo como "debe estar bloqueado".
 *  3. Escucha ACTION_USER_PRESENT → si el keyguard del sistema se descartó sin que
 *     nosotros lo hayamos desbloqueado, volvemos a mostrar nuestra pantalla.
 *  4. Alarma cada minuto → actualiza la notificación con el PIN (hora) actual.
 */
class PinChangerService : Service() {

    companion object {
        const val CHANNEL_ID       = "pin_changer_v2"   // v2 = recrear canal con IMPORTANCE_MIN
        const val NOTIF_ID         = 1001
        const val INTERVAL_MS      = 60_000L

        const val ACTION_START         = "START"
        const val ACTION_STOP          = "STOP"
        const val ACTION_ALARM_TRIGGER = "com.toust.toust.ALARM_TRIGGER"

        // Estado compartido para la UI de MainActivity
        var lastResult = "Servicio iniciado"
        var isRunning  = false

        /**
         * true  = pantalla encendida y aún no desbloqueada legítimamente.
         * false = usuario pasó el PIN correcto o pantalla apagada.
         */
        var isLocked = false

        fun startService(context: Context) {
            val intent = Intent(context, PinChangerService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                context.startForegroundService(intent)
            else
                context.startService(intent)
        }

        fun stopService(context: Context) {
            val intent = Intent(context, PinChangerService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }

    private lateinit var alarmMgr: AlarmManager

    // ──────────────────────────────────────────────────────────────
    // RECEPTOR DE EVENTOS DEL SISTEMA
    // ──────────────────────────────────────────────────────────────
    private val systemReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {

                // Pantalla encendida → armar bloqueo
                Intent.ACTION_SCREEN_ON -> {
                    isLocked   = true
                    lastResult = "🔒 Pantalla encendida — bloqueo activo"
                    showLockScreen(context)
                }

                // Pantalla apagada → resetear estado para el próximo encendido
                Intent.ACTION_SCREEN_OFF -> {
                    isLocked = true   // Al encenderse de nuevo deberá bloquearse
                }

                // El keyguard del sistema se descartó sin nuestro código PIN →
                // el usuario intentó saltarse nuestra pantalla mediante biometría
                // u otro método del sistema. Volvemos a bloquear.
                Intent.ACTION_USER_PRESENT -> {
                    if (isLocked) {
                        lastResult = "⚠️ Intento de omisión detectado — relanzando bloqueo"
                        showLockScreen(context)
                    }
                }
            }
        }
    }

    // ──────────────────────────────────────────────────────────────
    // CICLO DE VIDA
    // ──────────────────────────────────────────────────────────────

    override fun onCreate() {
        super.onCreate()
        alarmMgr = getSystemService(Context.ALARM_SERVICE) as AlarmManager

        createNotificationChannel()
        startForeground(NOTIF_ID, buildNotification())

        // Registrar receiver con todos los eventos de interés
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_ON)
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_USER_PRESENT)
        }
        registerReceiver(systemReceiver, filter)

        // Arrancar la alarma para actualizar notificación cada minuto
        scheduleNextAlarm()

        // Si la pantalla ya está encendida al arrancar el servicio, bloquear ahora
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        if (pm.isInteractive) {
            isLocked = true
            showLockScreen(this)
        }

        isRunning  = true
        lastResult = "✅ Guardian de pantalla activo"
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_ALARM_TRIGGER -> {
                updateNotification()
                scheduleNextAlarm()
                // Si la pantalla sigue encendida y debería estar bloqueada
                // (por si acaso el receiver no disparó), re-verificar
                val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
                if (pm.isInteractive && isLocked && !LockScreenActivity.isShowing) {
                    showLockScreen(this)
                }
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        try { unregisterReceiver(systemReceiver) } catch (_: Exception) {}
        cancelAlarm()
        isRunning  = false
        lastResult = "⛔ Servicio detenido"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ──────────────────────────────────────────────────────────────
    // MOSTRAR PANTALLA DE BLOQUEO
    // ──────────────────────────────────────────────────────────────

    private fun showLockScreen(context: Context) {
        val intent = Intent(context, LockScreenActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
        }
        context.startActivity(intent)
    }

    // ──────────────────────────────────────────────────────────────
    // ALARMA EXACTA CADA MINUTO
    // ──────────────────────────────────────────────────────────────

    private fun scheduleNextAlarm() {
        alarmMgr.setExactAndAllowWhileIdle(
            AlarmManager.ELAPSED_REALTIME_WAKEUP,
            SystemClock.elapsedRealtime() + INTERVAL_MS,
            getAlarmPendingIntent()
        )
    }

    private fun cancelAlarm() {
        alarmMgr.cancel(getAlarmPendingIntent())
    }

    private fun getAlarmPendingIntent(): PendingIntent {
        val intent = Intent(this, PinChangerService::class.java).apply {
            action = ACTION_ALARM_TRIGGER
        }
        return PendingIntent.getService(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    // ──────────────────────────────────────────────────────────────
    // NOTIFICACIÓN PERSISTENTE
    // ──────────────────────────────────────────────────────────────

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Control de Pantalla",
                NotificationManager.IMPORTANCE_MIN   // Sin icono en barra, colapsado al fondo
            ).apply {
                description     = "Servicio de pantalla de bloqueo activo"
                setShowBadge(false)
                lockscreenVisibility = NotificationCompat.VISIBILITY_SECRET
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun buildNotification() =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setContentTitle("Control de Pantalla activo")
            .setContentText("PIN: ${pinStr()} · toca para abrir")
            .setOngoing(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_MIN)     // Mínima prioridad
            .setVisibility(NotificationCompat.VISIBILITY_SECRET) // Oculto en pantalla de bloqueo
            .setShowWhen(false)
            .setContentIntent(
                PendingIntent.getActivity(
                    this, 0,
                    Intent(this, MainActivity::class.java),
                    PendingIntent.FLAG_IMMUTABLE
                )
            )
            .build()

    private fun updateNotification() {
        getSystemService(NotificationManager::class.java)
            .notify(NOTIF_ID, buildNotification())
    }
}
