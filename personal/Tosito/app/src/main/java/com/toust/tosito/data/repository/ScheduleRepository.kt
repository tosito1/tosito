package com.toust.tosito.data.repository

import android.util.Log
import com.google.firebase.firestore.FirebaseFirestore
import com.toust.tosito.data.model.ScheduleBlock
import com.toust.tosito.data.model.ScheduleCategory
import kotlinx.coroutines.tasks.await

class ScheduleRepository {

    private val tag = "ScheduleRepository"
    private val collectionName = "tose_schedule"

    private fun getCollection() = FirebaseFirestore.getInstance().collection(collectionName)

    @Suppress("UNCHECKED_CAST")
    private fun mapToBlock(id: String, data: Map<String, Any?>): ScheduleBlock {
        val daysRaw = data["daysOfWeek"]
        val days: List<Int> = when (daysRaw) {
            is List<*> -> daysRaw.mapNotNull { (it as? Long)?.toInt() ?: (it as? Int) }
            else -> listOf(1, 2, 3, 4, 5, 6, 7)
        }
        return ScheduleBlock(
            id = id,
            userId = data["userId"] as? String ?: "",
            title = data["title"] as? String ?: "",
            startTime = data["startTime"] as? String ?: "",
            endTime = data["endTime"] as? String ?: "",
            category = try {
                ScheduleCategory.valueOf(data["category"] as? String ?: ScheduleCategory.RUTINA.name)
            } catch (e: Exception) { ScheduleCategory.RUTINA },
            daysOfWeek = days,
            color = data["color"] as? String ?: "#7C3AED",
            isActive = data["isActive"] as? Boolean ?: true
        )
    }

    private fun blockToMap(block: ScheduleBlock): Map<String, Any> = mapOf(
        "userId"     to block.userId,
        "title"      to block.title,
        "startTime"  to block.startTime,
        "endTime"    to block.endTime,
        "category"   to block.category.name,
        "daysOfWeek" to block.daysOfWeek,
        "color"      to block.color,
        "isActive"   to block.isActive
    )

    /** Devuelve todos los bloques activos del usuario */
    suspend fun getAllBlocks(userId: String): List<ScheduleBlock> {
        return try {
            val snap = getCollection()
                .whereEqualTo("userId", userId)
                .whereEqualTo("isActive", true)
                .get()
                .await()
            snap.documents.mapNotNull { doc ->
                doc.data?.let { mapToBlock(doc.id, it) }
            }.sortedBy { it.startTime }
                .also { Log.d(tag, "Loaded ${it.size} schedule blocks") }
        } catch (e: Exception) {
            Log.e(tag, "Error loading schedule", e)
            emptyList()
        }
    }

    /** Bloques activos para un día de la semana concreto (1=Lun … 7=Dom) */
    suspend fun getBlocksForDay(userId: String, dayOfWeek: Int): List<ScheduleBlock> {
        return getAllBlocks(userId).filter { it.daysOfWeek.contains(dayOfWeek) }
    }

    suspend fun saveBlock(block: ScheduleBlock): Boolean {
        return try {
            if (block.id.isEmpty()) {
                getCollection().add(blockToMap(block)).await()
            } else {
                getCollection().document(block.id).set(blockToMap(block)).await()
            }
            Log.d(tag, "Block saved: ${block.title}")
            true
        } catch (e: Exception) {
            Log.e(tag, "Error saving block", e)
            false
        }
    }

    suspend fun deleteBlock(blockId: String): Boolean {
        return try {
            getCollection().document(blockId).delete().await()
            true
        } catch (e: Exception) {
            Log.e(tag, "Error deleting block", e)
            false
        }
    }
}
