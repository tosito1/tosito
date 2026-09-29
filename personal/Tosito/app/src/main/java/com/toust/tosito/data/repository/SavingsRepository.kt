package com.toust.tosito.data.repository

import android.util.Log
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.toust.tosito.data.model.SavingsGoal
import com.toust.tosito.data.model.Transaction
import com.toust.tosito.data.model.TransactionCategory
import com.toust.tosito.data.model.TransactionType
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class SavingsRepository {

    private val tag = "SavingsRepository"
    private fun db() = FirebaseFirestore.getInstance()
    private fun txCol()    = db().collection("tose_transactions")
    private fun goalsCol() = db().collection("tose_savings_goals")
    private fun recurringCol() = db().collection("tose_recurring_tx")

    // ── Transacciones ──────────────────────────────────────────────────────────

    suspend fun getTransactionsByMonth(userId: String, yearMonth: String): List<Transaction> {
        return try {
            val snap = txCol()
                .whereEqualTo("userId", userId)
                .whereEqualTo("yearMonth", yearMonth)
                .orderBy("date", Query.Direction.DESCENDING)
                .get().await()
            snap.documents.mapNotNull { doc -> doc.data?.let { mapTx(doc.id, it) } }
        } catch (e: Exception) {
            Log.e(tag, "Error getting transactions", e); emptyList()
        }
    }

    suspend fun getRecentTransactions(userId: String, limit: Long = 50): List<Transaction> {
        return try {
            val snap = txCol()
                .whereEqualTo("userId", userId)
                .orderBy("date", Query.Direction.DESCENDING)
                .limit(limit)
                .get().await()
            snap.documents.mapNotNull { doc -> doc.data?.let { mapTx(doc.id, it) } }
        } catch (e: Exception) {
            Log.e(tag, "Error getting recent transactions", e); emptyList()
        }
    }

    suspend fun getAllTransactions(userId: String): List<Transaction> {
        return try {
            val snap = txCol()
                .whereEqualTo("userId", userId)
                .get().await()
            snap.documents.mapNotNull { doc -> doc.data?.let { mapTx(doc.id, it) } }
                .sortedByDescending { it.date }
        } catch (e: Exception) {
            Log.e(tag, "Error getting all transactions", e); emptyList()
        }
    }

    suspend fun saveTransaction(tx: Transaction, userId: String): Boolean {
        return try {
            val data = txToMap(tx, userId)
            if (tx.id.isEmpty()) txCol().add(data).await()
            else txCol().document(tx.id).set(data).await()
            true
        } catch (e: Exception) {
            Log.e(tag, "Error saving transaction", e); false
        }
    }

    suspend fun deleteTransaction(id: String): Boolean = try {
        txCol().document(id).delete().await(); true
    } catch (e: Exception) { false }

    // ── Objetivos ──────────────────────────────────────────────────────────────

    suspend fun getAllGoals(userId: String): List<SavingsGoal> {
        return try {
            val snap = goalsCol()
                .whereEqualTo("userId", userId)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get().await()
            snap.documents.mapNotNull { doc -> doc.data?.let { mapGoal(doc.id, it) } }
        } catch (e: Exception) {
            Log.e(tag, "Error getting goals", e); emptyList()
        }
    }

    suspend fun saveGoal(goal: SavingsGoal, userId: String): Boolean {
        return try {
            val data = goalToMap(goal, userId)
            if (goal.id.isEmpty()) goalsCol().add(data).await()
            else goalsCol().document(goal.id).set(data).await()
            true
        } catch (e: Exception) {
            Log.e(tag, "Error saving goal", e); false
        }
    }

    suspend fun updateGoalAmount(goalId: String, newAmount: Double): Boolean {
        return try {
            goalsCol().document(goalId).update(
                mapOf("currentAmount" to newAmount,
                      "isCompleted"   to false)
            ).await()
            true
        } catch (e: Exception) { false }
    }

    suspend fun deleteGoal(id: String): Boolean = try {
        goalsCol().document(id).delete().await(); true
    } catch (e: Exception) { false }

    // ── Suscripciones / Gastos Recurrentes ───────────────────────────────────

    suspend fun getAllRecurringTransactions(userId: String): List<com.toust.tosito.data.model.RecurringTransaction> {
        return try {
            val snap = recurringCol().whereEqualTo("userId", userId).get().await()
            snap.documents.mapNotNull { doc -> doc.data?.let { mapRecurringTx(doc.id, it) } }
        } catch (e: Exception) {
            Log.e(tag, "Error getting recurring tx", e); emptyList()
        }
    }

    suspend fun saveRecurringTransaction(tx: com.toust.tosito.data.model.RecurringTransaction, userId: String): Boolean {
        return try {
            val col = recurringCol()
            if (tx.id.isEmpty()) {
                col.add(recurringTxToMap(tx, userId)).await()
            } else {
                col.document(tx.id).set(recurringTxToMap(tx, userId)).await()
            }
            true
        } catch (e: Exception) {
            Log.e(tag, "Error saving recurring tx", e); false
        }
    }

    suspend fun deleteRecurringTransaction(id: String): Boolean = try {
        recurringCol().document(id).delete().await(); true
    } catch (e: Exception) { false }

    // ── Serialización ──────────────────────────────────────────────────────────

    private fun txToMap(tx: Transaction, userId: String): Map<String, Any> = mapOf(
        "userId"      to userId,
        "type"        to tx.type.name,
        "category"    to tx.category.name,
        "amount"      to tx.amount,
        "description" to tx.description,
        "date"        to tx.date,
        "yearMonth"   to tx.yearMonth,
        "accountName" to tx.accountName,
        "createdAt"   to (tx.createdAt ?: Timestamp.now())
    )

    private fun mapTx(id: String, d: Map<String, Any?>): Transaction = Transaction(
        id          = id,
        userId      = d["userId"] as? String ?: "",
        type        = try { TransactionType.valueOf(d["type"] as? String ?: "") } catch (e: Exception) { TransactionType.EXPENSE },
        category    = try { TransactionCategory.valueOf(d["category"] as? String ?: "") } catch (e: Exception) { TransactionCategory.OTRO_GASTO },
        amount      = (d["amount"] as? Double) ?: (d["amount"] as? Long)?.toDouble() ?: 0.0,
        description = d["description"] as? String ?: "",
        date        = d["date"] as? String ?: "",
        yearMonth   = d["yearMonth"] as? String ?: "",
        accountName = d["accountName"] as? String ?: "",
        createdAt   = d["createdAt"] as? Timestamp
    )

    private fun goalToMap(goal: SavingsGoal, userId: String): Map<String, Any> = mapOf(
        "userId"        to userId,
        "name"          to goal.name,
        "targetAmount"  to goal.targetAmount,
        "currentAmount" to goal.currentAmount,
        "targetDate"    to goal.targetDate,
        "emoji"         to goal.emoji,
        "color"         to goal.color,
        "isCompleted"   to goal.isCompleted,
        "createdAt"     to (goal.createdAt ?: Timestamp.now())
    )

    private fun mapGoal(id: String, d: Map<String, Any?>): SavingsGoal = SavingsGoal(
        id            = id,
        userId        = d["userId"] as? String ?: "",
        name          = d["name"] as? String ?: "",
        targetAmount  = (d["targetAmount"] as? Double) ?: 0.0,
        currentAmount = (d["currentAmount"] as? Double) ?: 0.0,
        targetDate    = d["targetDate"] as? String ?: "",
        emoji         = d["emoji"] as? String ?: "🎯",
        color         = d["color"] as? String ?: "#7C3AED",
        isCompleted   = d["isCompleted"] as? Boolean ?: false,
        createdAt     = d["createdAt"] as? Timestamp
    )

    private fun recurringTxToMap(tx: com.toust.tosito.data.model.RecurringTransaction, userId: String): Map<String, Any> = mapOf(
        "userId"             to userId,
        "name"               to tx.name,
        "amount"             to tx.amount,
        "type"               to tx.type.name,
        "category"           to tx.category.name,
        "dayOfMonth"         to tx.dayOfMonth,
        "lastProcessedMonth" to tx.lastProcessedMonth,
        "createdAt"          to (tx.createdAt ?: Timestamp.now())
    )

    private fun mapRecurringTx(id: String, d: Map<String, Any?>): com.toust.tosito.data.model.RecurringTransaction = com.toust.tosito.data.model.RecurringTransaction(
        id                 = id,
        userId             = d["userId"] as? String ?: "",
        name               = d["name"] as? String ?: "",
        amount             = (d["amount"] as? Double) ?: (d["amount"] as? Long)?.toDouble() ?: 0.0,
        type               = try { TransactionType.valueOf(d["type"] as? String ?: "") } catch (e: Exception) { TransactionType.EXPENSE },
        category           = try { TransactionCategory.valueOf(d["category"] as? String ?: "") } catch (e: Exception) { TransactionCategory.SUSCRIPCION },
        dayOfMonth         = (d["dayOfMonth"] as? Long)?.toInt() ?: 1,
        lastProcessedMonth = d["lastProcessedMonth"] as? String ?: "",
        createdAt          = d["createdAt"] as? Timestamp
    )

    // ── Helpers de fecha ──────────────────────────────────────────────────────
    fun getTodayDate(): String =
        SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Calendar.getInstance().time)

    fun getCurrentYearMonth(): String =
        SimpleDateFormat("yyyy-MM", Locale.getDefault()).format(Calendar.getInstance().time)

    fun getYearMonth(date: String): String = date.take(7)

    fun formatMonthTitle(yearMonth: String): String {
        return try {
            val cal = Calendar.getInstance()
            cal.time = SimpleDateFormat("yyyy-MM", Locale.getDefault()).parse(yearMonth) ?: return yearMonth
            val months = listOf("Enero","Febrero","Marzo","Abril","Mayo","Junio",
                "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre")
            "${months[cal.get(Calendar.MONTH)]} ${cal.get(Calendar.YEAR)}"
        } catch (e: Exception) { yearMonth }
    }

    fun previousMonth(yearMonth: String): String {
        return try {
            val cal = Calendar.getInstance()
            cal.time = SimpleDateFormat("yyyy-MM", Locale.getDefault()).parse(yearMonth) ?: return yearMonth
            cal.add(Calendar.MONTH, -1)
            SimpleDateFormat("yyyy-MM", Locale.getDefault()).format(cal.time)
        } catch (e: Exception) { yearMonth }
    }

    fun nextMonth(yearMonth: String): String {
        return try {
            val cal = Calendar.getInstance()
            cal.time = SimpleDateFormat("yyyy-MM", Locale.getDefault()).parse(yearMonth) ?: return yearMonth
            cal.add(Calendar.MONTH, 1)
            SimpleDateFormat("yyyy-MM", Locale.getDefault()).format(cal.time)
        } catch (e: Exception) { yearMonth }
    }
}
