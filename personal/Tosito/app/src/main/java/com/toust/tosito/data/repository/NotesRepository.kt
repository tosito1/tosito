package com.toust.tosito.data.repository

import android.util.Log
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.toust.tosito.data.model.Note
import kotlinx.coroutines.tasks.await

class NotesRepository {
    private val db = FirebaseFirestore.getInstance()
    private val notesCol = db.collection("tose_notes")

    suspend fun getNotes(userId: String): List<Note> {
        return try {
            val snap = notesCol
                .whereEqualTo("userId", userId)
                .get().await()
            snap.documents.mapNotNull { doc ->
                val d = doc.data ?: return@mapNotNull null
                Note(
                    id = doc.id,
                    userId = d["userId"] as? String ?: "",
                    text = d["text"] as? String ?: "",
                    isCompleted = d["isCompleted"] as? Boolean ?: false,
                    createdAt = d["createdAt"] as? Timestamp
                )
            }.sortedBy { it.createdAt }
        } catch (e: Exception) {
            Log.e("NotesRepo", "Error getting notes", e)
            emptyList()
        }
    }

    suspend fun saveNote(note: Note, userId: String): Boolean {
        return try {
            val data = mapOf(
                "userId" to userId,
                "text" to note.text,
                "isCompleted" to note.isCompleted,
                "createdAt" to (note.createdAt ?: Timestamp.now())
            )
            if (note.id.isEmpty()) {
                notesCol.add(data).await()
            } else {
                notesCol.document(note.id).set(data).await()
            }
            true
        } catch (e: Exception) {
            Log.e("NotesRepo", "Error saving note", e)
            false
        }
    }

    suspend fun deleteNote(id: String): Boolean = try {
        notesCol.document(id).delete().await()
        true
    } catch (e: Exception) { false }
}
