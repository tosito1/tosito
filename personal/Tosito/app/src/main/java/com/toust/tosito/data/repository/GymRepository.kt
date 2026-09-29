package com.toust.tosito.data.repository

import android.util.Log
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.toust.tosito.data.model.CompletedSet
import com.toust.tosito.data.model.GymRoutine
import com.toust.tosito.data.model.WorkoutSession
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.tasks.await

class GymRepository {

    private fun getFirestore(): FirebaseFirestore? {
        return try {
            FirebaseFirestore.getInstance().also {
                Log.d("GymRepository", "Firestore instance obtained successfully")
            }
        } catch (e: Exception) {
            Log.e("GymRepository", "Error getting Firestore instance", e)
            null
        }
    }

    private fun getCollection() = getFirestore()?.collection("tose_gym_routines")
    private fun getSessionsCollection() = getFirestore()?.collection("tose_gym_sessions")

    // ── Rutinas ───────────────────────────────────────────────────────────────

    fun getRoutinesByUserId(userId: String): Flow<List<GymRoutine>> = flow {
        try {
            val snap = getCollection()
                ?.whereEqualTo("userId", userId)
                ?.orderBy("createdAt", Query.Direction.DESCENDING)
                ?.get()?.await()
            emit(snap?.documents?.map { GymRoutine.fromFirestore(it) } ?: emptyList())
        } catch (e: Exception) { emit(emptyList()) }
    }

    suspend fun getTodayRoutine(userId: String): GymRoutine? =
        getRoutineByDayOfWeekSync(userId, getCurrentDayOfWeek())

    suspend fun getRoutineByDayOfWeekSync(userId: String, dayOfWeek: String): GymRoutine? {
        return try {
            val snap = getCollection()
                ?.whereEqualTo("userId", userId)
                ?.whereEqualTo("dayOfWeek", dayOfWeek)
                ?.limit(1)?.get()?.await()
            snap?.documents?.firstOrNull()?.let { GymRoutine.fromFirestore(it) }
        } catch (e: Exception) { null }
    }

    suspend fun getAllRoutines(userId: String): List<GymRoutine> {
        return try {
            val snap = getCollection()
                ?.whereEqualTo("userId", userId)
                ?.get()?.await()
            snap?.documents?.map { GymRoutine.fromFirestore(it) }
                ?.sortedBy { getAllDaysOfWeek().indexOf(it.dayOfWeek) } ?: emptyList()
        } catch (e: Exception) { emptyList() }
    }

    suspend fun saveRoutine(routine: GymRoutine, userId: String): Boolean {
        return try {
            val col = getCollection() ?: return false
            val exercisesData = routine.exercises.map { ex ->
                hashMapOf<String, Any>(
                    "name"        to ex.name,
                    "reps"        to ex.reps,
                    "sets"        to ex.sets,
                    "weight"      to ex.weight,
                    "muscleGroup" to ex.muscleGroup.name,
                    "restSeconds" to ex.restSeconds,
                    "notes"       to ex.notes
                )
            }
            val data = hashMapOf<String, Any>(
                "name"          to routine.name.ifEmpty { routine.dayOfWeek },
                "dayOfWeek"     to routine.dayOfWeek,
                "description"   to routine.description,
                "userId"        to userId,
                "exercises"     to exercisesData,
                "targetMuscles" to routine.targetMuscles.map { it.name },
                "updatedAt"     to Timestamp.now()
            )
            if (routine.id.isEmpty()) {
                data["createdAt"] = Timestamp.now()
                col.add(data).await()
            } else {
                col.document(routine.id).set(data).await()
            }
            true
        } catch (e: Exception) {
            Log.e("GymRepository", "Error saving routine", e)
            false
        }
    }

    suspend fun deleteRoutine(routineId: String): Boolean {
        return try {
            getCollection()?.document(routineId)?.delete()?.await()
            true
        } catch (e: Exception) { false }
    }

    // ── Sesiones ──────────────────────────────────────────────────────────────

    suspend fun saveSession(session: WorkoutSession, userId: String): Boolean {
        return try {
            val col = getSessionsCollection() ?: return false
            val setsData = session.completedSets.map { s ->
                hashMapOf<String, Any>(
                    "exerciseName"  to s.exerciseName,
                    "setNumber"     to s.setNumber,
                    "repsCompleted" to s.repsCompleted,
                    "weightUsed"    to s.weightUsed,
                    "timestamp"     to (s.timestamp ?: Timestamp.now())
                )
            }
            val data = hashMapOf<String, Any>(
                "userId"          to userId,
                "routineId"       to session.routineId,
                "routineName"     to session.routineName,
                "dayOfWeek"       to session.dayOfWeek,
                "date"            to session.date,
                "startTime"       to session.startTime,
                "endTime"         to session.endTime,
                "durationMinutes" to session.durationMinutes,
                "completedSets"   to setsData,
                "totalVolume"     to session.totalVolume,
                "notes"           to session.notes,
                "createdAt"       to Timestamp.now()
            )
            col.add(data).await()
            true
        } catch (e: Exception) {
            Log.e("GymRepository", "Error saving session", e)
            false
        }
    }

    suspend fun getRecentSessions(userId: String, limit: Long = 20): List<WorkoutSession> {
        return try {
            val snap = getSessionsCollection()
                ?.whereEqualTo("userId", userId)
                ?.orderBy("createdAt", Query.Direction.DESCENDING)
                ?.limit(limit)
                ?.get()?.await()
            snap?.documents?.mapNotNull { doc ->
                val d = doc.data ?: return@mapNotNull null
                @Suppress("UNCHECKED_CAST")
                val setsRaw = d["completedSets"] as? List<Map<String, Any>> ?: emptyList()
                val sets = setsRaw.map { s ->
                    CompletedSet(
                        exerciseName  = s["exerciseName"] as? String ?: "",
                        setNumber     = (s["setNumber"] as? Long)?.toInt() ?: 0,
                        repsCompleted = (s["repsCompleted"] as? Long)?.toInt() ?: 0,
                        weightUsed    = (s["weightUsed"] as? Double)?.toFloat() ?: 0f,
                        timestamp     = s["timestamp"] as? Timestamp
                    )
                }
                WorkoutSession(
                    id              = doc.id,
                    userId          = d["userId"] as? String ?: "",
                    routineId       = d["routineId"] as? String ?: "",
                    routineName     = d["routineName"] as? String ?: "",
                    dayOfWeek       = d["dayOfWeek"] as? String ?: "",
                    date            = d["date"] as? String ?: "",
                    startTime       = d["startTime"] as? String ?: "",
                    endTime         = d["endTime"] as? String ?: "",
                    durationMinutes = (d["durationMinutes"] as? Long)?.toInt() ?: 0,
                    completedSets   = sets,
                    totalVolume     = (d["totalVolume"] as? Double)?.toFloat() ?: 0f,
                    notes           = d["notes"] as? String ?: "",
                    createdAt       = d["createdAt"] as? Timestamp
                )
            } ?: emptyList()
        } catch (e: Exception) {
            Log.e("GymRepository", "Error getting sessions", e)
            emptyList()
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    fun getCurrentDayOfWeek(): String {
        val days = listOf("Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado")
        return days[java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_WEEK) - 1]
    }

    fun getAllDaysOfWeek(): List<String> =
        listOf("Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo")
}
