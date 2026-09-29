package com.toust.tosito.data.model

import com.google.firebase.Timestamp

// ─── Tipo de transacción ──────────────────────────────────────────────────────
enum class TransactionType(val label: String, val emoji: String) {
    INCOME("Ingreso",  "📈"),
    EXPENSE("Gasto",   "📉")
}

// ─── Categoría de transacción ─────────────────────────────────────────────────
enum class TransactionCategory(val label: String, val emoji: String) {
    SALARIO("Salario",          "💼"),
    FREELANCE("Freelance",      "💻"),
    INVERSION("Inversión",      "📊"),
    REGALO("Regalo",            "🎁"),
    ALIMENTACION("Alimentación","🛒"),
    TRANSPORTE("Transporte",    "🚗"),
    OCIO("Ocio",                "🎬"),
    ROPA("Ropa",                "👕"),
    SALUD("Salud",              "🏥"),
    SUSCRIPCION("Suscripción",  "📱"),
    HOGAR("Hogar",              "🏠"),
    EDUCACION("Educación",      "📚"),
    VIAJE("Viaje",              "✈️"),
    RESTAURANTE("Restaurante",  "🍽️"),
    OTRO_INGRESO("Otro ingreso","💰"),
    OTRO_GASTO("Otro gasto",   "💸")
}

val incomeCategories = listOf(
    TransactionCategory.SALARIO,  TransactionCategory.FREELANCE,
    TransactionCategory.INVERSION, TransactionCategory.REGALO,
    TransactionCategory.OTRO_INGRESO
)

val expenseCategories = listOf(
    TransactionCategory.ALIMENTACION, TransactionCategory.TRANSPORTE,
    TransactionCategory.OCIO,        TransactionCategory.ROPA,
    TransactionCategory.SALUD,       TransactionCategory.SUSCRIPCION,
    TransactionCategory.HOGAR,       TransactionCategory.EDUCACION,
    TransactionCategory.VIAJE,       TransactionCategory.RESTAURANTE,
    TransactionCategory.OTRO_GASTO
)

// ─── Transacción ──────────────────────────────────────────────────────────────
data class Transaction(
    val id: String = "",
    val userId: String = "",
    val type: TransactionType = TransactionType.EXPENSE,
    val category: TransactionCategory = TransactionCategory.OTRO_GASTO,
    val amount: Double = 0.0,
    val description: String = "",
    val date: String = "",           // yyyy-MM-dd
    val yearMonth: String = "",      // yyyy-MM  (para consultas de mes)
    val accountName: String = "",    // nombre de cuenta (opcional)
    val createdAt: Timestamp? = null
)

// ─── Objetivo de ahorro ───────────────────────────────────────────────────────
data class SavingsGoal(
    val id: String = "",
    val userId: String = "",
    val name: String = "",
    val targetAmount: Double = 0.0,
    val currentAmount: Double = 0.0,
    val targetDate: String = "",     // yyyy-MM-dd
    val emoji: String = "🎯",
    val color: String = "#7C3AED",
    val isCompleted: Boolean = false,
    val createdAt: Timestamp? = null
) {
    val progress get() = if (targetAmount > 0) (currentAmount / targetAmount).coerceIn(0.0, 1.0) else 0.0
    val remaining get() = (targetAmount - currentAmount).coerceAtLeast(0.0)
}

// ─── Resumen mensual calculado ────────────────────────────────────────────────
data class MonthlySummary(
    val yearMonth: String = "",
    val totalIncome: Double = 0.0,
    val totalExpense: Double = 0.0,
    val balance: Double = 0.0,
    val expenseByCategory: Map<TransactionCategory, Double> = emptyMap()
)

// ─── Suscripción / Gasto Recurrente ───────────────────────────────────────────
data class RecurringTransaction(
    val id: String = "",
    val userId: String = "",
    val name: String = "",
    val amount: Double = 0.0,
    val type: TransactionType = TransactionType.EXPENSE,
    val category: TransactionCategory = TransactionCategory.SUSCRIPCION,
    val dayOfMonth: Int = 1,
    val lastProcessedMonth: String = "",
    val createdAt: Timestamp? = null
)
