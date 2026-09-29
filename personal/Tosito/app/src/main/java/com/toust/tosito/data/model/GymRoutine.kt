package com.toust.tosito.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot

// ─── Grupo muscular ───────────────────────────────────────────────────────────
enum class MuscleGroup(val label: String, val emoji: String) {
    PECHO("Pecho", "💪"),
    ESPALDA("Espalda", "🔙"),
    HOMBROS("Hombros", "🏋️"),
    BICEPS("Bíceps", "💪"),
    TRICEPS("Tríceps", "💪"),
    PIERNAS("Piernas", "🦵"),
    GLUTEOS("Glúteos", "🍑"),
    ABDOMEN("Abdomen", "🎯"),
    CARDIO("Cardio", "❤️"),
    FULL_BODY("Cuerpo completo", "⚡"),
    OTRO("Otro", "📌")
}

// ─── Exercise mejorado ────────────────────────────────────────────────────────
data class Exercise(
    val name: String = "",
    val reps: String = "",          // "8-12" o "10" etc.
    val sets: Int = 0,
    val weight: Float = 0f,        // kg, ahora float para 22.5kg etc.
    val muscleGroup: MuscleGroup = MuscleGroup.OTRO,
    val restSeconds: Int = 90,     // descanso entre series en seg
    val notes: String = ""         // notas del ejercicio
)

// ─── Serie individual completada durante una sesión ──────────────────────────
data class CompletedSet(
    val exerciseName: String = "",
    val setNumber: Int = 0,
    val repsCompleted: Int = 0,
    val weightUsed: Float = 0f,
    val timestamp: Timestamp? = null
)

// ─── Sesión de entrenamiento completada ──────────────────────────────────────
data class WorkoutSession(
    val id: String = "",
    val userId: String = "",
    val routineId: String = "",
    val routineName: String = "",
    val dayOfWeek: String = "",
    val date: String = "",          // yyyy-MM-dd
    val startTime: String = "",     // HH:mm
    val endTime: String = "",
    val durationMinutes: Int = 0,
    val completedSets: List<CompletedSet> = emptyList(),
    val totalVolume: Float = 0f,    // kg totales levantados
    val notes: String = "",
    val createdAt: Timestamp? = null
)

// ─── GymRoutine mejorada ──────────────────────────────────────────────────────
data class GymRoutine(
    val id: String = "",
    val name: String = "",
    val dayOfWeek: String = "",
    val description: String = "",
    val exercises: List<Exercise> = emptyList(),
    val userId: String = "",
    val targetMuscles: List<MuscleGroup> = emptyList(),
    val createdAt: Timestamp? = null,
    val updatedAt: Timestamp? = null
) {
    companion object {
        fun fromFirestore(document: DocumentSnapshot): GymRoutine {
            val data = document.data ?: return GymRoutine()

            val exercisesList = (data["exercises"] as? List<Map<String, Any>>)?.map { ex ->
                Exercise(
                    name        = ex["name"] as? String ?: "",
                    reps        = ex["reps"] as? String ?: "",
                    sets        = (ex["sets"] as? Long)?.toInt() ?: 0,
                    weight      = (ex["weight"] as? Double)?.toFloat()
                                    ?: (ex["weight"] as? Long)?.toFloat() ?: 0f,
                    muscleGroup = try { MuscleGroup.valueOf(ex["muscleGroup"] as? String ?: MuscleGroup.OTRO.name) }
                                  catch (e: Exception) { MuscleGroup.OTRO },
                    restSeconds = (ex["restSeconds"] as? Long)?.toInt() ?: 90,
                    notes       = ex["notes"] as? String ?: ""
                )
            } ?: emptyList()

            @Suppress("UNCHECKED_CAST")
            val musclesRaw = data["targetMuscles"] as? List<String> ?: emptyList()
            val muscles = musclesRaw.mapNotNull { s ->
                try { MuscleGroup.valueOf(s) } catch (e: Exception) { null }
            }

            return GymRoutine(
                id            = document.id,
                name          = data["name"] as? String ?: "",
                dayOfWeek     = data["dayOfWeek"] as? String ?: "",
                description   = data["description"] as? String ?: "",
                exercises     = exercisesList,
                userId        = data["userId"] as? String ?: "",
                targetMuscles = muscles,
                createdAt     = data["createdAt"] as? Timestamp,
                updatedAt     = data["updatedAt"] as? Timestamp
            )
        }
    }
}
