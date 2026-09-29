package com.toust.tosito.data.model

/**
 * Bloque de horario recurrente del día a día.
 * Se guarda en Firestore bajo "tose_schedule".
 */
data class ScheduleBlock(
    val id: String = "",
    val userId: String = "",
    val title: String = "",
    val startTime: String = "",     // "HH:mm"
    val endTime: String = "",       // "HH:mm"
    val category: ScheduleCategory = ScheduleCategory.RUTINA,
    val daysOfWeek: List<Int> = listOf(1, 2, 3, 4, 5, 6, 7), // 1=Lun … 7=Dom
    val color: String = "#7C3AED",  // Hex color string
    val isActive: Boolean = true
)

enum class ScheduleCategory(val label: String, val emoji: String) {
    TRABAJO("Trabajo",   "💼"),
    RUTINA("Rutina",     "🔄"),
    DESCANSO("Descanso", "😴"),
    COMIDA("Comida",     "🍽️"),
    GYM("Gym",           "💪"),
    ESTUDIO("Estudio",   "📚"),
    PERSONAL("Personal", "👤"),
    OTRO("Otro",         "📌")
}

/**
 * Elemento unificado para la vista de línea de tiempo.
 * Puede ser un ScheduleBlock o un CalendarEvent.
 */
sealed class TimelineItem {
    abstract val startMinutes: Int   // minutos desde 00:00
    abstract val endMinutes: Int
    abstract val title: String

    data class Block(val block: ScheduleBlock) : TimelineItem() {
        override val startMinutes get() = timeStringToMinutes(block.startTime)
        override val endMinutes   get() = timeStringToMinutes(block.endTime)
        override val title        get() = block.title
    }

    data class Event(val event: CalendarEvent) : TimelineItem() {
        override val startMinutes get() = timeStringToMinutes(event.startTime)
        override val endMinutes   get() = if (event.endTime.isNotBlank())
            timeStringToMinutes(event.endTime) else startMinutes + 60
        override val title        get() = event.title
    }
}

fun timeStringToMinutes(time: String): Int {
    if (time.isBlank()) return 0
    return try {
        val parts = time.split(":")
        parts[0].toInt() * 60 + parts[1].toInt()
    } catch (e: Exception) { 0 }
}

fun minutesToTimeString(minutes: Int): String {
    val h = (minutes / 60).coerceIn(0, 23)
    val m = (minutes % 60).coerceIn(0, 59)
    return "%02d:%02d".format(h, m)
}
