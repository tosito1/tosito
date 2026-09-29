package com.toust.tosito.services

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.toust.tosito.data.model.Transaction
import com.toust.tosito.data.model.TransactionCategory
import com.toust.tosito.data.model.TransactionType
import com.toust.tosito.data.repository.SavingsRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

class ChargeNotificationListenerService : NotificationListenerService() {

    private val tag = "ChargeNotifListener"
    private val repository = SavingsRepository()
    
    // Para evitar duplicados cuando llegan 2 notificaciones seguidas por el mismo cargo
    private val recentCharges = mutableMapOf<Double, Long>()

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d(tag, "Notification listener conectado. Revisando notificaciones activas...")
        


        try {
            val activeNotifs = activeNotifications
            activeNotifs?.forEach { sbn ->
                onNotificationPosted(sbn)
            }
        } catch (e: Exception) {
            Log.e(tag, "Error al leer notificaciones activas", e)
        }
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val notification = sbn.notification
        val tickerText = notification.tickerText?.toString() ?: ""
        
        val extras = notification.extras
        val title = extras?.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras?.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        
        // Extraer TODO el texto posible de la notificación para no perdernos detalles
        val sb = StringBuilder()
        sb.append(tickerText).append(" ")
        sb.append(title).append(" ")
        sb.append(text).append(" ")
        
        if (extras != null) {
            for (key in extras.keySet()) {
                val value = extras.get(key)
                if (value is CharSequence) {
                    sb.append(value.toString()).append(" ")
                } else if (value is Array<*>) {
                    value.forEach { if (it is CharSequence) sb.append(it.toString()).append(" ") }
                }
            }
        }

        val fullText = sb.toString().lowercase()
        Log.d(tag, "Notificación recibida de ${sbn.packageName}: $fullText")

        // Ignoramos notificaciones del sistema base (TEMPORALMENTE permitimos las nuestras para testear)
        if (sbn.packageName == "android" || sbn.packageName == "com.android.systemui") return

        // Detección genérica de palabras clave de cargos
        val isCharge = fullText.contains("cargo") || 
                       fullText.contains("compra") || 
                       fullText.contains("pago") || 
                       fullText.contains("has pagado") ||
                       fullText.contains("mastercard") ||
                       fullText.contains("visa") ||
                       fullText.contains("bizum") ||
                       fullText.contains("mercadona") || // Añadimos comercios comunes por si la notificación es solo "Mercadona - 5,79€"
                       fullText.contains("carrefour") ||
                       fullText.contains("uber") ||
                       (fullText.contains("tarjeta") && !fullText.contains("ingreso")) ||
                       (fullText.contains("debito") && !fullText.contains("ingreso")) ||
                       (fullText.contains("débito") && !fullText.contains("ingreso"))
                       


        if (isCharge) {
            // Evitar procesar EXACTAMENTE la misma notificación si la app se reinicia
            val prefs = getSharedPreferences("TositoNotifs", Context.MODE_PRIVATE)
            val notifKey = "${sbn.packageName}_${sbn.postTime}"
            if (prefs.getBoolean(notifKey, false)) {
                Log.d(tag, "Notificación ya procesada anteriormente, ignorando: $notifKey")
                return
            }

            val amount = extractAmount(fullText)
            


            if (amount != null && amount > 0) {
                // Guardamos que ya la hemos procesado
                prefs.edit().putBoolean(notifKey, true).apply()
                
                // Prevenir duplicados en un margen de 2 minutos (por si llegan 2 notis distintas del mismo cargo)
                val now = System.currentTimeMillis()
                val lastTime = recentCharges[amount]
                
                if (lastTime == null || (now - lastTime > 120_000)) {
                    recentCharges[amount] = now
                    saveTransaction(amount, sbn.packageName, title, text, fullText)
                } else {
                    Log.d(tag, "Cargo duplicado ignorado por tiempo: $amount")
                }
            }
        }
        
        // Limpiar caché vieja (más de 5 minutos)
        val limit = System.currentTimeMillis() - 300_000
        recentCharges.entries.removeIf { it.value < limit }
    }

    private fun extractAmount(text: String): Double? {
        // Busca un patrón explícito con moneda: "7,5 euros", "12€", "12.50 €", "5,79 eur"
        val explicitRegex = Regex("""(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros|euro|eur|usd)""", RegexOption.IGNORE_CASE)
        val explicitMatch = explicitRegex.find(text)
        if (explicitMatch != null) {
            return explicitMatch.groupValues[1].replace(",", ".").toDoubleOrNull()
        }

        // Busca patrón con la moneda al principio: "€ 5,79", "EUR 12.50"
        val explicitRegex2 = Regex("""(?:€|euros|euro|eur|usd)\s*(\d+(?:[.,]\d{1,2})?)""", RegexOption.IGNORE_CASE)
        val explicitMatch2 = explicitRegex2.find(text)
        if (explicitMatch2 != null) {
            return explicitMatch2.groupValues[1].replace(",", ".").toDoubleOrNull()
        }

        // Si no hay moneda, busca un número con decimales: "12,50", "12.50"
        val decimalRegex = Regex("""(\d+[.,]\d{1,2})(?!\d)""")
        val match = decimalRegex.find(text)
        return match?.groupValues?.get(1)?.replace(",", ".")?.toDoubleOrNull()
    }

    private fun saveTransaction(amount: Double, packageName: String, title: String, text: String, fullText: String) {
        val userId = FirebaseAuth.getInstance().currentUser?.uid
        if (userId.isNullOrEmpty()) {
            Log.d(tag, "No hay usuario autenticado. No se puede guardar.")

            return
        }

        val description = if (title.isNotBlank() && title.length < 30) title else "Cargo detectado automáticamente"
        
        val tx = Transaction(
            type = TransactionType.EXPENSE,
            category = autoCategorize(fullText),
            amount = amount,
            description = description,
            date = repository.getTodayDate(),
            yearMonth = repository.getCurrentYearMonth()
        )

        CoroutineScope(Dispatchers.IO).launch {
            val success = repository.saveTransaction(tx, userId)
            if (success) {
                Log.d(tag, "Transacción guardada exitosamente: $amount, $description")
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    android.widget.Toast.makeText(applicationContext, "Tosito: Gasto de $amount€ guardado", android.widget.Toast.LENGTH_LONG).show()
                }
                checkBudgetAlert(userId)
            } else {
                Log.e(tag, "Fallo al guardar la transacción detectada.")
            }
        }
    }

    private fun autoCategorize(text: String): TransactionCategory {
        val t = text.lowercase()
        return when {
            t.contains("mercadona") || t.contains("carrefour") || t.contains("lidl") || t.contains("dia") || t.contains("alcampo") -> TransactionCategory.ALIMENTACION
            t.contains("uber") || t.contains("cabify") || t.contains("taxi") || t.contains("repsol") || t.contains("cep") || t.contains("renfe") || t.contains("alsa") -> TransactionCategory.TRANSPORTE
            t.contains("netflix") || t.contains("spotify") || t.contains("amazon") || t.contains("hbo") || t.contains("disney") || t.contains("youtube") -> TransactionCategory.SUSCRIPCION
            t.contains("zara") || t.contains("h&m") || t.contains("pull") || t.contains("mango") || t.contains("nike") -> TransactionCategory.ROPA
            t.contains("farmacia") || t.contains("sanitas") || t.contains("clinica") -> TransactionCategory.SALUD
            t.contains("restaurante") || t.contains("burger") || t.contains("mcdonalds") || t.contains("pizza") || t.contains("bar") || t.contains("kfc") -> TransactionCategory.RESTAURANTE
            t.contains("cine") || t.contains("teatro") || t.contains("entrada") || t.contains("ticketmaster") -> TransactionCategory.OCIO
            else -> TransactionCategory.OTRO_GASTO
        }
    }

    private suspend fun checkBudgetAlert(userId: String) {
        val prefs = getSharedPreferences("TositoPrefs", Context.MODE_PRIVATE)
        val limit = prefs.getFloat("budget_limit", 500f).toDouble()

        val month = repository.getCurrentYearMonth()
        val txs = repository.getTransactionsByMonth(userId, month)
        val totalExpenses = txs.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amount }

        if (totalExpenses >= limit) {
            sendBudgetNotification("¡Presupuesto superado!", "Has gastado %.2f€ este mes, superando tu límite de %.0f€.".format(totalExpenses, limit), 101)
        } else if (totalExpenses >= limit * 0.8) {
            sendBudgetNotification("Presupuesto al 80%", "Llevas gastados %.2f€ de tu límite de %.0f€.".format(totalExpenses, limit), 102)
        }
    }

    private fun sendBudgetNotification(title: String, text: String, notifId: Int) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel("budget_alerts", "Alertas de Presupuesto", NotificationManager.IMPORTANCE_HIGH)
            manager.createNotificationChannel(channel)
        }
        val builder = Notification.Builder(this, "budget_alerts")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(title)
            .setContentText(text)
            .setAutoCancel(true)
        manager.notify(notifId, builder.build())
    }
}
