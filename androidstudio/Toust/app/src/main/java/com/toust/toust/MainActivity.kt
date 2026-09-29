package com.toust.toust

import android.Manifest
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.biometric.BiometricManager
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import com.toust.toust.launcher.IOSHomeScreen

// ─────────────────────────────────────────────────────────────────
// Colores del tema
// ─────────────────────────────────────────────────────────────────
val DarkBg   = Color(0xFF0D0F1A)
val DarkCard = Color(0xFF141726)
val DarkChip = Color(0xFF1C2035)
val TextPri  = Color(0xFFE8EAF6)
val TextSec  = Color(0xFF7B83A6)
val Blue     = Color(0xFF1A6FFF)
val Purple   = Color(0xFF6C3FFF)
val Green    = Color(0xFF00C97A)
val Red      = Color(0xFFFF3B5C)
val Amber    = Color(0xFFFFAA00)

// ─────────────────────────────────────────────────────────────────
// ACTIVITY
// ─────────────────────────────────────────────────────────────────
class MainActivity : ComponentActivity() {

    private lateinit var dpm: DevicePolicyManager
    private lateinit var adminComp: ComponentName

    private val adminLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()) {}

    private val notifPermLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()) {}

    private val phonePermLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()) {}

    private val cameraPermLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()) {}

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        dpm       = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        adminComp = ComponentName(this, ScreenLockAdminReceiver::class.java)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU)
            notifPermLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        phonePermLauncher.launch(Manifest.permission.READ_PHONE_STATE)
        cameraPermLauncher.launch(Manifest.permission.CAMERA)

        // Back button: desde el launcher no hace nada (comportamiento correcto)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() { /* sin acción desde el launcher */ }
        })

        setContent {
            var showSettings by remember { mutableStateOf(false) }

            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary      = Blue,
                    background   = DarkBg,
                    surface      = DarkCard,
                    onBackground = TextPri,
                    onSurface    = TextPri,
                )
            ) {
                if (showSettings) {
                    // ── Pantalla de ajustes ──────────────────────
                    SettingsApp(
                        dpm             = dpm,
                        adminComp       = adminComp,
                        onActivateAdmin = ::activateAdmin,
                        onStartService  = { PinChangerService.startService(this) },
                        onStopService   = { PinChangerService.stopService(this) },
                        onBack          = { showSettings = false }
                    )
                } else {
                    // ── Home iOS Launcher ────────────────────────
                    IOSHomeScreen(onOpenSettings = { showSettings = true })
                }
            }
        }
    }

    private fun activateAdmin() {
        val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
            putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComp)
            putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                "Necesario para gestionar el bloqueo de pantalla")
        }
        adminLauncher.launch(intent)
    }
}

// ─────────────────────────────────────────────────────────────────
// APP PRINCIPAL
// ─────────────────────────────────────────────────────────────────

@Composable
fun SettingsApp(
    dpm: DevicePolicyManager,
    adminComp: ComponentName,
    onActivateAdmin: () -> Unit,
    onStartService: () -> Unit,
    onStopService: () -> Unit,
    onBack: (() -> Unit)? = null,
) {
    val context = LocalContext.current

    // Índice de tab activa
    var tab by remember { mutableIntStateOf(0) }
    val tabs = listOf(
        "Estado" to Icons.Default.Dashboard,
        "Seguridad" to Icons.Default.Security,
        "Pantalla" to Icons.Default.Lock,
        "Registros" to Icons.Default.History
    )

    Scaffold(
        containerColor = DarkBg,
        topBar = {
            if (onBack != null) {
                Row(
                    Modifier.fillMaxWidth().statusBarsPadding()
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Volver", tint = Blue)
                    }
                    Text("Control de Pantalla", fontSize = 17.sp,
                        fontWeight = FontWeight.SemiBold, color = TextPri)
                }
            }
        },
        bottomBar = {
            NavigationBar(containerColor = DarkCard) {
                tabs.forEachIndexed { i, (label, icon) ->
                    NavigationBarItem(
                        selected = tab == i,
                        onClick  = { tab = i },
                        icon     = { Icon(icon, null) },
                        label    = { Text(label, fontSize = 11.sp) },
                        colors   = NavigationBarItemDefaults.colors(
                            selectedIconColor   = Blue,
                            selectedTextColor   = Blue,
                            indicatorColor      = Blue.copy(0.15f),
                            unselectedIconColor = TextSec,
                            unselectedTextColor = TextSec
                        )
                    )
                }
            }
        }
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            when (tab) {
                0 -> TabStatus(dpm, adminComp, onActivateAdmin, onStartService, onStopService)
                1 -> TabSecurity()
                2 -> TabDisplay()
                3 -> TabHistory()
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// TAB ESTADO
// ─────────────────────────────────────────────────────────────────

@Composable
fun TabStatus(
    dpm: DevicePolicyManager,
    adminComp: ComponentName,
    onActivateAdmin: () -> Unit,
    onStartService: () -> Unit,
    onStopService: () -> Unit,
) {
    val context = LocalContext.current
    var tick by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) { while (true) { kotlinx.coroutines.delay(1000L); tick++ } }

    val isAdmin   = dpm.isAdminActive(adminComp)
    val isRunning = PinChangerService.isRunning
    val pin       = pinStr()
    val prefs     = remember { LockPrefs.prefs(context) }
    val vacation  = prefs.getBoolean(LockPrefs.VACATION_MODE, false)

    LazyColumn(
        Modifier.fillMaxSize().background(DarkBg),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            // Cabecera
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier.size(56.dp).clip(CircleShape)
                        .background(Brush.linearGradient(listOf(Blue, Purple))),
                    contentAlignment = Alignment.Center
                ) { Text("🔐", fontSize = 26.sp) }
                Spacer(Modifier.width(16.dp))
                Column {
                    Text("Control de Pantalla", fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold, color = TextPri)
                    Text("v2.0 – Definitivo", fontSize = 13.sp, color = TextSec)
                }
            }
        }

        // Estado del servicio
        item {
            StatusCard(
                isAdmin = isAdmin, isRunning = isRunning, pin = pin,
                vacationMode = vacation,
                onActivateAdmin = onActivateAdmin,
                onStartService  = onStartService,
                onStopService   = onStopService
            )
        }

        // Acceso a notificaciones
        item {
            val notifListenerActive = remember {
                try {
                    val flat = Settings.Secure.getString(context.contentResolver,
                        "enabled_notification_listeners") ?: ""
                    flat.contains(context.packageName)
                } catch (_: Exception) { false }
            }
            SettingCard(
                emoji = "🔔", title = "Acceso a notificaciones",
                subtitle = if (notifListenerActive) "✅ Concedido — notifs en pantalla de bloqueo activas"
                           else "⚠️ Necesario para ver notificaciones en la pantalla de bloqueo",
                chip = if (!notifListenerActive) "Activar" else null,
                chipColor = Amber,
                onChip = {
                    context.startActivity(
                        Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    )
                }
            )
        }

        // Fallos acumulados
        item {
            val fails = remember { LockPrefs.prefs(context).getInt(LockPrefs.FAIL_COUNT, 0) }
            val nextLockout = when {
                fails >= 20 -> "1 hora"
                fails >= 10 -> "5 min"
                fails >= 5  -> "30 seg"
                else        -> "tras ${5 - fails} fallos más"
            }
            SettingCard(
                emoji = "⚠️",
                title = "Intentos fallidos acumulados",
                subtitle = "$fails fallos en total · próximo bloqueo: $nextLockout"
            )
        }
    }
}

@Composable
fun StatusCard(
    isAdmin: Boolean, isRunning: Boolean, pin: String,
    vacationMode: Boolean,
    onActivateAdmin: () -> Unit, onStartService: () -> Unit, onStopService: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = DarkCard)
    ) {
        Column(Modifier.padding(20.dp)) {
            // PIN actual
            Box(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp))
                    .background(Brush.horizontalGradient(listOf(Blue.copy(0.2f), Purple.copy(0.2f))))
                    .padding(vertical = 18.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("PIN activo", fontSize = 11.sp, color = TextSec, letterSpacing = 1.sp)
                    Spacer(Modifier.height(4.dp))
                    if (vacationMode) {
                        Text("MODO VACACIONES", fontSize = 13.sp, color = Amber,
                            fontWeight = FontWeight.Bold)
                        Text(LockPrefs.prefs(LocalContext.current).getString(LockPrefs.VACATION_PIN, "????") ?: "????",
                            fontSize = 36.sp, fontWeight = FontWeight.Black, color = LockAmberTint,
                            letterSpacing = 8.sp, fontFamily = FontFamily.Monospace)
                    } else {
                        Text(pin, fontSize = 40.sp, fontWeight = FontWeight.Black, color = Color.White,
                            letterSpacing = 8.sp, fontFamily = FontFamily.Monospace)
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // Pasos
            listOf(
                Triple(isAdmin,   "Admin de dispositivo", "Necesario para bloquear"),
                Triple(isRunning, "Servicio activo",       "Detecta encendido de pantalla")
            ).forEach { (active, title, sub) ->
                Row(Modifier.padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier.size(28.dp).clip(CircleShape)
                            .background(if (active) Green.copy(0.15f) else Red.copy(0.12f)),
                        contentAlignment = Alignment.Center
                    ) { Text(if (active) "✓" else "✗", fontSize = 14.sp,
                        color = if (active) Green else Red, fontWeight = FontWeight.Bold) }
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text(title, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = TextPri)
                        Text(sub, fontSize = 11.sp, color = TextSec)
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // Botones de acción
            if (!isAdmin) {
                Button(onClick = onActivateAdmin, modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Blue)) {
                    Text("Activar admin")
                }
            } else if (!isRunning) {
                Button(onClick = onStartService, modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Green)) {
                    Text("Iniciar servicio")
                }
            } else {
                OutlinedButton(onClick = onStopService, modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Red),
                    border = BorderStroke(1.dp, Red.copy(0.5f))) {
                    Text("Detener servicio")
                }
            }
        }
    }
}

private val LockAmberTint = Color(0xFFFFB800)

// ─────────────────────────────────────────────────────────────────
// TAB SEGURIDAD
// ─────────────────────────────────────────────────────────────────

@Composable
fun TabSecurity() {
    val context  = LocalContext.current
    val prefs    = remember { LockPrefs.prefs(context) }

    // Estados
    var vacationMode    by remember { mutableStateOf(prefs.getBoolean(LockPrefs.VACATION_MODE, false)) }
    var vacationPin     by remember { mutableStateOf(prefs.getString(LockPrefs.VACATION_PIN, "") ?: "") }
    var masterEnabled   by remember { mutableStateOf(prefs.getBoolean(LockPrefs.MASTER_PIN_ENABLED, false)) }
    var masterPin       by remember { mutableStateOf(prefs.getString(LockPrefs.MASTER_PIN, "") ?: "") }
    var lockoutEnabled  by remember { mutableStateOf(prefs.getBoolean(LockPrefs.LOCKOUT_ENABLED, true)) }
    var alertOnFail     by remember { mutableStateOf(prefs.getBoolean(LockPrefs.ALERT_ON_FAIL, true)) }
    var intruderPhoto   by remember { mutableStateOf(prefs.getBoolean(LockPrefs.INTRUDER_PHOTO, false)) }

    val biometricResult = remember {
        BiometricManager.from(context).canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG or
            BiometricManager.Authenticators.BIOMETRIC_WEAK
        )
    }
    var biometricEnabled by remember { mutableStateOf(prefs.getBoolean(LockPrefs.BIOMETRIC_ENABLED, false)) }

    val cameraGranted = context.checkSelfPermission(Manifest.permission.CAMERA) ==
        PackageManager.PERMISSION_GRANTED

    LazyColumn(
        Modifier.fillMaxSize().background(DarkBg),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item { SectionHeader("🔐 Autenticación") }

        // Biometría
        item {
            val noCredential = biometricResult == 14
            val canUse = biometricResult == BiometricManager.BIOMETRIC_SUCCESS
            SwitchCard(
                emoji    = "👆",
                title    = "Huella dactilar",
                subtitle = when {
                    canUse && biometricEnabled  -> "✅ Activo — toca la huella al encender pantalla"
                    canUse                     -> "Desactivado"
                    noCredential               -> "❌ Activa un PIN del sistema para que funcione la huella"
                    else                       -> "⚠️ No disponible en este dispositivo"
                },
                checked  = biometricEnabled && canUse,
                enabled  = canUse,
                onToggle = { v -> biometricEnabled = v; prefs.edit().putBoolean(LockPrefs.BIOMETRIC_ENABLED, v).apply() }
            )
        }

        item { SectionHeader("🏖️ Modo vacaciones") }

        // Modo vacaciones
        item {
            SwitchCard(
                emoji    = "✈️",
                title    = "PIN fijo (vacaciones)",
                subtitle = if (vacationMode) "Activo — PIN: ${vacationPin.ifBlank { "sin configurar" }}"
                           else "Desactivado — PIN = hora actual",
                checked  = vacationMode,
                onToggle = { v -> vacationMode = v; prefs.edit().putBoolean(LockPrefs.VACATION_MODE, v).apply() }
            )
        }
        if (vacationMode) {
            item {
                PinInputCard(
                    label  = "PIN de vacaciones (4 dígitos)",
                    value  = vacationPin,
                    onSave = { v ->
                        vacationPin = v
                        prefs.edit().putString(LockPrefs.VACATION_PIN, v).apply()
                    }
                )
            }
        }

        item { SectionHeader("🗝️ PIN maestro de emergencia") }

        // Master PIN
        item {
            SwitchCard(
                emoji    = "🗝️",
                title    = "PIN maestro",
                subtitle = if (masterEnabled) "Activo — siempre desbloqueará el teléfono"
                           else "Desactivado",
                checked  = masterEnabled,
                onToggle = { v -> masterEnabled = v; prefs.edit().putBoolean(LockPrefs.MASTER_PIN_ENABLED, v).apply() }
            )
        }
        if (masterEnabled) {
            item {
                PinInputCard(
                    label  = "PIN maestro (4 dígitos)",
                    value  = masterPin,
                    onSave = { v ->
                        masterPin = v
                        prefs.edit().putString(LockPrefs.MASTER_PIN, v).apply()
                    }
                )
            }
        }

        item { SectionHeader("🛡️ Protección contra intrusos") }

        // Bloqueo temporal
        item {
            SwitchCard(
                emoji    = "⏱️",
                title    = "Bloqueo tras fallos",
                subtitle = "5 fallos → 30s · 10 → 5min · 20 → 1hora",
                checked  = lockoutEnabled,
                onToggle = { v -> lockoutEnabled = v; prefs.edit().putBoolean(LockPrefs.LOCKOUT_ENABLED, v).apply() }
            )
        }

        // Notificación de alerta
        item {
            SwitchCard(
                emoji    = "🚨",
                title    = "Notificación de alerta",
                subtitle = "Te avisa cuando alguien falla el PIN",
                checked  = alertOnFail,
                onToggle = { v -> alertOnFail = v; prefs.edit().putBoolean(LockPrefs.ALERT_ON_FAIL, v).apply() }
            )
        }

        // Foto intruso
        item {
            SwitchCard(
                emoji    = "📸",
                title    = "Foto del intruso",
                subtitle = if (!cameraGranted) "⚠️ Necesita permiso de cámara"
                           else if (intruderPhoto) "Activo — se guarda en Registros"
                           else "Desactivado",
                checked  = intruderPhoto && cameraGranted,
                enabled  = cameraGranted,
                onToggle = { v -> intruderPhoto = v; prefs.edit().putBoolean(LockPrefs.INTRUDER_PHOTO, v).apply() }
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// TAB PANTALLA DE BLOQUEO
// ─────────────────────────────────────────────────────────────────

@Composable
fun TabDisplay() {
    val context = LocalContext.current
    val prefs   = remember { LockPrefs.prefs(context) }

    var showNotifs by remember { mutableStateOf(prefs.getBoolean(LockPrefs.SHOW_NOTIFS, true)) }
    var showMedia  by remember { mutableStateOf(prefs.getBoolean(LockPrefs.SHOW_MEDIA, true)) }
    var wallpaperSet by remember { mutableStateOf(File(context.filesDir, "wallpaper.jpg").exists()) }

    val wallpaperLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            runCatching {
                context.contentResolver.openInputStream(it)?.use { input ->
                    File(context.filesDir, "wallpaper.jpg").outputStream().use { out -> input.copyTo(out) }
                }
                wallpaperSet = true
            }
        }
    }

    LazyColumn(
        Modifier.fillMaxSize().background(DarkBg),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item { SectionHeader("🖼️ Fondo de pantalla") }

        item {
            Card(shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = DarkCard)) {
                Column(Modifier.padding(16.dp)) {
                    if (wallpaperSet) {
                        val bmp = remember {
                            runCatching {
                                val opts = android.graphics.BitmapFactory.Options().apply { inSampleSize = 4 }
                                BitmapFactory.decodeFile(File(context.filesDir, "wallpaper.jpg").absolutePath, opts)
                            }.getOrNull()
                        }
                        bmp?.let {
                            androidx.compose.foundation.Image(
                                painter = BitmapPainter(it.asImageBitmap()),
                                contentDescription = null,
                                modifier = Modifier.fillMaxWidth().height(140.dp)
                                    .clip(RoundedCornerShape(12.dp)),
                                contentScale = ContentScale.Crop
                            )
                            Spacer(Modifier.height(10.dp))
                        }
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(onClick = { wallpaperLauncher.launch("image/*") },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Blue),
                                border = BorderStroke(1.dp, Blue.copy(0.5f))) {
                                Text("Cambiar")
                            }
                            OutlinedButton(onClick = {
                                runCatching { File(context.filesDir, "wallpaper.jpg").delete() }
                                wallpaperSet = false
                            }, modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Red),
                                border = BorderStroke(1.dp, Red.copy(0.5f))) {
                                Text("Quitar")
                            }
                        }
                    } else {
                        Button(onClick = { wallpaperLauncher.launch("image/*") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = Blue)) {
                            Icon(Icons.Default.Image, null)
                            Spacer(Modifier.width(8.dp))
                            Text("Seleccionar imagen")
                        }
                        Spacer(Modifier.height(6.dp))
                        Text("Por defecto: fondo animado con glow", fontSize = 12.sp, color = TextSec)
                    }
                }
            }
        }

        item { SectionHeader("📲 Contenido en pantalla bloqueada") }

        item {
            SwitchCard(
                emoji    = "🔔",
                title    = "Notificaciones",
                subtitle = if (showNotifs) "Activo — se muestran en la pantalla idle"
                           else "Desactivado",
                checked  = showNotifs,
                onToggle = { v -> showNotifs = v; prefs.edit().putBoolean(LockPrefs.SHOW_NOTIFS, v).apply() }
            )
        }

        item {
            SwitchCard(
                emoji    = "🎵",
                title    = "Controles de música",
                subtitle = if (showMedia) "Activo — aparecen si hay algo sonando"
                           else "Desactivado",
                checked  = showMedia,
                onToggle = { v -> showMedia = v; prefs.edit().putBoolean(LockPrefs.SHOW_MEDIA, v).apply() }
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// TAB REGISTROS
// ─────────────────────────────────────────────────────────────────

@Composable
fun TabHistory() {
    val context = LocalContext.current

    // Intentos de desbloqueo
    val entries = remember {
        val raw = LockPrefs.prefs(context).getString(LockPrefs.ATTEMPT_LOG, "") ?: ""
        raw.split("\n").filter { it.contains(":") }.mapNotNull {
            val parts = it.split(":")
            if (parts.size >= 2) parts[0].toLongOrNull()?.let { ts ->
                ts to parts[1].trim()
            } else null
        }
    }

    // Fotos de intrusos
    val photos = remember {
        context.filesDir.listFiles { f -> f.name.startsWith("intruder_") && f.name.endsWith(".jpg") }
            ?.sortedByDescending { it.lastModified() } ?: emptyList()
    }

    val sdf = remember { SimpleDateFormat("dd/MM HH:mm:ss", Locale.getDefault()) }

    LazyColumn(
        Modifier.fillMaxSize().background(DarkBg),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        if (photos.isNotEmpty()) {
            item { SectionHeader("📸 Fotos de intrusos (${photos.size})") }
            items(photos.take(10)) { file ->
                val bmp = remember(file) {
                    runCatching {
                        val opts = android.graphics.BitmapFactory.Options().apply { inSampleSize = 2 }
                        BitmapFactory.decodeFile(file.absolutePath, opts)
                    }.getOrNull()
                }
                bmp?.let {
                    Row(
                        Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                            .background(DarkCard).padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        androidx.compose.foundation.Image(
                            painter = BitmapPainter(it.asImageBitmap()),
                            contentDescription = null,
                            modifier = Modifier.size(72.dp).clip(RoundedCornerShape(8.dp)),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text("Intento de acceso", fontSize = 13.sp,
                                fontWeight = FontWeight.Medium, color = TextPri)
                            val ts = file.name.removePrefix("intruder_").removeSuffix(".jpg").toLongOrNull()
                            Text(ts?.let { sdf.format(Date(it)) } ?: file.name,
                                fontSize = 12.sp, color = TextSec)
                        }
                    }
                }
            }
        }

        item { SectionHeader("📋 Historial de intentos (${entries.size})") }

        if (entries.isEmpty()) {
            item {
                Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                    Text("Sin registros todavía", fontSize = 14.sp, color = TextSec)
                }
            }
        }

        items(entries.take(50)) { (ts, result) ->
            val isOk = result == "OK"
            Row(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp))
                    .background(if (isOk) Green.copy(0.08f) else Red.copy(0.08f))
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(if (isOk) "✅" else "❌", fontSize = 18.sp)
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(if (isOk) "Desbloqueo correcto" else "PIN incorrecto",
                        fontSize = 13.sp, fontWeight = FontWeight.Medium,
                        color = if (isOk) Green else Red)
                    Text(sdf.format(Date(ts)), fontSize = 11.sp, color = TextSec)
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// COMPONENTES REUTILIZABLES DE UI
// ─────────────────────────────────────────────────────────────────

@Composable
fun SectionHeader(text: String) {
    Text(text, fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
        color = TextSec, modifier = Modifier.padding(top = 8.dp, bottom = 2.dp))
}

@Composable
fun SwitchCard(
    emoji: String, title: String, subtitle: String,
    checked: Boolean, enabled: Boolean = true,
    onToggle: (Boolean) -> Unit
) {
    Card(shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = DarkCard)) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                Text(emoji, fontSize = 22.sp)
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(title, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = TextPri)
                    Text(subtitle, fontSize = 11.sp, color = TextSec, lineHeight = 15.sp)
                }
            }
            Switch(
                checked = checked, onCheckedChange = onToggle, enabled = enabled,
                colors = SwitchDefaults.colors(
                    checkedThumbColor   = Color.White,
                    checkedTrackColor   = Blue,
                    uncheckedTrackColor = DarkChip
                )
            )
        }
    }
}

@Composable
fun SettingCard(
    emoji: String, title: String, subtitle: String,
    chip: String? = null, chipColor: Color = Blue, onChip: (() -> Unit)? = null
) {
    Card(shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = DarkCard)) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                Text(emoji, fontSize = 22.sp)
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(title, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = TextPri)
                    Text(subtitle, fontSize = 11.sp, color = TextSec, lineHeight = 15.sp)
                }
            }
            if (chip != null && onChip != null) {
                Spacer(Modifier.width(8.dp))
                Box(
                    Modifier.clip(RoundedCornerShape(50.dp))
                        .background(chipColor.copy(0.15f))
                        .border(1.dp, chipColor.copy(0.4f), RoundedCornerShape(50.dp))
                        .clickable { onChip() }
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(chip, fontSize = 12.sp, color = chipColor, fontWeight = FontWeight.Medium)
                }
            }
        }
    }
}

@Composable
fun PinInputCard(label: String, value: String, onSave: (String) -> Unit) {
    var input by remember(value) { mutableStateOf(value) }
    var showPin by remember { mutableStateOf(false) }

    Card(shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = DarkCard)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            OutlinedTextField(
                value          = input,
                onValueChange  = { if (it.length <= 4 && it.all { c -> c.isDigit() }) input = it },
                label          = { Text(label, fontSize = 12.sp) },
                modifier       = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                visualTransformation = if (showPin) VisualTransformation.None
                                       else PasswordVisualTransformation(),
                trailingIcon   = {
                    IconButton(onClick = { showPin = !showPin }) {
                        Icon(if (showPin) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            null, tint = TextSec)
                    }
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor   = Blue,
                    unfocusedBorderColor = TextSec.copy(0.3f),
                    cursorColor          = Blue,
                    focusedTextColor     = TextPri,
                    unfocusedTextColor   = TextPri
                ),
                singleLine = true
            )
            Button(
                onClick  = { if (input.length == 4) onSave(input) },
                enabled  = input.length == 4,
                modifier = Modifier.fillMaxWidth(),
                colors   = ButtonDefaults.buttonColors(
                    containerColor = Blue,
                    disabledContainerColor = DarkChip
                )
            ) { Text("Guardar PIN") }
        }
    }
}
