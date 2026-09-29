package com.toust.spotis.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Playlist(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val coverUrl: String = "",
    val ownerId: String = "",
    val tracks: List<Track> = emptyList(),
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val isSpotify: Boolean = false
) {
    val trackCount: Int get() = tracks.size
}
