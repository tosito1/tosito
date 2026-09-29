package com.toust.tosito.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.toust.tosito.data.repository.GymRepository
import com.toust.tosito.data.repository.MealRepository
import com.toust.tosito.data.repository.SavingsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

data class WeeklyStats(
    val gymDaysCount: Int = 0,
    val gymStreak: Int = 0,
    val mealCompletionRatio: Float = 0f,
    val mealStreak: Int = 0,
    val savedAmount: Float = 0f
)

class AnalyticsViewModel(application: Application) : AndroidViewModel(application) {
    private val gymRepo = GymRepository()
    private val mealRepo = MealRepository()
    private val savingsRepo = SavingsRepository()
    
    private val _weeklyStats = MutableStateFlow(WeeklyStats())
    val weeklyStats: StateFlow<WeeklyStats> = _weeklyStats.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadStats()
    }

    fun loadStats() {
        val userId = FirebaseAuth.getInstance().currentUser?.uid ?: return
        viewModelScope.launch {
            _isLoading.value = true
            
            // Get past 7 days string format
            val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val cal = Calendar.getInstance()
            val todayStr = sdf.format(cal.time)
            
            val last7Days = mutableListOf<String>()
            for (i in 0 until 7) {
                last7Days.add(sdf.format(cal.time))
                cal.add(Calendar.DAY_OF_YEAR, -1)
            }
            // Reverse so it's oldest to newest
            last7Days.reverse()

            // 1. Gym Stats
            val sessions = gymRepo.getRecentSessions(userId, 100)
            val gymDates = sessions.map { it.date.take(10) }.toSet()
            
            val gymDaysThisWeek = last7Days.count { gymDates.contains(it) }
            
            // Compute Gym Streak (consecutive days working out)
            var currentGymStreak = 0
            val sortedGymDates = gymDates.sortedDescending()
            val checkCal = Calendar.getInstance()
            
            // Allow 1 rest day logic? Or just consecutive days? Let's just do simple consecutive days backwards from today
            var checkDate = sdf.format(checkCal.time)
            if (!gymDates.contains(checkDate)) {
                checkCal.add(Calendar.DAY_OF_YEAR, -1)
                checkDate = sdf.format(checkCal.time)
            }
            while (gymDates.contains(checkDate)) {
                currentGymStreak++
                checkCal.add(Calendar.DAY_OF_YEAR, -1)
                checkDate = sdf.format(checkCal.time)
            }

            // 2. Meal Stats
            val dayPlans = mealRepo.getAllDayPlans(userId)
            var totalMeals = 0
            var completedMeals = 0
            
            val plansThisWeek = dayPlans.filter { last7Days.contains(it.date) }
            for (plan in plansThisWeek) {
                totalMeals += plan.plannedMeals.size
                completedMeals += plan.plannedMeals.count { it.isEaten }
            }
            val mealRatio = if (totalMeals > 0) completedMeals.toFloat() / totalMeals else 0f

            // Meal Streak (consecutive days with 100% completion backwards)
            var currentMealStreak = 0
            val checkCalMeal = Calendar.getInstance()
            var mealDate = sdf.format(checkCalMeal.time)
            var todayPlan = dayPlans.find { it.date == mealDate }
            if (todayPlan == null || !isPlan100(todayPlan)) {
                checkCalMeal.add(Calendar.DAY_OF_YEAR, -1)
                mealDate = sdf.format(checkCalMeal.time)
                todayPlan = dayPlans.find { it.date == mealDate }
            }
            while (todayPlan != null && isPlan100(todayPlan)) {
                currentMealStreak++
                checkCalMeal.add(Calendar.DAY_OF_YEAR, -1)
                mealDate = sdf.format(checkCalMeal.time)
                todayPlan = dayPlans.find { it.date == mealDate }
            }

            // 3. Savings Stats
            val transactions = savingsRepo.getAllTransactions(userId)
            val transThisWeek = transactions.filter {
                last7Days.contains(it.date.take(10))
            }
            var income = 0f
            var expense = 0f
            transThisWeek.forEach {
                if (it.type.name == "EXPENSE") expense += it.amount.toFloat() else income += it.amount.toFloat()
            }
            val savedAmountThisWeek = income - expense

            _weeklyStats.value = WeeklyStats(
                gymDaysCount = gymDaysThisWeek,
                gymStreak = currentGymStreak,
                mealCompletionRatio = mealRatio,
                mealStreak = currentMealStreak,
                savedAmount = savedAmountThisWeek
            )

            _isLoading.value = false
        }
    }
    
    private fun isPlan100(plan: com.toust.tosito.data.model.DayMealPlan): Boolean {
        if (plan.plannedMeals.isEmpty()) return false
        return plan.plannedMeals.all { it.isEaten }
    }
}
