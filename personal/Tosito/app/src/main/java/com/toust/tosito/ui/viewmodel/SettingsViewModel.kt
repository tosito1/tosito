package com.toust.tosito.ui.viewmodel

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.toust.tosito.receivers.NotificationScheduler
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SettingsViewModel(application: Application) : AndroidViewModel(application) {

    private val prefs = application.getSharedPreferences("TositoPrefs", Context.MODE_PRIVATE)

    private val _morningAlertHour = MutableStateFlow(prefs.getInt("morning_alert_hour", 8))
    val morningAlertHour: StateFlow<Int> = _morningAlertHour.asStateFlow()

    private val _morningAlertMinute = MutableStateFlow(prefs.getInt("morning_alert_minute", 0))
    val morningAlertMinute: StateFlow<Int> = _morningAlertMinute.asStateFlow()

    private val _calendarAlertOffset = MutableStateFlow(prefs.getInt("calendar_alert_offset", 15))
    val calendarAlertOffset: StateFlow<Int> = _calendarAlertOffset.asStateFlow()

    private val _budgetLimit = MutableStateFlow(prefs.getFloat("budget_limit", 500f))
    val budgetLimit: StateFlow<Float> = _budgetLimit.asStateFlow()

    private val _bodyWeight = MutableStateFlow(prefs.getFloat("body_weight", 70f))
    val bodyWeight: StateFlow<Float> = _bodyWeight.asStateFlow()

    fun updateMorningAlertTime(hour: Int, minute: Int) {
        prefs.edit()
            .putInt("morning_alert_hour", hour)
            .putInt("morning_alert_minute", minute)
            .apply()
        _morningAlertHour.value = hour
        _morningAlertMinute.value = minute
        
        // Reschedule based on new settings
        NotificationScheduler.scheduleDailyMorningAlert(getApplication())
    }

    fun updateCalendarAlertOffset(minutes: Int) {
        prefs.edit().putInt("calendar_alert_offset", minutes).apply()
        _calendarAlertOffset.value = minutes
    }

    fun updateBudgetLimit(limit: Float) {
        prefs.edit().putFloat("budget_limit", limit).apply()
        _budgetLimit.value = limit
    }

    fun updateBodyWeight(weight: Float) {
        prefs.edit().putFloat("body_weight", weight).apply()
        _bodyWeight.value = weight
    }
}
