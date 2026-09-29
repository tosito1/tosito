package com.toust.tosito.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.toust.tosito.data.model.Note
import com.toust.tosito.data.repository.NotesRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class NotesViewModel(application: Application) : AndroidViewModel(application) {
    private val repo = NotesRepository()
    private val userId get() = FirebaseAuth.getInstance().currentUser?.uid ?: ""

    private val _notes = MutableStateFlow<List<Note>>(emptyList())
    val notes: StateFlow<List<Note>> = _notes.asStateFlow()

    fun loadNotes() {
        if (userId.isEmpty()) return
        viewModelScope.launch {
            _notes.value = repo.getNotes(userId)
        }
    }

    fun addNote(text: String) {
        if (text.isBlank() || userId.isEmpty()) return
        viewModelScope.launch {
            val note = Note(text = text)
            repo.saveNote(note, userId)
            loadNotes()
        }
    }

    fun toggleNote(note: Note) {
        viewModelScope.launch {
            val updated = note.copy(isCompleted = !note.isCompleted)
            repo.saveNote(updated, userId)
            // Actualizar localmente para respuesta inmediata
            _notes.value = _notes.value.map { if (it.id == note.id) updated else it }
        }
    }

    fun deleteNote(note: Note) {
        viewModelScope.launch {
            repo.deleteNote(note.id)
            _notes.value = _notes.value.filter { it.id != note.id }
        }
    }
}
