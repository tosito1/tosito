package com.toust.remotepc

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.toust.remotepc.data.FirebaseRepository
import com.toust.remotepc.data.PcInfo
import com.toust.remotepc.data.WebSocketManager
import com.toust.remotepc.data.AudioStreamPlayer
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

private const val TAG = "RemoteViewModel"

sealed class Screen {
    object Login  : Screen()
    object Setup  : Screen()
    object Remote : Screen()
}

data class PcStats(
    val ramTotal: Long = 0,
    val ramUsed: Long = 0,
    val ramFree: Long = 0,
    val ramPct: Float = 0f,
    val cpu: Float = 0f
)

data class RemoteUiState(
    val screen: Screen             = Screen.Login,
    val isLoading: Boolean         = false,
    val errorMessage: String?      = null,
    val availablePcs: List<PcInfo> = emptyList(),
    val selectedPc: PcInfo?        = null,
    val wsState: WebSocketManager.ConnectionState = WebSocketManager.ConnectionState.DISCONNECTED,
    val statusMessage: String?     = null,
    val pcStats: PcStats           = PcStats(),
    val isAudioEnabled: Boolean    = false
)

class RemoteViewModel : ViewModel() {

    val repository = FirebaseRepository()
    val wsManager  = WebSocketManager()
    private val audioPlayer = AudioStreamPlayer()

    private val _uiState = MutableStateFlow(RemoteUiState())
    val uiState: StateFlow<RemoteUiState> = _uiState.asStateFlow()

    init {
        // Observar estado del WebSocket
        viewModelScope.launch {
            wsManager.stateFlow.collect { state ->
                _uiState.update { it.copy(wsState = state) }
            }
        }
        viewModelScope.launch {
            wsManager.messageFlow.collect { msg ->
                when {
                    msg.startsWith("STATUS|") ->
                        _uiState.update { it.copy(statusMessage = msg.substring(7)) }
                    msg.startsWith("ERROR|CON|") -> {
                        val details = msg.substring(10)
                        val userFriendly = when {
                            details.contains("Unable to resolve host") -> 
                                "Error DNS: La dirección del PC no es válida. El túnel podría estar apagado o caducado."
                            details.contains("Failed to connect") ->
                                "No se pudo conectar al servidor del PC. Revisa que el Optimizador esté abierto."
                            else -> "Error de conexión: $details"
                        }
                        _uiState.update { it.copy(errorMessage = userFriendly) }
                    }
                    msg.startsWith("STATS|") -> {
                        val json = msg.substring(6)
                        try {
                            // Parse simple JSON without Gson
                            fun getFloat(key: String): Float =
                                Regex("\"$key\":([\\.\\d]+)").find(json)?.groupValues?.get(1)?.toFloatOrNull() ?: 0f
                            fun getLong(key: String): Long =
                                Regex("\"$key\":(\\d+)").find(json)?.groupValues?.get(1)?.toLongOrNull() ?: 0L
                            _uiState.update { it.copy(pcStats = PcStats(
                                ramTotal = getLong("ramTotal"),
                                ramUsed  = getLong("ramUsed"),
                                ramFree  = getLong("ramFree"),
                                ramPct   = getFloat("ramPct"),
                                cpu      = getFloat("cpu")
                            ))}
                        } catch (_: Exception) {}
                    }
                }
            }
        }
        // Navegar automáticamente si ya hay sesión
        if (repository.isSignedIn) {
            _uiState.update { it.copy(screen = Screen.Setup) }
            loadPcs()
        }
    }

    // ── Navegación ────────────────────────────────────────────────────────────

    fun onLoginSuccess() {
        _uiState.update { it.copy(screen = Screen.Setup, errorMessage = null) }
        loadPcs()
    }

    fun onPcSelected(pc: PcInfo) {
        _uiState.update { it.copy(selectedPc = pc, screen = Screen.Remote) }
        connectToSelectedPc(pc)
    }

    fun onDisconnect() {
        wsManager.disconnect()
        audioPlayer.stop()
        _uiState.update { it.copy(screen = Screen.Setup, selectedPc = null, isAudioEnabled = false) }
    }

    fun toggleAudio() {
        val newState = !_uiState.value.isAudioEnabled
        _uiState.update { it.copy(isAudioEnabled = newState) }
        
        if (newState) {
            val pc = _uiState.value.selectedPc
            if (pc != null) {
                viewModelScope.launch {
                    val token = repository.getFreshIdToken()
                    val audioUrl = (pc.tunnelUrl.trimEnd('/') ?: "") + "/audio"
                    audioPlayer.start(audioUrl, token)
                }
            }
        } else {
            audioPlayer.stop()
        }
    }

    // ── Auth ──────────────────────────────────────────────────────────────────

    fun signIn(context: Context) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val ok = repository.signInWithGoogle(context)
            if (ok) {
                onLoginSuccess()
            } else {
                _uiState.update { it.copy(isLoading = false, errorMessage = "No se pudo iniciar sesión con Google") }
            }
        }
    }

    // ── Firestore ──────────────────────────────────────────────────────────────
    
    fun pairPc(code: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val result = repository.pairPc(code)
            result.onSuccess {
                _uiState.update { it.copy(isLoading = false, statusMessage = "¡PC vinculado correctamente!") }
                loadPcs()
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, errorMessage = e.message) }
            }
        }
    }

    fun unlinkPc(pc: PcInfo) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val result = repository.unlinkPc(pc.pcId)
            result.onSuccess {
                _uiState.update { it.copy(isLoading = false, statusMessage = "¡PC desvinculado con éxito!") }
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, errorMessage = e.message) }
            }
        }
    }

    private fun loadPcs() {
        _uiState.update { it.copy(isLoading = true) }
        repository.listenForPcs { pcs ->
            _uiState.update { it.copy(availablePcs = pcs, isLoading = false) }
        }
    }

    // ── WebSocket ──────────────────────────────────────────────────────────────

    private fun connectToSelectedPc(pc: PcInfo) {
        viewModelScope.launch {
            val token = repository.getFreshIdToken()
            if (token != null) {
                Log.d(TAG, "Conectando a ${pc.machineName} → ${pc.tunnelUrl} usando Firebase ID Token")
                wsManager.connect(pc.tunnelUrl, token)
            } else {
                val pin = pc.pairingCode
                if (pin == null) {
                    _uiState.update { it.copy(errorMessage = "Error: no se encontró el PIN de vinculación en el servidor") }
                    return@launch
                }
                Log.d(TAG, "Conectando a ${pc.machineName} → ${pc.tunnelUrl} con PIN de respaldo $pin")
                wsManager.connect(pc.tunnelUrl, pin)
            }
        }
    }

    fun clearError() = _uiState.update { it.copy(errorMessage = null) }
    fun clearStatus() = _uiState.update { it.copy(statusMessage = null) }

    override fun onCleared() {
        super.onCleared()
        wsManager.disconnect()
    }
}
