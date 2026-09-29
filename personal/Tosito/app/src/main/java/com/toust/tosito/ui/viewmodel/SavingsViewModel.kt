package com.toust.tosito.ui.viewmodel

import android.app.Application
import android.content.Context
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.toust.tosito.data.model.MonthlySummary
import com.toust.tosito.data.model.SavingsGoal
import com.toust.tosito.data.model.Transaction
import com.toust.tosito.data.model.TransactionCategory
import com.toust.tosito.data.model.TransactionType
import com.toust.tosito.data.model.expenseCategories
import com.toust.tosito.data.repository.SavingsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.Calendar
import java.text.SimpleDateFormat
import java.util.Locale

enum class TimeFilter(val label: String) {
    DAY("DÃ­a"),
    WEEK("Semana"),
    MONTH("Mes"),
    YEAR("AÃ±o"),
    ALL("Todos")
}

class SavingsViewModel(
    application: Application
) : AndroidViewModel(application) {

    private val repository: SavingsRepository = SavingsRepository()

    private val prefs = application.getSharedPreferences("TositoPrefs", Context.MODE_PRIVATE)

    private val _budgetLimit = MutableStateFlow(prefs.getFloat("budget_limit", 500f).toDouble())
    val budgetLimit: StateFlow<Double> = _budgetLimit.asStateFlow()

    private val prefListener = android.content.SharedPreferences.OnSharedPreferenceChangeListener { sharedPreferences, key ->
        if (key == "budget_limit") {
            _budgetLimit.value = sharedPreferences.getFloat(key, 500f).toDouble()
        }
    }

    init {
        prefs.registerOnSharedPreferenceChangeListener(prefListener)
    }

    fun updateBudgetLimit(newLimit: Double) {
        prefs.edit().putFloat("budget_limit", newLimit.toFloat()).apply()
        _budgetLimit.value = newLimit
    }

    private val userId get() = FirebaseAuth.getInstance().currentUser?.uid ?: ""

    // â”€â”€â”€ Tab activo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private val _activeTab = MutableStateFlow(0) // 0=Resumen, 1=Transacciones, 2=Objetivos
    val activeTab: StateFlow<Int> = _activeTab.asStateFlow()

    // â”€â”€â”€ Mes seleccionado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private val _selectedMonth = MutableStateFlow(repository.getCurrentYearMonth())
    val selectedMonth: StateFlow<String> = _selectedMonth.asStateFlow()

    private val _allTransactions = MutableStateFlow<List<Transaction>>(emptyList())
    private val _transactions = MutableStateFlow<List<Transaction>>(emptyList())
    val transactions: StateFlow<List<Transaction>> = _transactions.asStateFlow()

    // Filtro de tipo (null = todos)
    private val _filterType = MutableStateFlow<TransactionType?>(null)
    val filterType: StateFlow<TransactionType?> = _filterType.asStateFlow()

    // Filtro de tiempo
    private val _timeFilter = MutableStateFlow(TimeFilter.ALL)
    val timeFilter: StateFlow<TimeFilter> = _timeFilter.asStateFlow()

    val filteredTransactions: StateFlow<List<Transaction>> = kotlinx.coroutines.flow.combine(
        _allTransactions, _filterType, _timeFilter
    ) { allTxs, type, time ->
        var res = allTxs
        if (type != null) res = res.filter { it.type == type }
        
        val today = Calendar.getInstance()
        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val todayStr = dateFormat.format(today.time)
        
        res = when (time) {
            TimeFilter.DAY -> res.filter { it.date == todayStr }
            TimeFilter.WEEK -> {
                val cal = Calendar.getInstance()
                cal.firstDayOfWeek = Calendar.MONDAY
                cal.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
                val start = dateFormat.format(cal.time)
                cal.add(Calendar.DAY_OF_WEEK, 6)
                val end = dateFormat.format(cal.time)
                res.filter { it.date in start..end }
            }
            TimeFilter.MONTH -> {
                val monthStr = todayStr.take(7)
                res.filter { it.date.startsWith(monthStr) }
            }
            TimeFilter.YEAR -> {
                val yearStr = todayStr.take(4)
                res.filter { it.date.startsWith(yearStr) }
            }
            TimeFilter.ALL -> res
        }
        res
    }.stateIn(viewModelScope, kotlinx.coroutines.flow.SharingStarted.WhileSubscribed(5000), emptyList())

    // â”€â”€â”€ Resumen mensual â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private val _summary = MutableStateFlow(MonthlySummary())
    val summary: StateFlow<MonthlySummary> = _summary.asStateFlow()

    // â”€â”€â”€ Objetivos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private val _goals = MutableStateFlow<List<SavingsGoal>>(emptyList())
    val goals: StateFlow<List<SavingsGoal>> = _goals.asStateFlow()

    // â”€â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    // â”€â”€â”€ DiÃ¡logos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private val _showTransactionDialog = MutableStateFlow(false)
    val showTransactionDialog: StateFlow<Boolean> = _showTransactionDialog.asStateFlow()

    private val _editingTransaction = MutableStateFlow<Transaction?>(null)
    val editingTransaction: StateFlow<Transaction?> = _editingTransaction.asStateFlow()

    private val _showGoalDialog = MutableStateFlow(false)
    val showGoalDialog: StateFlow<Boolean> = _showGoalDialog.asStateFlow()

    private val _editingGoal = MutableStateFlow<SavingsGoal?>(null)
    val editingGoal: StateFlow<SavingsGoal?> = _editingGoal.asStateFlow()

    private val _showAddToGoalDialog = MutableStateFlow(false)
    val showAddToGoalDialog: StateFlow<Boolean> = _showAddToGoalDialog.asStateFlow()

    private val _selectedGoalForDeposit = MutableStateFlow<SavingsGoal?>(null)
    val selectedGoalForDeposit: StateFlow<SavingsGoal?> = _selectedGoalForDeposit.asStateFlow()

    init { loadAll() }

    fun setTab(tab: Int) { _activeTab.value = tab }
    fun setFilter(type: TransactionType?) { _filterType.value = type }
    fun setTimeFilter(filter: TimeFilter) { _timeFilter.value = filter }

    // â”€â”€â”€ Carga â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun loadAll() {
        viewModelScope.launch {
            _isLoading.value = true
            _allTransactions.value = repository.getAllTransactions(userId)
            updateSelectedMonthTransactions()
            _goals.value = repository.getAllGoals(userId)
            loadRecurring()
            _isLoading.value = false
        }
    }

    private fun updateSelectedMonthTransactions() {
        _transactions.value = _allTransactions.value.filter { it.yearMonth == _selectedMonth.value }
        recalculateSummary()
    }

        private fun recalculateSummary() {
        val txs = _transactions.value
        val income   = txs.filter { it.type == TransactionType.INCOME }.sumOf { it.amount }
        val expenses = txs.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amount }
        val byCategory = txs
            .filter { it.type == TransactionType.EXPENSE }
            .groupBy { it.category }
            .mapValues { entry -> entry.value.sumOf { it.amount } }
        _summary.value = MonthlySummary(
            yearMonth    = _selectedMonth.value,
            totalIncome  = income,
            totalExpense = expenses,
            balance      = income - expenses,
            expenseByCategory = byCategory
        )
    }

    // â”€â”€â”€ NavegaciÃ³n de mes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun previousMonth() {
        _selectedMonth.value = repository.previousMonth(_selectedMonth.value)
        updateSelectedMonthTransactions()
    }

    fun nextMonth() {
        _selectedMonth.value = repository.nextMonth(_selectedMonth.value)
        updateSelectedMonthTransactions()
    }

    fun isCurrentMonth() = _selectedMonth.value == repository.getCurrentYearMonth()
    fun getMonthTitle() = repository.formatMonthTitle(_selectedMonth.value)

    // â”€â”€â”€ Transacciones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun showAddTransactionDialog(type: TransactionType = TransactionType.EXPENSE) {
        _editingTransaction.value = Transaction(type = type)
        _showTransactionDialog.value = true
    }

    fun showEditTransactionDialog(tx: Transaction) {
        _editingTransaction.value = tx
        _showTransactionDialog.value = true
    }

    fun hideTransactionDialog() {
        _showTransactionDialog.value = false
        _editingTransaction.value = null
    }

    fun saveTransaction(tx: Transaction) {
        viewModelScope.launch {
            _isLoading.value = true
            val toSave = tx.copy(
                yearMonth = repository.getYearMonth(tx.date.ifBlank { repository.getTodayDate() }),
                date      = tx.date.ifBlank { repository.getTodayDate() }
            )
            repository.saveTransaction(toSave, userId)
            loadAll()
            hideTransactionDialog()

            if (toSave.type == TransactionType.EXPENSE) {
                checkBudgetAlert()
            }
        }
    }

    private fun checkBudgetAlert() {
        val totalExpenses = _summary.value.totalExpense
        val limit = _budgetLimit.value

        if (totalExpenses >= limit) {
            sendBudgetNotification("Â¡Presupuesto superado!", "Has gastado %.2fâ‚¬, superando tu lÃ­mite de %.0fâ‚¬.".format(totalExpenses, limit), 101)
        } else if (totalExpenses >= limit * 0.8) {
            sendBudgetNotification("Presupuesto al 80%", "Llevas gastados %.2fâ‚¬ de tu lÃ­mite de %.0fâ‚¬.".format(totalExpenses, limit), 102)
        }
    }

    private fun sendBudgetNotification(title: String, text: String, notifId: Int) {
        val context = getApplication<Application>()
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val channel = android.app.NotificationChannel("budget_alerts", "Alertas de Presupuesto", android.app.NotificationManager.IMPORTANCE_HIGH)
            manager.createNotificationChannel(channel)
        }
        val builder = android.app.Notification.Builder(context, "budget_alerts")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(title)
            .setContentText(text)
            .setAutoCancel(true)
        manager.notify(notifId, builder.build())
    }

    fun deleteTransaction(tx: Transaction) {
        viewModelScope.launch {
            repository.deleteTransaction(tx.id)
            loadAll()
        }
    }

    // â”€â”€â”€ Objetivos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun showCreateGoalDialog() {
        _editingGoal.value = null
        _showGoalDialog.value = true
    }

    fun showEditGoalDialog(goal: SavingsGoal) {
        _editingGoal.value = goal
        _showGoalDialog.value = true
    }

    fun hideGoalDialog() {
        _showGoalDialog.value = false
        _editingGoal.value = null
    }

    fun saveGoal(goal: SavingsGoal) {
        viewModelScope.launch {
            _isLoading.value = true
            repository.saveGoal(goal, userId)
            _goals.value = repository.getAllGoals(userId)
            hideGoalDialog()
            _isLoading.value = false
        }
    }

    fun deleteGoal(goal: SavingsGoal) {
        viewModelScope.launch {
            repository.deleteGoal(goal.id)
            _goals.value = _goals.value.filter { it.id != goal.id }
        }
    }

    fun showAddToGoalDialog(goal: SavingsGoal) {
        _selectedGoalForDeposit.value = goal
        _showAddToGoalDialog.value = true
    }

    fun hideAddToGoalDialog() {
        _showAddToGoalDialog.value = false
        _selectedGoalForDeposit.value = null
    }

    fun depositToGoal(goal: SavingsGoal, amount: Double) {
        viewModelScope.launch {
            val newAmount = (goal.currentAmount + amount).coerceAtMost(goal.targetAmount)
            repository.updateGoalAmount(goal.id, newAmount)
            _goals.value = _goals.value.map {
                if (it.id == goal.id) it.copy(
                    currentAmount = newAmount,
                    isCompleted   = newAmount >= goal.targetAmount
                ) else it
            }
            hideAddToGoalDialog()
        }
    }

    // â”€â”€â”€ Totales de balance global (all-time) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun getTotalBalance()   = _summary.value.balance
    fun getTotalIncome()    = _summary.value.totalIncome
    fun getTotalExpense()   = _summary.value.totalExpense

    fun getTopExpenseCategories(n: Int = 4): List<Pair<TransactionCategory, Double>> {
        return _summary.value.expenseByCategory.entries
            .sortedByDescending { it.value }
            .take(n)
            .map { Pair(it.key, it.value) }
    }

    fun getRecentTransactions(n: Int = 5) = _transactions.value.take(n)

    // Total ahorrado en objetivos
    fun getTotalSaved() = _goals.value.sumOf { it.currentAmount }
    fun getTotalTarget() = _goals.value.sumOf { it.targetAmount }
    fun getGoalProgress() = if (getTotalTarget() > 0) getTotalSaved() / getTotalTarget() else 0.0

    // â”€â”€â”€ Suscripciones / Gastos Recurrentes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private val _recurring = MutableStateFlow<List<com.toust.tosito.data.model.RecurringTransaction>>(emptyList())
    val recurring: StateFlow<List<com.toust.tosito.data.model.RecurringTransaction>> = _recurring.asStateFlow()

    fun loadRecurring() {
        viewModelScope.launch {
            val list = repository.getAllRecurringTransactions(userId)
            _recurring.value = list
            processRecurringTransactions(list)
        }
    }

    private fun processRecurringTransactions(list: List<com.toust.tosito.data.model.RecurringTransaction>) {
        val today = Calendar.getInstance()
        val currentYearMonth = SimpleDateFormat("yyyy-MM", Locale.getDefault()).format(today.time)
        val currentDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(today.time)
        val currentDay = today.get(Calendar.DAY_OF_MONTH)

        viewModelScope.launch {
            var updated = false
            for (sub in list) {
                if (sub.lastProcessedMonth != currentYearMonth && currentDay >= sub.dayOfMonth) {
                    // Charge it!
                    val tx = Transaction(
                        userId = userId,
                        type = sub.type,
                        category = sub.category,
                        amount = sub.amount,
                        description = sub.name,
                        date = currentDate,
                        yearMonth = currentYearMonth
                    )
                    repository.saveTransaction(tx, userId)
                    repository.saveRecurringTransaction(sub.copy(lastProcessedMonth = currentYearMonth), userId)
                    updated = true
                }
            }
            if (updated) {
                _allTransactions.value = repository.getAllTransactions(userId)
                updateSelectedMonthTransactions()
                val newList = repository.getAllRecurringTransactions(userId)
                _recurring.value = newList
            }
        }
    }

    fun saveRecurring(sub: com.toust.tosito.data.model.RecurringTransaction) {
        viewModelScope.launch {
            if (repository.saveRecurringTransaction(sub, userId)) {
                loadRecurring()
            }
        }
    }

    fun deleteRecurring(id: String) {
        viewModelScope.launch {
            if (repository.deleteRecurringTransaction(id)) {
                loadRecurring()
            }
        }
    }

    // â”€â”€â”€ Exportar a CSV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun generateCSVContent(): String {
        val txs = _transactions.value
        val builder = java.lang.StringBuilder()
        builder.append("Fecha,Tipo,CategorÃ­a,Cantidad,DescripciÃ³n\n")
        for (tx in txs) {
            val amountStr = if (tx.type == TransactionType.EXPENSE) "-${tx.amount}" else "${tx.amount}"
            builder.append("${tx.date},${tx.type.label},${tx.category.label},${amountStr},\"${tx.description.replace("\"", "\"\"")}\"\n")
        }
        return builder.toString()
    }

    fun saveCSVToUri(context: android.content.Context, uri: android.net.Uri) {
        viewModelScope.launch(kotlinx.coroutines.Dispatchers.IO) {
            try {
                context.contentResolver.openOutputStream(uri)?.use { outputStream ->
                    outputStream.write(generateCSVContent().toByteArray(Charsets.UTF_8))
                }
            } catch (e: Exception) {
                Log.e("SavingsViewModel", "Error saving CSV", e)
            }
        }
    }
}
