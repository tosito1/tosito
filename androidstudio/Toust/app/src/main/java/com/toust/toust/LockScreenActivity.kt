package com.toust.toust

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.MediaMetadata
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.telephony.TelephonyManager
import android.view.WindowManager
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatActivity
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.camera.camera2.Camera2Config
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.io.File

// ─────────────────────────────────────────────────────────────────
// Colores de la pantalla de bloqueo
// ─────────────────────────────────────────────────────────────────
private val LockBg          = Color(0xFF060810)
private val LockText        = Color(0xFFFFFFFF)
private val LockSubtext     = Color(0xFFB0B8CC)
private val LockGlassBtn    = Color(0x1AFFFFFF)
private val LockGlassBorder = Color(0x26FFFFFF)
private val LockPurpleGlow  = Color(0xFF5C2FD6)
private val LockBlueGlow    = Color(0xFF1A6FFF)
private val LockCyan        = Color(0xFF00CFFF)
private val LockRed         = Color(0xFFFF4D6D)
private val LockGreen       = Color(0xFF00E5A0)
private val LockAmber       = Color(0xFFFFB800)

// ─────────────────────────────────────────────────────────────────
// ACTIVITY
// ─────────────────────────────────────────────────────────────────
class LockScreenActivity : AppCompatActivity() {

    private var unlocked          = false
    private var isLaunchingCamera = false
    private var torchOn           = false
    private var camManager: CameraManager? = null
    private var torchId: String?           = null

    private var biometricPrompt: BiometricPrompt? = null
    private var promptInfo: BiometricPrompt.PromptInfo? = null

    private val secHandler   = android.os.Handler(android.os.Looper.getMainLooper())

    companion object {
        var isShowing = false
    }

    // ── onCreate ──────────────────────────────────────────────────

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON   or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            )
        }

        val km = getSystemService(Context.KEYGUARD_SERVICE) as android.app.KeyguardManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) km.requestDismissKeyguard(this, null)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() { /* bloqueado */ }
        })

        setupTorch()
        setupBiometric()
        ensureAlertChannel()

        setContent {
            LockScreenUI(
                onUnlock        = { performUnlock() },
                onShowBiometric = { biometricPrompt?.authenticate(promptInfo!!) },
                onLaunchCamera  = { launchCamera() },
                onToggleTorch   = { toggleTorch() },
                torchOn         = torchOn,
                onWrongPin      = { handleWrongPin() },
                onCorrectPin    = { performUnlock() }
            )
        }
    }

    // ── Anti-bypass ───────────────────────────────────────────────

    override fun onResume() {
        super.onResume()
        isShowing         = true
        isLaunchingCamera = false
        secHandler.removeCallbacksAndMessages(null)
        window.decorView.postDelayed({ if (!unlocked) tryBiometric() }, 500)
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        if (!unlocked && !isLaunchingCamera && !isCallActive()) relaunch()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (!hasFocus && !unlocked && isScreenOn() && !isCallActive() && !isLaunchingCamera) relaunch()
    }

    override fun onStop() {
        super.onStop()
        isShowing = false
        if (!unlocked && isScreenOn() && !isCallActive() && !isLaunchingCamera) relaunch()
    }

    // ── Desbloqueo ────────────────────────────────────────────────

    private fun performUnlock() {
        if (unlocked) return
        unlocked = true
        LockPrefs.resetFails(this)
        LockPrefs.logAttempt(this, true)
        PinChangerService.isLocked = false
        if (torchOn) toggleTorch()   // apaga linterna al salir
        finish()
    }

    private fun handleWrongPin() {
        val fails = LockPrefs.registerFail(this)
        LockPrefs.logAttempt(this, false)
        if (LockPrefs.prefs(this).getBoolean(LockPrefs.ALERT_ON_FAIL, true)) sendAlertNotification(fails)
        if (LockPrefs.prefs(this).getBoolean(LockPrefs.INTRUDER_PHOTO, false)) captureIntruderPhoto()
    }

    // ── Biometría ─────────────────────────────────────────────────

    private fun setupBiometric() {
        biometricPrompt = BiometricPrompt(this, ContextCompat.getMainExecutor(this),
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(r: BiometricPrompt.AuthenticationResult) {
                    performUnlock()
                }
            })
        promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Desbloquear pantalla")
            .setSubtitle("Usa tu huella dactilar")
            .setNegativeButtonText("Usar PIN")
            .setAllowedAuthenticators(
                BiometricManager.Authenticators.BIOMETRIC_STRONG or
                BiometricManager.Authenticators.BIOMETRIC_WEAK
            ).build()
    }

    private fun tryBiometric() {
        val p = LockPrefs.prefs(this)
        if (!p.getBoolean(LockPrefs.BIOMETRIC_ENABLED, false)) return
        val ok = BiometricManager.from(this).canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.BIOMETRIC_WEAK
        ) == BiometricManager.BIOMETRIC_SUCCESS
        if (ok) biometricPrompt?.authenticate(promptInfo!!)
    }

    // ── Linterna ──────────────────────────────────────────────────

    private fun setupTorch() {
        camManager = getSystemService(CAMERA_SERVICE) as CameraManager
        torchId = camManager?.cameraIdList?.firstOrNull { id ->
            camManager!!.getCameraCharacteristics(id)
                .get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
        }
    }

    private fun toggleTorch() {
        torchId?.let { id ->
            torchOn = !torchOn
            try { camManager?.setTorchMode(id, torchOn) } catch (_: Exception) {}
        }
    }

    // ── Cámara ────────────────────────────────────────────────────

    private fun launchCamera() {
        isLaunchingCamera = true
        val flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
        try {
            startActivity(Intent(MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA_SECURE).addFlags(flags))
        } catch (_: Exception) {
            try { startActivity(Intent(MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA).addFlags(flags)) }
            catch (_: Exception) { isLaunchingCamera = false }
        }
    }

    // ── Foto intruso ──────────────────────────────────────────────

    private fun captureIntruderPhoto() {
        if (checkSelfPermission(Manifest.permission.CAMERA) != android.content.pm.PackageManager.PERMISSION_GRANTED) return
        try {
            val future = ProcessCameraProvider.getInstance(this)
            future.addListener({
                try {
                    val provider = future.get()
                    val capture  = ImageCapture.Builder()
                        .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY).build()
                    val selector = CameraSelector.Builder()
                        .requireLensFacing(CameraSelector.LENS_FACING_FRONT).build()
                    provider.unbindAll()
                    provider.bindToLifecycle(this, selector, capture)
                    val file = File(filesDir, "intruder_${System.currentTimeMillis()}.jpg")
                    capture.takePicture(
                        ImageCapture.OutputFileOptions.Builder(file).build(),
                        ContextCompat.getMainExecutor(this),
                        object : ImageCapture.OnImageSavedCallback {
                            override fun onImageSaved(r: ImageCapture.OutputFileResults) { provider.unbindAll() }
                            override fun onError(e: ImageCaptureException) { provider.unbindAll() }
                        }
                    )
                } catch (_: Exception) {}
            }, ContextCompat.getMainExecutor(this))
        } catch (_: Exception) {}
    }

    // ── Notificación de alerta ────────────────────────────────────

    private fun ensureAlertChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(
                NotificationChannel("security_alerts", "Alertas de seguridad",
                    NotificationManager.IMPORTANCE_HIGH).apply {
                    description = "Intentos fallidos de desbloqueo"
                }
            )
        }
    }

    private fun sendAlertNotification(fails: Int) {
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        val notif = androidx.core.app.NotificationCompat.Builder(this, "security_alerts")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("⚠️ Intento fallido #$fails")
            .setContentText("A las ${timeStr()} – ${dateStr()}")
            .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true).build()
        nm.notify(9000 + fails, notif)
    }

    // ── Helpers ───────────────────────────────────────────────────

    private fun isScreenOn(): Boolean {
        val pm = getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
        return pm.isInteractive
    }

    private fun isCallActive(): Boolean = try {
        val tm = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        tm.callState != TelephonyManager.CALL_STATE_IDLE
    } catch (_: SecurityException) { false }

    private fun relaunch() {
        startActivity(Intent(this, LockScreenActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
        })
    }
}

// ─────────────────────────────────────────────────────────────────
// UI PRINCIPAL
// ─────────────────────────────────────────────────────────────────

@Composable
fun LockScreenUI(
    onUnlock:        () -> Unit,
    onShowBiometric: () -> Unit,
    onLaunchCamera:  () -> Unit,
    onToggleTorch:   () -> Unit,
    torchOn:         Boolean,
    onWrongPin:      () -> Unit,
    onCorrectPin:    () -> Unit,
) {
    val context = LocalContext.current

    // ── Fase: false=idle/reloj, true=keypad ───────────────────────
    var showKeypad by remember { mutableStateOf(false) }

    // ── PIN entry ─────────────────────────────────────────────────
    var enteredPin by remember { mutableStateOf("") }
    var wrongFlash by remember { mutableStateOf(false) }
    var wrongCount by remember { mutableIntStateOf(0) }

    // ── Tiempo en vivo ────────────────────────────────────────────
    var time by remember { mutableStateOf(timeStr()) }
    var pin  by remember { mutableStateOf(pinStr())  }
    var date by remember { mutableStateOf(dateStr()) }
    LaunchedEffect(Unit) {
        while (true) { delay(1000L); time = timeStr(); pin = pinStr(); date = dateStr() }
    }

    // ── Bloqueo temporal ──────────────────────────────────────────
    var lockoutRemaining by remember { mutableLongStateOf(LockPrefs.lockoutRemainingMs(context)) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(500L)
            lockoutRemaining = LockPrefs.lockoutRemainingMs(context)
        }
    }
    val isLockedOut = lockoutRemaining > 0L

    // ── Biometría disponible ──────────────────────────────────────
    val biometricEnabled = remember {
        LockPrefs.prefs(context).getBoolean(LockPrefs.BIOMETRIC_ENABLED, false)
    }
    val biometricAvailable = remember {
        BiometricManager.from(context).canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG or
            BiometricManager.Authenticators.BIOMETRIC_WEAK
        ) == BiometricManager.BIOMETRIC_SUCCESS
    }
    val showBiometricBtn = biometricEnabled && biometricAvailable

    // ── Wallpaper ─────────────────────────────────────────────────
    val wallpaper by produceState<Bitmap?>(null) {
        value = withContext(Dispatchers.IO) {
            val f = File(context.filesDir, "wallpaper.jpg")
            if (f.exists()) runCatching { BitmapFactory.decodeFile(f.absolutePath) }.getOrNull() else null
        }
    }

    // ── Animación sacudida ────────────────────────────────────────
    val shakeAnim = remember { Animatable(0f) }

    // ── Validar PIN ───────────────────────────────────────────────
    LaunchedEffect(enteredPin) {
        if (enteredPin.length == 4) {
            if (LockPrefs.isValidPin(context, enteredPin)) {
                delay(150L)
                onCorrectPin()
            } else {
                wrongCount++
                onWrongPin()
                shakeAnim.animateTo(0f, keyframes {
                    durationMillis = 420
                    0f at 0; -24f at 55; 24f at 110; -18f at 170
                    18f at 225; -12f at 295; 12f at 350; 0f at 420
                })
                wrongFlash = true; delay(300L); wrongFlash = false
                enteredPin = ""
            }
        }
    }

    val flashBg = if (wrongFlash) LockRed.copy(alpha = 0.14f) else Color.Transparent

    // ── Gesto deslizar arriba/abajo ───────────────────────────────
    val gestureModifier = Modifier.pointerInput(showKeypad) {
        detectVerticalDragGestures { _, delta ->
            if (!showKeypad && delta < -60f) showKeypad = true
            if (showKeypad && delta > 80f)  showKeypad = false
        }
    }

    Box(Modifier.fillMaxSize().then(gestureModifier)) {
        LockBackground(wallpaper)

        // Flash de error
        Box(Modifier.fillMaxSize().background(flashBg))

        // Contenido animado según fase
        AnimatedContent(
            targetState = showKeypad,
            transitionSpec = {
                if (targetState) {
                    slideInVertically { it } + fadeIn() togetherWith
                    slideOutVertically { -it / 3 } + fadeOut()
                } else {
                    slideInVertically { -it / 3 } + fadeIn() togetherWith
                    slideOutVertically { it } + fadeOut()
                }
            },
            label = "phase"
        ) { keypadVisible ->
            if (!keypadVisible) {
                IdleContent(time, date, onSwipeUp = { showKeypad = true })
            } else {
                PinContent(
                    time          = time,
                    enteredPin    = enteredPin,
                    shakeOffset   = shakeAnim.value,
                    wrongFlash    = wrongFlash,
                    wrongCount    = wrongCount,
                    isLockedOut   = isLockedOut,
                    lockoutMs     = lockoutRemaining,
                    showBiometric = showBiometricBtn,
                    onDigit       = { d -> if (!isLockedOut && enteredPin.length < 4) enteredPin += d },
                    onBackspace   = { if (enteredPin.isNotEmpty()) enteredPin = enteredPin.dropLast(1) },
                    onBiometric   = onShowBiometric
                )
            }
        }

        // Botones inferiores siempre visibles
        BottomActionBar(
            modifier    = Modifier.align(Alignment.BottomCenter),
            torchOn     = torchOn,
            onTorch     = onToggleTorch,
            onCamera    = onLaunchCamera
        )
    }
}

// ─────────────────────────────────────────────────────────────────
// PANTALLA IDLE (reloj + notificaciones + hint deslizar)
// ─────────────────────────────────────────────────────────────────

@Composable
fun IdleContent(time: String, date: String, onSwipeUp: () -> Unit) {
    val context = LocalContext.current

    // Notificaciones
    val notifs = remember {
        if (LockNotificationService.connected &&
            LockPrefs.prefs(context).getBoolean(LockPrefs.SHOW_NOTIFS, true)) {
            LockNotificationService.sbnList
                .filter { it.packageName != context.packageName }
                .take(4)
        } else emptyList()
    }

    // Media
    val mediaTitle  = remember { mutableStateOf<String?>(null) }
    val mediaArtist = remember { mutableStateOf<String?>(null) }
    val mediaPlaying = remember { mutableStateOf(false) }
    var mediaController by remember { mutableStateOf<android.media.session.MediaController?>(null) }

    if (LockNotificationService.connected &&
        LockPrefs.prefs(context).getBoolean(LockPrefs.SHOW_MEDIA, true)) {
        LaunchedEffect(Unit) {
            while (true) {
                try {
                    val mm = context.getSystemService(Context.MEDIA_SESSION_SERVICE) as MediaSessionManager
                    val ctrl = mm.getActiveSessions(
                        ComponentName(context, LockNotificationService::class.java)
                    ).firstOrNull()
                    mediaController      = ctrl
                    mediaTitle.value     = ctrl?.metadata?.getString(MediaMetadata.METADATA_KEY_TITLE)
                    mediaArtist.value    = ctrl?.metadata?.getString(MediaMetadata.METADATA_KEY_ARTIST)
                    mediaPlaying.value   = ctrl?.playbackState?.state == PlaybackState.STATE_PLAYING
                } catch (_: Exception) {}
                delay(2000L)
            }
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(top = 56.dp, bottom = 110.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        LockIconBadge()
        Spacer(Modifier.height(16.dp))
        ClockSection(time, date)
        Spacer(Modifier.weight(1f))

        // Notificaciones
        if (notifs.isNotEmpty()) {
            Column(
                Modifier.fillMaxWidth().padding(horizontal = 24.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                notifs.forEach { sbn ->
                    val extras   = sbn.notification?.extras
                    val title    = extras?.getCharSequence("android.title")?.toString()
                    val text     = extras?.getCharSequence("android.text")?.toString()
                    val pm       = context.packageManager
                    val appLabel = runCatching {
                        pm.getApplicationLabel(pm.getApplicationInfo(sbn.packageName, 0)).toString()
                    }.getOrDefault(sbn.packageName)

                    Row(
                        Modifier.fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(Color(0x33FFFFFF))
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(appLabel, fontSize = 10.sp, color = LockSubtext, letterSpacing = 0.5.sp)
                            if (title != null)
                                Text(title, fontSize = 13.sp, color = LockText, fontWeight = FontWeight.Medium,
                                    maxLines = 1)
                            if (text != null)
                                Text(text, fontSize = 11.sp, color = LockSubtext, maxLines = 1)
                        }
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
        }

        // Media controls
        if (mediaTitle.value != null) {
            Box(
                Modifier.fillMaxWidth().padding(horizontal = 24.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(Color(0x33000000))
                    .border(0.6.dp, LockGlassBorder, RoundedCornerShape(18.dp))
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Column {
                    mediaTitle.value?.let { Text(it, fontSize = 14.sp, color = LockText, fontWeight = FontWeight.Medium, maxLines = 1) }
                    mediaArtist.value?.let { Text(it, fontSize = 11.sp, color = LockSubtext, maxLines = 1) }
                    Spacer(Modifier.height(8.dp))
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        val ctrl = mediaController
                        listOf("⏮" to { ctrl?.transportControls?.skipToPrevious() },
                               (if (mediaPlaying.value) "⏸" else "▶") to {
                                   if (mediaPlaying.value) ctrl?.transportControls?.pause()
                                   else ctrl?.transportControls?.play()
                               },
                               "⏭" to { ctrl?.transportControls?.skipToNext() }
                        ).forEach { (label, action) ->
                            Box(
                                Modifier.size(44.dp).clip(CircleShape)
                                    .background(LockGlassBtn)
                                    .clickable { action() },
                                contentAlignment = Alignment.Center
                            ) { Text(label, fontSize = 18.sp) }
                        }
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
        }

        // Hint deslizar arriba
        val alpha by rememberInfiniteTransition(label = "hint").animateFloat(
            0.4f, 0.9f, infiniteRepeatable(tween(1200), RepeatMode.Reverse), label = "a"
        )
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.clickable(indication = null,
                interactionSource = remember { MutableInteractionSource() }) { onSwipeUp() }
        ) {
            Text("︿", fontSize = 22.sp, color = LockSubtext.copy(alpha = alpha))
            Text("Desliza para desbloquear", fontSize = 12.sp,
                color = LockSubtext.copy(alpha = alpha * 0.85f))
        }
        Spacer(Modifier.height(4.dp))
    }
}

// ─────────────────────────────────────────────────────────────────
// PANTALLA PIN
// ─────────────────────────────────────────────────────────────────

@Composable
fun PinContent(
    time:          String,
    enteredPin:    String,
    shakeOffset:   Float,
    wrongFlash:    Boolean,
    wrongCount:    Int,
    isLockedOut:   Boolean,
    lockoutMs:     Long,
    showBiometric: Boolean,
    onDigit:       (String) -> Unit,
    onBackspace:   () -> Unit,
    onBiometric:   () -> Unit,
) {
    Column(
        Modifier.fillMaxSize().padding(top = 40.dp, bottom = 110.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Hora compacta
        Text(time, fontSize = 52.sp, fontWeight = FontWeight.Light, color = LockText,
            letterSpacing = (-1).sp)

        Spacer(Modifier.height(8.dp))

        // Separador
        Box(
            Modifier.padding(horizontal = 40.dp).fillMaxWidth().height(0.6.dp)
                .background(Brush.horizontalGradient(
                    listOf(Color.Transparent, LockGlassBorder, LockGlassBorder, Color.Transparent)
                ))
        )

        Spacer(Modifier.height(20.dp))
        Text("Introduce tu PIN", fontSize = 15.sp, color = LockSubtext)
        Spacer(Modifier.height(20.dp))

        // Dots
        Row(horizontalArrangement = Arrangement.spacedBy(22.dp),
            modifier = Modifier.offset(x = shakeOffset.dp)) {
            repeat(4) { i ->
                val filled = i < enteredPin.length
                val dotColor = if (wrongFlash && filled) LockRed
                               else if (filled) LockText
                               else Color.Transparent
                Box(
                    Modifier.size(if (filled) 14.dp else 12.dp).clip(CircleShape)
                        .border(if (filled) 0.dp else 1.2.dp, LockText.copy(0.30f), CircleShape)
                        .background(dotColor)
                )
            }
        }

        // Contador de fallos
        if (wrongCount > 0 && !isLockedOut) {
            Spacer(Modifier.height(10.dp))
            Text(
                if (wrongCount == 1) "PIN incorrecto"
                else "PIN incorrecto · $wrongCount intentos",
                fontSize = 12.sp, color = LockRed.copy(0.80f)
            )
        }

        Spacer(Modifier.weight(1f))

        if (isLockedOut) {
            // Pantalla de bloqueo temporal
            Box(
                Modifier.fillMaxWidth().padding(horizontal = 24.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(LockRed.copy(0.12f))
                    .border(1.dp, LockRed.copy(0.3f), RoundedCornerShape(20.dp))
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("🔒", fontSize = 32.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("Dispositivo bloqueado", fontSize = 16.sp, color = LockRed,
                        fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                    val secs = (lockoutMs / 1000L) + 1
                    Text("Vuelve a intentarlo en $secs s", fontSize = 13.sp, color = LockSubtext)
                }
            }
            Spacer(Modifier.height(24.dp))
        } else {
            // Teclado numérico
            LockNumPad(onDigit = onDigit, onBackspace = onBackspace)

            // Botón huella
            if (showBiometric) {
                Spacer(Modifier.height(18.dp))
                Box(
                    Modifier.size(62.dp).clip(CircleShape)
                        .background(LockGlassBtn)
                        .border(0.8.dp, LockGlassBorder, CircleShape)
                        .clickable { onBiometric() },
                    contentAlignment = Alignment.Center
                ) { Text("👆", fontSize = 28.sp) }
                Spacer(Modifier.height(6.dp))
                Text("Huella dactilar", fontSize = 11.sp, color = LockSubtext.copy(0.70f))
            }
            Spacer(Modifier.height(12.dp))
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// BARRA DE ACCIONES INFERIOR (linterna + cámara)
// ─────────────────────────────────────────────────────────────────

@Composable
fun BottomActionBar(modifier: Modifier = Modifier, torchOn: Boolean, onTorch: () -> Unit, onCamera: () -> Unit) {
    Row(
        modifier = modifier.fillMaxWidth().padding(horizontal = 28.dp, vertical = 32.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        // Linterna (izquierda)
        Box(
            Modifier.size(60.dp).clip(CircleShape)
                .background(if (torchOn) LockAmber.copy(0.30f) else LockGlassBtn)
                .border(if (torchOn) 1.dp else 0.8.dp,
                    if (torchOn) LockAmber else LockGlassBorder, CircleShape)
                .clickable { onTorch() },
            contentAlignment = Alignment.Center
        ) { Text(if (torchOn) "🔦" else "🔦", fontSize = 24.sp) }

        // Cámara (derecha)
        Box(
            Modifier.size(60.dp).clip(CircleShape)
                .background(LockGlassBtn)
                .border(0.8.dp, LockGlassBorder, CircleShape)
                .clickable { onCamera() },
            contentAlignment = Alignment.Center
        ) { Text("📷", fontSize = 24.sp) }
    }
}

// ─────────────────────────────────────────────────────────────────
// COMPONENTES REUTILIZABLES
// ─────────────────────────────────────────────────────────────────

@Composable
fun LockBackground(wallpaper: Bitmap?) {
    val inf = rememberInfiniteTransition(label = "bg")
    val glow by inf.animateFloat(0.40f, 0.72f,
        infiniteRepeatable(tween(3500, easing = EaseInOutSine), RepeatMode.Reverse), "glow")
    val shift by inf.animateFloat(0f, 1f,
        infiniteRepeatable(tween(8000, easing = LinearEasing), RepeatMode.Reverse), "shift")

    Box(Modifier.fillMaxSize()) {
        if (wallpaper != null) {
            androidx.compose.foundation.Image(
                painter = BitmapPainter(remember(wallpaper) { wallpaper.asImageBitmap() }),
                contentDescription = null,
                modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop
            )
            Box(Modifier.fillMaxSize().background(
                Brush.verticalGradient(listOf(
                    Color.Black.copy(0.55f), Color.Black.copy(0.30f), Color.Black.copy(0.65f)
                ))
            ))
            Canvas(Modifier.fillMaxSize()) {
                drawGlowCircle(Offset(size.width * (0.5f + shift * 0.08f), size.height * 0.28f),
                    size.width * 0.80f, LockPurpleGlow, glow * 0.35f)
            }
        } else {
            Canvas(Modifier.fillMaxSize()) {
                drawRect(LockBg)
                drawGlowCircle(Offset(size.width * (0.45f + shift * 0.10f), size.height * 0.30f),
                    size.width * 0.90f, LockPurpleGlow, glow * 0.55f)
                drawGlowCircle(Offset(size.width * (0.55f - shift * 0.10f), size.height * 0.72f),
                    size.width * 0.70f, LockBlueGlow, glow * 0.35f)
                drawGlowCircle(Offset(size.width * 0.85f, size.height * 0.14f),
                    size.width * 0.38f, LockCyan, 0.12f)
            }
        }
    }
}

private fun DrawScope.drawGlowCircle(center: Offset, radius: Float, color: Color, alpha: Float) {
    drawCircle(
        brush  = Brush.radialGradient(listOf(color.copy(alpha), Color.Transparent),
            center = center, radius = radius),
        radius = radius, center = center
    )
}

@Composable
fun LockIconBadge() {
    val inf = rememberInfiniteTransition(label = "li")
    val a by inf.animateFloat(0.55f, 1f, infiniteRepeatable(tween(2000), RepeatMode.Reverse), "la")
    Box(
        Modifier.size(44.dp).clip(CircleShape).background(LockGlassBtn)
            .border(0.8.dp, LockGlassBorder, CircleShape),
        contentAlignment = Alignment.Center
    ) { Text("🔒", fontSize = 20.sp, color = LockText.copy(alpha = a)) }
}

@Composable
fun ClockSection(time: String, date: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(time, fontSize = 88.sp, fontWeight = FontWeight.Light, color = LockText,
            letterSpacing = (-2).sp, lineHeight = 88.sp)
        Spacer(Modifier.height(4.dp))
        Text(date, fontSize = 16.sp, fontWeight = FontWeight.Normal, color = LockSubtext)
    }
}

@Composable
fun LockNumPad(onDigit: (String) -> Unit, onBackspace: () -> Unit) {
    val rows = listOf(
        listOf("1" to null,    "2" to "ABC",  "3" to "DEF"),
        listOf("4" to "GHI",   "5" to "JKL",  "6" to "MNO"),
        listOf("7" to "PQRS",  "8" to "TUV",  "9" to "WXYZ"),
        listOf("" to null,     "0" to "+",    "⌫" to null),
    )
    Column(verticalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier.padding(horizontal = 24.dp)) {
        rows.forEach { row ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                row.forEach { (key, sub) ->
                    when {
                        key.isEmpty() -> Box(Modifier.size(80.dp))
                        key == "⌫"   -> LockKeyBackspace(onBackspace)
                        else         -> LockKeyDigit(key, sub) { onDigit(key) }
                    }
                }
            }
        }
    }
}

@Composable
fun LockKeyDigit(digit: String, subLabel: String?, onClick: () -> Unit) {
    val src     = remember { MutableInteractionSource() }
    val pressed by src.collectIsPressedAsState()
    Box(
        Modifier.size(80.dp).clip(CircleShape)
            .background(if (pressed) LockText.copy(0.22f) else LockGlassBtn)
            .border(0.7.dp, LockGlassBorder, CircleShape)
            .clickable(src, ripple(bounded = true, color = LockText), onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(digit, fontSize = 28.sp, fontWeight = FontWeight.Normal,
                color = LockText, lineHeight = 28.sp)
            if (subLabel != null)
                Text(subLabel, fontSize = 8.sp, fontWeight = FontWeight.Medium,
                    color = LockSubtext, letterSpacing = 1.5.sp, lineHeight = 8.sp)
        }
    }
}

@Composable
fun LockKeyBackspace(onClick: () -> Unit) {
    val src     = remember { MutableInteractionSource() }
    val pressed by src.collectIsPressedAsState()
    Box(
        Modifier.size(80.dp).clip(CircleShape)
            .background(if (pressed) LockRed.copy(0.25f) else Color.Transparent)
            .clickable(src, ripple(bounded = true, color = LockRed), onClick = onClick),
        contentAlignment = Alignment.Center
    ) { Text("⌫", fontSize = 26.sp, color = LockSubtext, fontWeight = FontWeight.Light) }
}
