package com.toust.tosito.ui.viewmodel

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.toust.tosito.data.model.CompletedSet
import com.toust.tosito.data.model.Exercise
import com.toust.tosito.data.model.GymRoutine
import com.toust.tosito.data.model.WorkoutSession
import com.toust.tosito.data.repository.GymRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class GymViewModel(
    application: Application
) : AndroidViewModel(application) {

    private val repository: GymRepository = GymRepository()
    private val prefs = application.getSharedPreferences("TositoPrefs", Context.MODE_PRIVATE)

    private val _bodyWeight = MutableStateFlow(prefs.getFloat("body_weight", 0f).toDouble())
    val bodyWeight: StateFlow<Double> = _bodyWeight.asStateFlow()

    private val prefListener = android.content.SharedPreferences.OnSharedPreferenceChangeListener { sharedPreferences, key ->
        if (key == "body_weight") {
            _bodyWeight.value = sharedPreferences.getFloat(key, 0f).toDouble()
        }
    }

    init {
        prefs.registerOnSharedPreferenceChangeListener(prefListener)
    }

    fun updateBodyWeight(weight: Double) {
        prefs.edit().putFloat("body_weight", weight.toFloat()).apply()
        _bodyWeight.value = weight
    }

    private val userId get() = FirebaseAuth.getInstance().currentUser?.uid ?: ""

    // â”€â”€â”€ Tab activo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private val _activeTab = MutableStateFlow(0) // 0=Rutinas, 1=SesiÃ³n, 2=Historial
    val activeTab: StateFlow<Int> = _activeTab.asStateFlow()

    // â”€â”€â”€ DÃ­a seleccionado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private val _selectedDayOfWeek = MutableStateFlow(repository.getCurrentDayOfWeek())
    val selectedDayOfWeek: StateFlow<String> = _selectedDayOfWeek.asStateFlow()

    // â”€â”€â”€ Rutina del dÃ­a â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private val _currentRoutine = MutableStateFlow<GymRoutine?>(null)
    val currentRoutine: StateFlow<GymRoutine?> = _currentRoutine.asStateFlow()

    // â”€â”€â”€ Todas las rutinas (semana completa) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private val _allRoutines = MutableStateFlow<List<GymRoutine>>(emptyList())
    val allRoutines: StateFlow<List<GymRoutine>> = _allRoutines.asStateFlow()

    // â”€â”€â”€ Historial de sesiones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private val _recentSessions = MutableStateFlow<List<WorkoutSession>>(emptyList())
    val recentSessions: StateFlow<List<WorkoutSession>> = _recentSessions.asStateFlow()

    // â”€â”€â”€ Estado de carga â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    // â”€â”€â”€ DiÃ¡logos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private val _showExerciseDialog = MutableStateFlow(false)
    val showExerciseDialog: StateFlow<Boolean> = _showExerciseDialog.asStateFlow()

    private val _editingExercise = MutableStateFlow<Exercise?>(null)
    val editingExercise: StateFlow<Exercise?> = _editingExercise.asStateFlow()

    private val _editingExerciseIndex = MutableStateFlow(-1)

    // â”€â”€â”€ Modo sesiÃ³n activa â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private val _sessionActive = MutableStateFlow(false)
    val sessionActive: StateFlow<Boolean> = _sessionActive.asStateFlow()

    private val _sessionSeconds = MutableStateFlow(0)
    val sessionSeconds: StateFlow<Int> = _sessionSeconds.asStateFlow()

    private val _completedSets = MutableStateFlow<List<CompletedSet>>(emptyList())
    val completedSets: StateFlow<List<CompletedSet>> = _completedSets.asStateFlow()

    /** Sets completados agrupados por ejercicio: exerciseName -> count */
    val completedSetsByExercise: Map<String, Int>
        get() = _completedSets.value.groupBy { it.exerciseName }.mapValues { it.value.size }

    private var sessionStartTime: String = ""
    private var timerJob: Job? = null

    // â”€â”€â”€ Descanso â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private val _restTimerSeconds = MutableStateFlow(0)
    val restTimerSeconds: StateFlow<Int> = _restTimerSeconds.asStateFlow()
    private val _restTimerActive = MutableStateFlow(false)
    val restTimerActive: StateFlow<Boolean> = _restTimerActive.asStateFlow()
    private var restJob: Job? = null

    init {
        loadAll()
    }

    fun setTab(tab: Int) { _activeTab.value = tab }

    fun loadAll() {
        viewModelScope.launch {
            _isLoading.value = true
            _allRoutines.value = repository.getAllRoutines(userId)
            val day = _selectedDayOfWeek.value
            _currentRoutine.value = _allRoutines.value.firstOrNull { it.dayOfWeek == day }
            _recentSessions.value = repository.getRecentSessions(userId)
            _isLoading.value = false
        }
    }

    // â”€â”€ NavegaciÃ³n de dÃ­as â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun loadRoutineForDay(dayOfWeek: String) {
        _selectedDayOfWeek.value = dayOfWeek
        _currentRoutine.value = _allRoutines.value.firstOrNull { it.dayOfWeek == dayOfWeek }
    }

    fun getPreviousDay() {
        val days = repository.getAllDaysOfWeek()
        val idx = days.indexOf(_selectedDayOfWeek.value)
        val prev = if (idx > 0) days[idx - 1] else days.last()
        loadRoutineForDay(prev)
    }

    fun getNextDay() {
        val days = repository.getAllDaysOfWeek()
        val idx = days.indexOf(_selectedDayOfWeek.value)
        val next = if (idx < days.size - 1) days[idx + 1] else days.first()
        loadRoutineForDay(next)
    }

    fun isToday() = _selectedDayOfWeek.value == repository.getCurrentDayOfWeek()
    fun getAllDaysOfWeek() = repository.getAllDaysOfWeek()

    // â”€â”€ CRUD Ejercicios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun showAddExerciseDialog() {
        _editingExercise.value = null
        _editingExerciseIndex.value = -1
        _showExerciseDialog.value = true
    }

    fun showEditExerciseDialog(exercise: Exercise, index: Int) {
        _editingExercise.value = exercise
        _editingExerciseIndex.value = index
        _showExerciseDialog.value = true
    }

    fun hideExerciseDialog() {
        _showExerciseDialog.value = false
        _editingExercise.value = null
        _editingExerciseIndex.value = -1
    }

    fun saveExercise(exercise: Exercise) {
        viewModelScope.launch {
            _isLoading.value = true
            val exercises = _currentRoutine.value?.exercises?.toMutableList() ?: mutableListOf()
            val idx = _editingExerciseIndex.value
            if (idx >= 0) exercises[idx] = exercise else exercises.add(exercise)

            val routine = _currentRoutine.value?.copy(exercises = exercises)
                ?: GymRoutine(
                    dayOfWeek = _selectedDayOfWeek.value,
                    name = _selectedDayOfWeek.value,
                    exercises = exercises,
                    userId = userId
                )
            if (repository.saveRoutine(routine, userId)) {
                delay(300)
                loadAll()
                hideExerciseDialog()
            }
            _isLoading.value = false
        }
    }

    fun deleteExercise(index: Int) {
        viewModelScope.launch {
            _isLoading.value = true
            val routine = _currentRoutine.value ?: return@launch
            val exercises = routine.exercises.toMutableList()
            if (index in exercises.indices) {
                exercises.removeAt(index)
                if (repository.saveRoutine(routine.copy(exercises = exercises), userId)) {
                    delay(200)
                    loadAll()
                }
            }
            _isLoading.value = false
        }
    }

    // â”€â”€ EstadÃ­sticas de la rutina actual â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun getTotalSets()      = _currentRoutine.value?.exercises?.sumOf { it.sets } ?: 0
    fun getTotalExercises() = _currentRoutine.value?.exercises?.size ?: 0
    fun getEstimatedTime()  = getTotalSets() * 3    // ~3 min por serie
    fun getTotalVolume()    = _currentRoutine.value?.exercises?.sumOf { it.sets * it.weight.toDouble() }?.toFloat() ?: 0f

    // â”€â”€ Modo sesiÃ³n activa â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun startSession() {
        _sessionActive.value = true
        _sessionSeconds.value = 0
        _completedSets.value = emptyList()
        sessionStartTime = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (true) {
                delay(1000)
                _sessionSeconds.value++
            }
        }
    }

    fun logSet(exerciseName: String, reps: Int, weight: Float) {
        val done = _completedSets.value.count { it.exerciseName == exerciseName }
        val set = CompletedSet(
            exerciseName  = exerciseName,
            setNumber     = done + 1,
            repsCompleted = reps,
            weightUsed    = weight
        )
        _completedSets.value = _completedSets.value + set
        // Iniciar timer de descanso automÃ¡ticamente
        val restSecs = _currentRoutine.value?.exercises
            ?.firstOrNull { it.name == exerciseName }?.restSeconds ?: 90
        startRestTimer(restSecs)
    }

    fun finishSession(context: android.content.Context) {
        viewModelScope.launch {
            timerJob?.cancel()
            val routine = _currentRoutine.value ?: return@launch
            val endTime = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
            val date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            val totalVolume = _completedSets.value.sumOf { (it.repsCompleted * it.weightUsed).toDouble() }.toFloat()
            val session = WorkoutSession(
                userId          = userId,
                routineId       = routine.id,
                routineName     = routine.name,
                dayOfWeek       = routine.dayOfWeek,
                date            = date,
                startTime       = sessionStartTime,
                endTime         = endTime,
                durationMinutes = _sessionSeconds.value / 60,
                completedSets   = _completedSets.value,
                totalVolume     = totalVolume
            )
            repository.saveSession(session, userId)
            // Health Connect Sync
            try {
                val hcClient = androidx.health.connect.client.HealthConnectClient.getOrCreate(context)
                val kcalBurned = (totalVolume * 0.05).coerceAtLeast(100.0) // Estimacin muy bsica
                
                val endMillis = System.currentTimeMillis()
                val startMillis = endMillis - (_sessionSeconds.value * 1000L)
                val startInst = java.time.Instant.ofEpochMilli(startMillis)
                val endInst = java.time.Instant.ofEpochMilli(endMillis)
                val offset = java.time.ZoneId.systemDefault().rules.getOffset(startInst)

                val energyRecord = androidx.health.connect.client.records.ActiveCaloriesBurnedRecord(
                    startTime = startInst,
                    endTime = endInst,
                    energy = androidx.health.connect.client.units.Energy.kilocalories(kcalBurned),
                    startZoneOffset = offset,
                    endZoneOffset = offset
                )
                
                val exerciseRecord = androidx.health.connect.client.records.ExerciseSessionRecord(
                    startTime = startInst,
                    endTime = endInst,
                    exerciseType = androidx.health.connect.client.records.ExerciseSessionRecord.EXERCISE_TYPE_WEIGHTLIFTING,
                    title = "Gym Tosito: ${routine.name}",
                    startZoneOffset = offset,
                    endZoneOffset = offset
                )
                hcClient.insertRecords(listOf(energyRecord, exerciseRecord))
            } catch (e: Exception) {
                android.util.Log.e("GymViewModel", "Error al sincronizar con Health Connect", e)
            }
            _sessionActive.value = false
            _sessionSeconds.value = 0
            _completedSets.value = emptyList()
            _recentSessions.value = repository.getRecentSessions(userId)
            setTab(2) // ir a historial
        }
    }

    fun cancelSession() {
        timerJob?.cancel()
        restJob?.cancel()
        _sessionActive.value = false
        _sessionSeconds.value = 0
        _completedSets.value = emptyList()
        _restTimerActive.value = false
    }

    // â”€â”€ Timer de descanso â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun startRestTimer(seconds: Int) {
        restJob?.cancel()
        _restTimerSeconds.value = seconds
        _restTimerActive.value = true
        restJob = viewModelScope.launch {
            while (_restTimerSeconds.value > 0) {
                delay(1000)
                _restTimerSeconds.value--
            }
            _restTimerActive.value = false
        }
    }

    fun skipRestTimer() {
        restJob?.cancel()
        _restTimerActive.value = false
        _restTimerSeconds.value = 0
    }

    // â”€â”€ EstadÃ­sticas globales â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun getTotalSessionsCount() = _recentSessions.value.size
    fun getTotalVolumeAllTime() = _recentSessions.value.sumOf { it.totalVolume.toDouble() }.toFloat()
    fun getAvgSessionMinutes(): Int {
        val s = _recentSessions.value
        return if (s.isEmpty()) 0 else s.sumOf { it.durationMinutes } / s.size
    }
    fun getWeeklySessionCount(): Int {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val today = sdf.format(Date())
        // Contar sesiones de los Ãºltimos 7 dÃ­as (simplificado con strings)
        return _recentSessions.value.take(7).size
    }

    fun getSessionsByDay(): Map<String, Int> {
        return _recentSessions.value
            .groupBy { it.dayOfWeek }
            .mapValues { it.value.size }
    }

    // â”€â”€ GrÃ¡ficas de progreso â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun getUniqueExercises(): List<String> {
        return _recentSessions.value
            .flatMap { it.completedSets }
            .map { it.exerciseName }
            .distinct()
            .sorted()
    }

    fun getExerciseProgress(exerciseName: String): List<Pair<String, Float>> {
        val progress = mutableMapOf<String, Float>()
        _recentSessions.value.forEach { session ->
            val maxWeight = session.completedSets
                .filter { it.exerciseName.equals(exerciseName, ignoreCase = true) }
                .maxOfOrNull { it.weightUsed } ?: 0f
            if (maxWeight > 0f) {
                val dateStr = session.date.take(10)
                val currentMax = progress[dateStr] ?: 0f
                if (maxWeight > currentMax) {
                    progress[dateStr] = maxWeight
                }
            }
        }
        return progress.entries.sortedBy { it.key }.map { it.key to it.value }
    }
}
