package com.toust.tosito.data.model

import com.google.firebase.Timestamp

data class Note(
    val id: String = "",
    val userId: String = "",
    val text: String = "",
    val isCompleted: Boolean = false,
    val createdAt: Timestamp? = null
)
