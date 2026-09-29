package com.toust.spotis.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Track(
    val id: String = "",
    val title: String = "",
    val artist: String = "",
    val album: String = "",
    val albumArt: String = "",
    val previewUrl: String = "",
    val youtubeId: String = "",
    val durationMs: Long = 0L,
    val spotifyUri: String = "",
    val addedAt: Long = System.currentTimeMillis()
) {
    val durationFormatted: String
        get() {
            val totalSeconds = durationMs / 1000
            val mins = totalSeconds / 60
            val secs = totalSeconds % 60
            return "$mins:${if (secs < 10) "0$secs" else "$secs"}"
        }
}

@Serializable
data class SpotifyTrack(
    val id: String = "",
    val name: String = "",
    val artists: List<SpotifyArtist> = emptyList(),
    val album: SpotifyAlbum = SpotifyAlbum(),
    val preview_url: String? = null,
    val duration_ms: Long = 0L,
    val uri: String = ""
) {
    fun toTrack(): Track = Track(
        id = id,
        title = name,
        artist = artists.firstOrNull()?.name ?: "Artista desconocido",
        album = album.name,
        albumArt = album.images.firstOrNull()?.url ?: "",
        previewUrl = preview_url ?: "",
        durationMs = duration_ms,
        spotifyUri = uri
    )
}

@Serializable
data class SpotifyArtist(
    val id: String = "",
    val name: String = ""
)

@Serializable
data class SpotifyAlbum(
    val id: String = "",
    val name: String = "",
    val images: List<SpotifyImage> = emptyList()
)

@Serializable
data class SpotifyImage(
    val url: String = "",
    val width: Int = 0,
    val height: Int = 0
)

@Serializable
data class SpotifySearchResponse(
    val tracks: SpotifyTrackPage = SpotifyTrackPage()
)

@Serializable
data class SpotifyTrackPage(
    val items: List<SpotifyTrack> = emptyList(),
    val total: Int = 0,
    val next: String? = null
)
