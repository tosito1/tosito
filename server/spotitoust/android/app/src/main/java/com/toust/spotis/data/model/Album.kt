package com.toust.spotis.data.model

data class Album(
    val id: String,
    val name: String,
    val artist: String,
    val coverUrl: String,
    val isSpotify: Boolean = true
)
