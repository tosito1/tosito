package com.toust.spotis.data.model

data class Artist(
    val id: String,
    val name: String,
    val coverUrl: String,
    val isSpotify: Boolean = true
)
