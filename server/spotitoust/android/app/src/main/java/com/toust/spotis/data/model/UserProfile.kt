package com.toust.spotis.data.model

import kotlinx.serialization.Serializable

@Serializable
data class SpotifyProfile(
    val id: String = "",
    val display_name: String = "",
    val email: String = "",
    val country: String = "",
    val product: String = "",
    val followers: SpotifyFollowers = SpotifyFollowers(),
    val images: List<SpotifyImage> = emptyList(),
    val external_urls: Map<String, String> = emptyMap(),
    val uri: String = ""
) {
    val imageUrl: String get() = images.firstOrNull()?.url ?: ""
    val initials: String get() = display_name.firstOrNull()?.uppercase() ?: "S"
}

@Serializable
data class SpotifyFollowers(
    val total: Int = 0
)

@Serializable
data class UserProfile(
    val uid: String = "",
    val displayName: String = "",
    val email: String = "",
    val photoUrl: String = "",
    val provider: String = "email", // "email", "google", "spotify"
    val createdAt: Long = System.currentTimeMillis()
) {
    val initials: String get() = displayName.firstOrNull()?.uppercase() ?: "S"
}
