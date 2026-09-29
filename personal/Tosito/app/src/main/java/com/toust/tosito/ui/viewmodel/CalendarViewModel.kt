package com.toust.tosito.ui.viewmodel

import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.toust.tosito.data.model.CalendarEvent
import com.toust.tosito.data.model.EventCategory
import com.toust.tosito.data.model.EventPriority
import com.toust.tosito.data.model.ScheduleBlock
import com.toust.tosito.data.model.ScheduleCategory
import com.toust.tosito.data.model.TimelineItem
import com.toust.tosito.data.model.timeStringToMinutes
import com.toust.tosito.data.repository.CalendarRepository
import com.toust.tosito.data.repository.ScheduleRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

import android.app.Application
import androidx.lifecycle.AndroidViewModel

class CalendarViewModel(application: Application) : AndroidViewModel(application) {

    private val calendarRepo = CalendarRepository()
    private val scheduleRepo  = ScheduleRepository()
    private val userId get() = FirebaseAuth.getInstance().currentUser?.uid ?: ""

    // ─── Estado del calendario ────────────────────────────────────────────────
    private val _currentMonth = MutableStateFlow(YearMonth.now())
    val currentMonth: StateFlow<YearMonth> = _currentMonth.asStateFlow()

    private val _selectedDate = MutableStateFlow(LocalDate.now())
    val selectedDate: StateFlow<LocalDate> = _selectedDate.asStateFlow()

    private val _monthEvents = MutableStateFlow<List<CalendarEvent>>(emptyList())
    val monthEvents: StateFlow<List<CalendarEvent>> = _monthEvents.asStateFlow()

    private val _selectedDayEvents = MutableStateFlow<List<CalendarEvent>>(emptyList())
    val selectedDayEvents: StateFlow<List<CalendarEvent>> = _selectedDayEvents.asStateFlow()

    // ─── Horario recurrente ───────────────────────────────────────────────────
    private val _scheduleBlocks = MutableStateFlow<List<ScheduleBlock>>(emptyList())
    val scheduleBlocks: StateFlow<List<ScheduleBlock>> = _scheduleBlocks.asStateFlow()

    /** Bloques del horario aplicables al día seleccionado */
    private val _dayScheduleBlocks = MutableStateFlow<List<ScheduleBlock>>(emptyList())
    val dayScheduleBlocks: StateFlow<List<ScheduleBlock>> = _dayScheduleBlocks.asStateFlow()

    /** Timeline unificada: horario + eventos del día ordenados por hora */
    private val _timelineItems = MutableStateFlow<List<TimelineItem>>(emptyList())
    val timelineItems: StateFlow<List<TimelineItem>> = _timelineItems.asStateFlow()

    // ─── Loading ──────────────────────────────────────────────────────────────
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    // ─── Diálogos ─────────────────────────────────────────────────────────────
    private val _showEventDialog = MutableStateFlow(false)
    val showEventDialog: StateFlow<Boolean> = _showEventDialog.asStateFlow()

    private val _editingEvent = MutableStateFlow<CalendarEvent?>(null)
    val editingEvent: StateFlow<CalendarEvent?> = _editingEvent.asStateFlow()

    private val _showBlockDialog = MutableStateFlow(false)
    val showBlockDialog: StateFlow<Boolean> = _showBlockDialog.asStateFlow()

    private val _editingBlock = MutableStateFlow<ScheduleBlock?>(null)
    val editingBlock: StateFlow<ScheduleBlock?> = _editingBlock.asStateFlow()

    // ─── Tab activa (0=Calendario, 1=Línea de tiempo) ────────────────────────
    private val _activeTab = MutableStateFlow(0)
    val activeTab: StateFlow<Int> = _activeTab.asStateFlow()

    private val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")

    init {
        loadAll()
    }

    fun setTab(tab: Int) { _activeTab.value = tab }

    // ─── Carga principal ──────────────────────────────────────────────────────
    fun loadAll() {
        viewModelScope.launch {
            _isLoading.value = true
            val yearMonth = _currentMonth.value.format(DateTimeFormatter.ofPattern("yyyy-MM"))
            _monthEvents.value = calendarRepo.getEventsByMonth(userId, yearMonth)
            _scheduleBlocks.value = scheduleRepo.getAllBlocks(userId)
            filterSelectedDay()
            _isLoading.value = false
        }
    }

    private fun filterSelectedDay() {
        val dateStr = _selectedDate.value.format(dateFormatter)
        val dow = _selectedDate.value.dayOfWeek.value // 1=Lun … 7=Dom

        val events = _monthEvents.value.filter { it.date == dateStr }
        val blocks = _scheduleBlocks.value.filter { it.daysOfWeek.contains(dow) }

        _selectedDayEvents.value = events
        _dayScheduleBlocks.value = blocks

        // Unificar y ordenar por hora de inicio
        val items = mutableListOf<TimelineItem>()
        blocks.forEach { items.add(TimelineItem.Block(it)) }
        events.filter { it.startTime.isNotBlank() }.forEach { items.add(TimelineItem.Event(it)) }
        _timelineItems.value = items.sortedBy { it.startMinutes }
    }

    // ─── Navegación de mes / día ──────────────────────────────────────────────
    fun selectDate(date: LocalDate) {
        _selectedDate.value = date
        filterSelectedDay()
    }

    fun goToPreviousMonth() {
        _currentMonth.value = _currentMonth.value.minusMonths(1)
        _selectedDate.value = _currentMonth.value.atDay(1)
        loadAll()
    }

    fun goToNextMonth() {
        _currentMonth.value = _currentMonth.value.plusMonths(1)
        _selectedDate.value = _currentMonth.value.atDay(1)
        loadAll()
    }

    fun goToToday() {
        val today = LocalDate.now()
        _currentMonth.value = YearMonth.from(today)
        _selectedDate.value = today
        loadAll()
    }

    // ─── Cuadrícula ───────────────────────────────────────────────────────────
    fun getDaysInMonth(): List<LocalDate?> {
        val month = _currentMonth.value
        val firstDay = month.atDay(1)
        val totalDays = month.lengthOfMonth()
        val emptyDays = firstDay.dayOfWeek.value - 1
        val days = mutableListOf<LocalDate?>()
        repeat(emptyDays) { days.add(null) }
        for (d in 1..totalDays) { days.add(month.atDay(d)) }
        return days
    }

    fun getMonthTitle(): String {
        val month = _currentMonth.value
        val name = month.month.getDisplayName(TextStyle.FULL, Locale("es", "ES"))
            .replaceFirstChar { it.uppercase() }
        return "$name ${month.year}"
    }

    fun hasEventsOnDate(date: LocalDate): Boolean =
        _monthEvents.value.any { it.date == date.format(dateFormatter) }

    fun hasBlocksOnDate(date: LocalDate): Boolean {
        val dow = date.dayOfWeek.value
        return _scheduleBlocks.value.any { it.daysOfWeek.contains(dow) }
    }

    fun getEventCountForDate(date: LocalDate): Int {
        val dateStr = date.format(dateFormatter)
        return _monthEvents.value.count { it.date == dateStr }
    }

    fun getCompletionStats(): Pair<Int, Int> {
        val events = _selectedDayEvents.value
        return Pair(events.count { it.isCompleted }, events.size)
    }

    // ─── CRUD Eventos ──────────────────────────────────────────────────────────
    fun showCreateEventDialog(forDate: LocalDate? = null) {
        _editingEvent.value = CalendarEvent(
            date = (forDate ?: _selectedDate.value).format(dateFormatter)
        )
        _showEventDialog.value = true
    }

    fun showEditEventDialog(event: CalendarEvent) {
        _editingEvent.value = event
        _showEventDialog.value = true
    }

    fun hideEventDialog() {
        _showEventDialog.value = false
        _editingEvent.value = null
    }

    fun saveEvent(event: CalendarEvent) {
        viewModelScope.launch {
            calendarRepo.saveEvent(event.copy(userId = userId))
            hideEventDialog()
            loadAll()
            
            // Try to schedule notification if it has a valid time
            if (event.startTime.isNotBlank()) {
                try {
                    val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
                    val dateTime = java.time.LocalDateTime.parse("${event.date} ${event.startTime}", formatter)
                    val timeInMillis = dateTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli()
                    com.toust.tosito.receivers.NotificationScheduler.scheduleCalendarEvent(
                        getApplication(),
                        event.id.hashCode(),
                        timeInMillis,
                        event.title
                    )
                } catch (e: Exception) {
                    // Ignore parse errors
                }
            }
        }
    }

    fun toggleCompleted(event: CalendarEvent) {
        viewModelScope.launch {
            calendarRepo.updateCompletedStatus(event.id, !event.isCompleted)
            loadAll()
        }
    }

    fun deleteEvent(event: CalendarEvent) {
        viewModelScope.launch {
            calendarRepo.deleteEvent(event.id)
            loadAll()
        }
    }

    // ─── CRUD Horario ─────────────────────────────────────────────────────────
    fun showCreateBlockDialog() {
        _editingBlock.value = ScheduleBlock()
        _showBlockDialog.value = true
    }

    fun showEditBlockDialog(block: ScheduleBlock) {
        _editingBlock.value = block
        _showBlockDialog.value = true
    }

    fun hideBlockDialog() {
        _showBlockDialog.value = false
        _editingBlock.value = null
    }

    fun saveBlock(block: ScheduleBlock) {
        viewModelScope.launch {
            scheduleRepo.saveBlock(block.copy(userId = userId))
            hideBlockDialog()
            loadAll()
        }
    }

    fun deleteBlock(block: ScheduleBlock) {
        viewModelScope.launch {
            scheduleRepo.deleteBlock(block.id)
            loadAll()
        }
    }

    // ─── Limpieza de Duplicados ───────────────────────────────────────────────
    fun cleanupDuplicates() {
        viewModelScope.launch {
            _isLoading.value = true
            val monthsToClean = listOf(
                "2026-09", "2026-10", "2026-11", "2026-12",
                "2027-01", "2027-02", "2027-03", "2027-04",
                "2027-05", "2027-06"
            )

            for (month in monthsToClean) {
                val eventsInMonth = calendarRepo.getEventsByMonth(userId, month)
                val seenSignatures = mutableSetOf<String>()

                for (event in eventsInMonth) {
                    val signature = "${event.date}_${event.title}_${event.startTime}"
                    if (seenSignatures.contains(signature)) {
                        // Es un duplicado, lo borramos
                        calendarRepo.deleteEvent(event.id)
                    } else {
                        // Es la primera vez que lo vemos, lo guardamos en la firma
                        seenSignatures.add(signature)
                    }
                }
            }

            loadAll()
            _isLoading.value = false
        }
    }

    // ─── Importación de Horario Máster ────────────────────────────────────────
    fun importMasterSchedule() {
        viewModelScope.launch {
            _isLoading.value = true
            val events = mutableListOf<CalendarEvent>()
            val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")

            fun addEv(date: LocalDate, title: String, start: String, end: String, category: EventCategory = EventCategory.ESTUDIO) {
                events.add(CalendarEvent(
                    userId = userId,
                    title = title,
                    date = date.format(formatter),
                    startTime = start,
                    endTime = end,
                    category = category
                ))
            }

            var current = LocalDate.of(2026, 9, 24)
            val endDate = LocalDate.of(2027, 2, 23)

            while (!current.isAfter(endDate)) {
                val dow = current.dayOfWeek.value // 1=Mon, ..., 7=Sun
                val dateStr = current.format(formatter)

                // Vacaciones Navidad
                val isXmas = !current.isBefore(LocalDate.of(2026, 12, 18)) && !current.isAfter(LocalDate.of(2027, 1, 10))

                if (!isXmas) {
                    // FASE 1: Octubre y Noviembre
                    if (!current.isBefore(LocalDate.of(2026, 9, 24)) && !current.isAfter(LocalDate.of(2026, 11, 26))) {
                        if (dow == 1 || dow == 4) { // Lunes y Jueves
                            addEv(current, "Aprendizaje y desarrollo (ADP)", "15:30", "17:30")
                            addEv(current, "Sociedad, familia y educación (SOC)", "17:30", "19:30")
                            addEv(current, "Procesos y contextos (PRO)", "19:30", "21:30")
                        }
                    }

                    if (!current.isBefore(LocalDate.of(2026, 10, 2)) && !current.isAfter(LocalDate.of(2026, 11, 13))) {
                        if (dow == 2 || dow == 5) { // Martes y Viernes
                            addEv(current, "Atención a la diversidad", "15:30", "17:30")
                            addEv(current, "Educación para la igualdad", "17:30", "19:30")
                        }
                    }

                    val f1Wednesdays = listOf("2026-10-07", "2026-10-14", "2026-10-21", "2026-10-28", "2026-11-04", "2026-11-11")
                    if (dateStr in f1Wednesdays) {
                        addEv(current, "Innovación docente (Común)", "18:30", "20:30")
                    }

                    // FASE 2: Diciembre a Febrero
                    if (!current.isBefore(LocalDate.of(2026, 11, 30)) && !current.isAfter(LocalDate.of(2027, 2, 22))) {
                        if (dow in 1..4) { // Lunes a Jueves
                            if (!current.isAfter(LocalDate.of(2027, 1, 20))) {
                                addEv(current, "Aprendizaje y enseñanza (AYE)", "16:00", "18:30")
                                addEv(current, "Complementos de formación (CF)", "18:30", "21:00")
                            } else if (!current.isAfter(LocalDate.of(2027, 2, 9))) {
                                addEv(current, "Aprendizaje y enseñanza (AYE)", "16:00", "18:30")
                                addEv(current, "Innovación docente (Específica)", "18:30", "21:00")
                            } else if (!current.isAfter(LocalDate.of(2027, 2, 22))) {
                                addEv(current, "Aprendizaje y enseñanza (AYE)", "16:00", "18:30")
                            }
                        }
                    }
                }
                current = current.plusDays(1)
            }

            // FASE 3: Hitos
            addEv(LocalDate.of(2027, 2, 1), "Entrega ficha compromiso TFM", "09:00", "10:00", EventCategory.TRABAJO)
            addEv(LocalDate.of(2027, 2, 22), "Seminario 1 de prácticas", "18:30", "20:30")
            addEv(LocalDate.of(2027, 2, 23), "Inicio Prácticas Externas", "08:00", "15:00", EventCategory.TRABAJO)
            addEv(LocalDate.of(2027, 3, 2), "Evaluación final Innovación Docente", "16:00", "18:00")
            addEv(LocalDate.of(2027, 3, 9), "Evaluación CF y Seminario 2", "16:00", "20:00")
            addEv(LocalDate.of(2027, 3, 16), "Evaluación AYE y Seminario 3", "16:00", "20:00")
            addEv(LocalDate.of(2027, 6, 7), "Depósito del TFM", "09:00", "14:00", EventCategory.TRABAJO)

            // Guardar en Firebase
            for (ev in events) {
                calendarRepo.saveEvent(ev)
            }

            loadAll()
            _isLoading.value = false
        }
    }
}
