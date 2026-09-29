package com.toust.tosito.data.repository

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.toust.tosito.data.model.CalendarEvent
import com.toust.tosito.data.model.EventCategory
import com.toust.tosito.data.model.EventPriority
import kotlinx.coroutines.tasks.await

class CalendarRepository {

    private val tag = "CalendarRepository"
    private val collectionName = "tose_events"

    private fun getFirestore(): FirebaseFirestore {
        return FirebaseFirestore.getInstance()
    }

    private fun getCollection() = getFirestore().collection(collectionName)

    private fun eventToMap(event: CalendarEvent): Map<String, Any> = mapOf(
        "userId" to event.userId,
        "title" to event.title,
        "description" to event.description,
        "date" to event.date,
        "startTime" to event.startTime,
        "endTime" to event.endTime,
        "category" to event.category.name,
        "isCompleted" to event.isCompleted,
        "priority" to event.priority.name
    )

    private fun mapToEvent(id: String, data: Map<String, Any?>): CalendarEvent {
        return CalendarEvent(
            id = id,
            userId = data["userId"] as? String ?: "",
            title = data["title"] as? String ?: "",
            description = data["description"] as? String ?: "",
            date = data["date"] as? String ?: "",
            startTime = data["startTime"] as? String ?: "",
            endTime = data["endTime"] as? String ?: "",
            category = try {
                EventCategory.valueOf(data["category"] as? String ?: EventCategory.PERSONAL.name)
            } catch (e: Exception) { EventCategory.PERSONAL },
            isCompleted = data["isCompleted"] as? Boolean ?: false,
            priority = try {
                EventPriority.valueOf(data["priority"] as? String ?: EventPriority.MEDIUM.name)
            } catch (e: Exception) { EventPriority.MEDIUM }
        )
    }

    suspend fun getEventsByMonth(userId: String, yearMonth: String): List<CalendarEvent> {
        // yearMonth = "yyyy-MM"
        return try {
            val snapshot = getCollection()
                .whereEqualTo("userId", userId)
                .whereGreaterThanOrEqualTo("date", "$yearMonth-01")
                .whereLessThanOrEqualTo("date", "$yearMonth-31")
                .orderBy("date", Query.Direction.ASCENDING)
                .orderBy("startTime", Query.Direction.ASCENDING)
                .get()
                .await()
            snapshot.documents.mapNotNull { doc ->
                doc.data?.let { mapToEvent(doc.id, it) }
            }.also { Log.d(tag, "Loaded ${it.size} events for $yearMonth") }
        } catch (e: Exception) {
            Log.e(tag, "Error getting events by month", e)
            emptyList()
        }
    }

    suspend fun getEventsByDate(userId: String, date: String): List<CalendarEvent> {
        return try {
            val snapshot = getCollection()
                .whereEqualTo("userId", userId)
                .whereEqualTo("date", date)
                .orderBy("startTime", Query.Direction.ASCENDING)
                .get()
                .await()
            snapshot.documents.mapNotNull { doc ->
                doc.data?.let { mapToEvent(doc.id, it) }
            }.also { Log.d(tag, "Loaded ${it.size} events for $date") }
        } catch (e: Exception) {
            Log.e(tag, "Error getting events by date", e)
            emptyList()
        }
    }

    suspend fun saveEvent(event: CalendarEvent): Boolean {
        return try {
            if (event.id.isEmpty()) {
                getCollection().add(eventToMap(event)).await()
            } else {
                getCollection().document(event.id).set(eventToMap(event)).await()
            }
            Log.d(tag, "Event saved: ${event.title}")
            true
        } catch (e: Exception) {
            Log.e(tag, "Error saving event", e)
            false
        }
    }

    suspend fun updateCompletedStatus(eventId: String, isCompleted: Boolean): Boolean {
        return try {
            getCollection().document(eventId).update("isCompleted", isCompleted).await()
            true
        } catch (e: Exception) {
            Log.e(tag, "Error updating event status", e)
            false
        }
    }

    suspend fun deleteEvent(eventId: String): Boolean {
        return try {
            getCollection().document(eventId).delete().await()
            Log.d(tag, "Event deleted: $eventId")
            true
        } catch (e: Exception) {
            Log.e(tag, "Error deleting event", e)
            false
        }
    }
}
