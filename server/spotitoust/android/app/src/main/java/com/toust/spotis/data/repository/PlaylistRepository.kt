package com.toust.spotis.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.toust.spotis.data.model.Playlist
import com.toust.spotis.data.model.Track
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.UUID

class PlaylistRepository {
    private val db = FirebaseFirestore.getInstance()

    fun observePlaylists(userId: String): Flow<List<Playlist>> = callbackFlow {
        val ref = db.collection("users").document(userId).collection("playlists")
            .orderBy("updatedAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
        val listener = ref.addSnapshotListener { snap, err ->
            if (err != null) { close(err); return@addSnapshotListener }
            val playlists = snap?.documents?.mapNotNull { doc ->
                try {
                    val tracksRaw = doc.get("tracks") as? List<Map<String, Any>> ?: emptyList()
                    Playlist(
                        id = doc.id,
                        name = doc.getString("name") ?: "",
                        description = doc.getString("description") ?: "",
                        coverUrl = doc.getString("coverUrl") ?: "",
                        ownerId = userId,
                        tracks = tracksRaw.mapNotNull { t ->
                            try {
                                Track(
                                    id = t["id"] as? String ?: return@mapNotNull null,
                                    title = t["title"] as? String ?: "",
                                    artist = t["artist"] as? String ?: "",
                                    album = t["album"] as? String ?: "",
                                    albumArt = t["albumArt"] as? String ?: "",
                                    previewUrl = t["previewUrl"] as? String ?: "",
                                    youtubeId = t["youtubeId"] as? String ?: "",
                                    durationMs = (t["durationMs"] as? Long) ?: 0L,
                                    spotifyUri = t["spotifyUri"] as? String ?: ""
                                )
                            } catch (e: Exception) { null }
                        },
                        createdAt = doc.getLong("createdAt") ?: 0L,
                        updatedAt = doc.getLong("updatedAt") ?: 0L
                    )
                } catch (e: Exception) { null }
            } ?: emptyList()
            trySend(playlists)
        }
        awaitClose { listener.remove() }
    }

    suspend fun createPlaylist(userId: String, name: String, description: String = ""): String {
        val id = UUID.randomUUID().toString()
        val now = System.currentTimeMillis()
        db.collection("users").document(userId).collection("playlists").document(id)
            .set(mapOf(
                "name" to name,
                "description" to description,
                "coverUrl" to "",
                "tracks" to emptyList<Map<String, Any>>(),
                "createdAt" to now,
                "updatedAt" to now
            )).await()
        return id
    }

    suspend fun addTrackToPlaylist(userId: String, playlistId: String, track: Track) {
        val ref = db.collection("users").document(userId).collection("playlists").document(playlistId)
        val snap = ref.get().await()
        val tracksRaw = snap.get("tracks") as? List<Map<String, Any>> ?: emptyList()
        if (tracksRaw.any { it["id"] == track.id }) return
        val newTrack = mapOf(
            "id" to track.id, "title" to track.title, "artist" to track.artist,
            "album" to track.album, "albumArt" to track.albumArt,
            "previewUrl" to track.previewUrl, "youtubeId" to track.youtubeId,
            "durationMs" to track.durationMs, "spotifyUri" to track.spotifyUri
        )
        ref.update(mapOf(
            "tracks" to (tracksRaw + newTrack),
            "updatedAt" to System.currentTimeMillis()
        )).await()
    }

    suspend fun removeTrackFromPlaylist(userId: String, playlistId: String, trackId: String) {
        val ref = db.collection("users").document(userId).collection("playlists").document(playlistId)
        val snap = ref.get().await()
        val tracksRaw = snap.get("tracks") as? List<Map<String, Any>> ?: emptyList()
        val updated = tracksRaw.filter { it["id"] != trackId }
        ref.update(mapOf("tracks" to updated, "updatedAt" to System.currentTimeMillis())).await()
    }

    suspend fun deletePlaylist(userId: String, playlistId: String) {
        db.collection("users").document(userId).collection("playlists").document(playlistId)
            .delete().await()
    }
}
