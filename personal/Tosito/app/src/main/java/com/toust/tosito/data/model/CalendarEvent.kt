package com.toust.tosito.data.model

data class CalendarEvent(
    val id: String = "",
    val userId: String = "",
    val title: String = "",
    val description: String = "",
    val date: String = "",       // "yyyy-MM-dd"
    val startTime: String = "",  // "HH:mm"
    val endTime: String = "",    // "HH:mm" (opcional)
    val category: EventCategory = EventCategory.PERSONAL,
    val isCompleted: Boolean = false,
    val priority: EventPriority = EventPriority.MEDIUM
)

enum class EventCategory(val label: String, val emoji: String) {
    PERSONAL("Personal", "👤"),
    TRABAJO("Trabajo", "💼"),
    SALUD("Salud", "🏥"),
    GYM("Gym", "💪"),
    SOCIAL("Social", "🎉"),
    ESTUDIO("Estudio", "📚"),
    OTRO("Otro", "📌")
}

enum class EventPriority(val label: String) {
    HIGH("Alta"),
    MEDIUM("Media"),
    LOW("Baja")
}
