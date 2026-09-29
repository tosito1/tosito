package com.toust.spotis.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.toust.spotis.data.model.Track
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

class TrackRepository {
    private val db = FirebaseFirestore.getInstance()

    // ─── Favorites ────────────────────────────────────────────────────────────────

    fun observeFavorites(userId: String): Flow<List<Track>> = callbackFlow {
        val ref = db.collection("users").document(userId).collection("favorites")
        val listener = ref.addSnapshotListener { snap, err ->
            if (err != null) { close(err); return@addSnapshotListener }
            val tracks = snap?.documents?.mapNotNull { doc ->
                try {
                    Track(
                        id = doc.getString("id") ?: return@mapNotNull null,
                        title = doc.getString("title") ?: "",
                        artist = doc.getString("artist") ?: "",
                        album = doc.getString("album") ?: "",
                        albumArt = doc.getString("albumArt") ?: "",
                        previewUrl = doc.getString("previewUrl") ?: "",
                        youtubeId = doc.getString("youtubeId") ?: "",
                        durationMs = doc.getLong("durationMs") ?: 0L,
                        spotifyUri = doc.getString("spotifyUri") ?: "",
                        addedAt = doc.getLong("addedAt") ?: 0L
                    )
                } catch (e: Exception) { null }
            } ?: emptyList()
            trySend(tracks)
        }
        awaitClose { listener.remove() }
    }

    suspend fun addFavorite(userId: String, track: Track) {
        db.collection("users").document(userId)
            .collection("favorites").document(track.id)
            .set(mapOf(
                "id" to track.id,
                "title" to track.title,
                "artist" to track.artist,
                "album" to track.album,
                "albumArt" to track.albumArt,
                "previewUrl" to track.previewUrl,
                "youtubeId" to track.youtubeId,
                "durationMs" to track.durationMs,
                "spotifyUri" to track.spotifyUri,
                "addedAt" to System.currentTimeMillis()
            ), SetOptions.merge()).await()
    }

    suspend fun removeFavorite(userId: String, trackId: String) {
        db.collection("users").document(userId)
            .collection("favorites").document(trackId)
            .delete().await()
    }

    suspend fun isFavorite(userId: String, trackId: String): Boolean {
        val doc = db.collection("users").document(userId)
            .collection("favorites").document(trackId)
            .get().await()
        return doc.exists()
    }
}
