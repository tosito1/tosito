package com.toust.tosito

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.google.firebase.auth.FirebaseAuth
import com.toust.tosito.data.model.Note
import com.toust.tosito.data.repository.NotesRepository
import com.toust.tosito.ui.theme.TositoTheme
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class AddNoteActivity : ComponentActivity() {

    private val repo = NotesRepository()

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Evitamos animaciones raras al abrir si queremos
        overridePendingTransition(0, 0)

        setContent {
            TositoTheme {
                var text by remember { mutableStateOf("") }
                var isSaving by remember { mutableStateOf(false) }

                Dialog(onDismissRequest = { finish() }) {
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF141C2A))
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Text(
                                text = "📝 Nueva nota rápida",
                                style = MaterialTheme.typography.titleLarge.copy(color = Color.White)
                            )
                            
                            OutlinedTextField(
                                value = text,
                                onValueChange = { text = it },
                                placeholder = { Text("Escribe aquí...", color = Color(0xFF6B7FA3)) },
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color(0xFFF59E0B),
                                    unfocusedBorderColor = Color(0xFF243044),
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White
                                ),
                                enabled = !isSaving
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End
                            ) {
                                TextButton(onClick = { finish() }) {
                                    Text("Cancelar", color = Color(0xFF6B7FA3))
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Button(
                                    onClick = {
                                        if (text.isNotBlank()) {
                                            isSaving = true
                                            saveNote(text)
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B)),
                                    enabled = !isSaving
                                ) {
                                    Text("Guardar", color = Color.White)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private fun saveNote(text: String) {
        val userId = FirebaseAuth.getInstance().currentUser?.uid
        if (userId.isNullOrEmpty()) {
            finish()
            return
        }
        
        CoroutineScope(Dispatchers.IO).launch {
            repo.saveNote(Note(text = text), userId)
            launch(Dispatchers.Main) {
                finish()
            }
        }
    }

    override fun finish() {
        super.finish()
        overridePendingTransition(0, 0)
    }
}
