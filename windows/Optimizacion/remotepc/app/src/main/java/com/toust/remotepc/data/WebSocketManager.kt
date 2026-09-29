package com.toust.remotepc.data

import android.util.Log
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import okhttp3.*

private const val TAG = "WebSocketManager"

/**
 * Gestiona la conexión WebSocket con el servidor PC via OkHttp.
 *
 * Protocolo:
 *   1. Al conectar, envía "AUTH|{firebaseIdToken}"
 *   2. Espera respuesta "AUTH_OK|..." del servidor
 *   3. A partir de ahí, envía comandos y recibe mensajes de estado
 */
class WebSocketManager {

    enum class ConnectionState { DISCONNECTED, CONNECTING, AUTHENTICATING, CONNECTED, ERROR }

    private val client = OkHttpClient()
    private var webSocket: WebSocket? = null
    private var idToken: String = ""
    private var scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // ── Flows públicos ────────────────────────────────────────────────────────
    private val _stateFlow   = MutableSharedFlow<ConnectionState>(replay = 1)
    private val _messageFlow = MutableSharedFlow<String>(extraBufferCapacity = 64)

    val stateFlow:   SharedFlow<ConnectionState> = _stateFlow
    val messageFlow: SharedFlow<String>          = _messageFlow

    // ── Conexión ──────────────────────────────────────────────────────────────

    /**
     * Conecta al servidor WebSocket.
     * @param tunnelUrl URL base del túnel, ej: "https://xyz.trycloudflare.com"
     * @param firebaseIdToken Token de Firebase para autenticarse en el servidor
     */
    fun connect(tunnelUrl: String, firebaseIdToken: String) {
        disconnect()
        idToken = firebaseIdToken

        // Convertir https:// → wss:// y appender /ws
        val wsUrl = tunnelUrl
            .trimEnd('/')
            .replace("https://", "wss://")
            .replace("http://", "ws://") + "/ws"

        Log.d(TAG, "Conectando a: $wsUrl")
        scope.launch { _stateFlow.emit(ConnectionState.CONNECTING) }

        val request = Request.Builder().url(wsUrl).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {

            override fun onOpen(ws: WebSocket, response: Response) {
                Log.d(TAG, "WS abierto, autenticando...")
                scope.launch { _stateFlow.emit(ConnectionState.AUTHENTICATING) }
                // Usamos el idToken como el PIN de vinculación para el servidor C#
                ws.send("AUTH_CODE|$idToken")
            }

            override fun onMessage(ws: WebSocket, text: String) {
                Log.d(TAG, "WS mensaje: $text")
                when {
                    text.startsWith("AUTH_OK|") -> {
                        scope.launch { _stateFlow.emit(ConnectionState.CONNECTED) }
                    }
                    else -> {
                        scope.launch { _messageFlow.emit(text) }
                    }
                }
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                val errorMsg = t.message ?: "Error desconocido"
                Log.e(TAG, "WS error: $errorMsg")
                
                // Emitir mensaje de error para que el ViewModel lo capture
                scope.launch { 
                    _messageFlow.emit("ERROR|CON|${errorMsg}")
                    _stateFlow.emit(ConnectionState.ERROR) 
                }

                // Reconexión automática tras 5 segundos (un poco más de margen)
                scope.launch {
                    delay(5000)
                    if (webSocket == null) { // Evitar re-conectar si ya se cerró
                        connect(tunnelUrl, idToken)
                    }
                }
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WS cerrado: $reason")
                scope.launch { _stateFlow.emit(ConnectionState.DISCONNECTED) }
            }
        })
    }

    fun disconnect() {
        webSocket?.close(1000, "Desconectado por el usuario")
        webSocket = null
        scope.launch { _stateFlow.emit(ConnectionState.DISCONNECTED) }
    }

    // ── Comandos ──────────────────────────────────────────────────────────────

    fun send(command: String) {
        webSocket?.send(command) ?: Log.w(TAG, "send() sin conexión activa")
    }

    // Mouse
    fun mouseClick(button: String = "LEFT")      = send("MOUSE_CLICK|$button")
    fun mouseDoubleClick()                        = send("MOUSE_DOUBLE_CLICK|")
    fun mouseMoveRel(dx: Float, dy: Float)        = send("MOUSE_MOVE_REL|$dx,$dy")
    fun mouseScroll(delta: Int)                   = send("MOUSE_WHEEL|$delta")

    // Teclado
    fun typeText(text: String)                    = send("TYPE_TEXT|$text")
    fun keyPress(vk: Int)                         = send("KEY_PRESS|$vk")

    // Limpieza
    fun freeRam()                                 = send("FREE_RAM|")
    fun quickClean()                              = send("QUICK_CLEAN|")
    fun cleanCache()                              = send("CLEAN_CACHE|")
    fun cleanRecycle()                            = send("CLEAN_RECYCLE|")

    // Scripts Avanzados
    fun runGameBooster()                          = send("SCRIPT_GAME_BOOSTER|")
    fun runDebloat()                              = send("SCRIPT_DEBLOAT|")
    fun runDnsOptimize()                          = send("SCRIPT_DNS|")
    fun runPrivacyOptimize()                      = send("SCRIPT_PRIVACY|")
    fun runNetworkOptimize()                      = send("SCRIPT_NETWORK|")
    fun runServiceOptimize()                      = send("SCRIPT_SERVICES|")

    // Stats
    fun getStats()                                = send("GET_STATS|")

    // Media
    fun mediaPlay()                               = send("MEDIA_PLAY|")
    fun mediaNext()                               = send("MEDIA_NEXT|")
    fun mediaPrev()                               = send("MEDIA_PREV|")
    fun mediaStop()                               = send("MEDIA_STOP|")
    fun volUp()                                   = send("VOL_UP|")
    fun volDown()                                 = send("VOL_DOWN|")
    fun volMute()                                 = send("VOL_MUTE|")

    // Sistema
    fun lockPc()                                  = send("LOCK_PC|")
    fun sleepPc()                                 = send("SLEEP_PC|")
    fun screenOff()                               = send("SCREEN_OFF|")
    fun shutdown()                                = send("SHUTDOWN|")
    fun restart()                                 = send("RESTART|")
}
