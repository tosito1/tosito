package com.toust.toust

import android.content.Context
import android.content.SharedPreferences

object LockPrefs {
    const val PREFS = "lock_prefs"

    // ── Autenticación ─────────────────────────────────────────────
    const val BIOMETRIC_ENABLED  = "biometric_enabled"
    const val MASTER_PIN_ENABLED = "master_pin_enabled"
    const val MASTER_PIN         = "master_pin"

    // ── Modo vacaciones (PIN fijo) ────────────────────────────────
    const val VACATION_MODE = "vacation_mode"
    const val VACATION_PIN  = "vacation_pin"

    // ── Seguridad / intentos ──────────────────────────────────────
    const val FAIL_COUNT      = "fail_count"
    const val LOCKOUT_UNTIL   = "lockout_until"   // epoch ms
    const val LOCKOUT_ENABLED = "lockout_enabled"  // default true
    const val ALERT_ON_FAIL   = "alert_on_fail"    // notif al propietario
    const val INTRUDER_PHOTO  = "intruder_photo"   // foto con cámara frontal

    // ── Historial de intentos ─────────────────────────────────────
    const val ATTEMPT_LOG      = "attempt_log"     // TS:OK|FAIL\n...
    const val MAX_LOG_ENTRIES  = 60

    // ── Pantalla de bloqueo ───────────────────────────────────────
    const val SHOW_NOTIFS  = "show_notifications"
    const val SHOW_MEDIA   = "show_media_controls"

    // ── Helpers ───────────────────────────────────────────────────

    fun prefs(ctx: Context): SharedPreferences =
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    /** Devuelve el PIN correcto según el modo activo */
    fun expectedPin(ctx: Context): String {
        val p = prefs(ctx)
        return if (p.getBoolean(VACATION_MODE, false))
            p.getString(VACATION_PIN, "0000") ?: "0000"
        else
            pinStr()
    }

    /** Comprueba si el PIN introducido es válido (tiempo, vacaciones o maestro) */
    fun isValidPin(ctx: Context, entered: String): Boolean {
        val p = prefs(ctx)
        if (entered == expectedPin(ctx)) return true
        if (p.getBoolean(MASTER_PIN_ENABLED, false)) {
            val master = p.getString(MASTER_PIN, "") ?: ""
            if (master.isNotBlank() && entered == master) return true
        }
        return false
    }

    /** Registra un intento en el historial */
    fun logAttempt(ctx: Context, success: Boolean) {
        val p   = prefs(ctx)
        val old = p.getString(ATTEMPT_LOG, "") ?: ""
        val entry = "${System.currentTimeMillis()}:${if (success) "OK" else "FAIL"}"
        val lines = old.split("\n").filter { it.isNotBlank() }
        val updated = (listOf(entry) + lines).take(MAX_LOG_ENTRIES).joinToString("\n")
        p.edit().putString(ATTEMPT_LOG, updated).apply()
    }

    /** Incrementa contador y devuelve el total de fallos */
    fun registerFail(ctx: Context): Int {
        val p    = prefs(ctx)
        val fails = p.getInt(FAIL_COUNT, 0) + 1
        p.edit().putInt(FAIL_COUNT, fails).apply()
        // Calcular duración del bloqueo
        if (p.getBoolean(LOCKOUT_ENABLED, true) && fails % 5 == 0) {
            val ms = when {
                fails >= 20 -> 3_600_000L   // 1 hora
                fails >= 10 -> 300_000L     // 5 min
                else        -> 30_000L      // 30 s
            }
            p.edit().putLong(LOCKOUT_UNTIL, System.currentTimeMillis() + ms).apply()
        }
        return fails
    }

    /** Resetea el contador tras desbloqueo correcto */
    fun resetFails(ctx: Context) {
        prefs(ctx).edit()
            .putInt(FAIL_COUNT, 0)
            .putLong(LOCKOUT_UNTIL, 0L)
            .apply()
    }

    /** True si el dispositivo está en período de bloqueo temporal */
    fun isLockedOut(ctx: Context): Boolean =
        System.currentTimeMillis() < prefs(ctx).getLong(LOCKOUT_UNTIL, 0L)

    /** Ms restantes de bloqueo (0 si no hay bloqueo) */
    fun lockoutRemainingMs(ctx: Context): Long =
        (prefs(ctx).getLong(LOCKOUT_UNTIL, 0L) - System.currentTimeMillis()).coerceAtLeast(0L)
}
