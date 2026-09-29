package com.toust.tosito.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Scale
import androidx.compose.material.icons.filled.Savings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.google.firebase.auth.FirebaseAuth
import com.toust.tosito.ui.viewmodel.SettingsViewModel

private val HBg       = Color(0xFF080C14)
private val HBg2      = Color(0xFF0F1520)
private val HCard     = Color(0xFF141C2A)
private val HText     = Color(0xFFEDF2FF)
private val HMuted    = Color(0xFF6B7FA3)
private val BrandColor = Color(0xFF6366F1)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(onLogout: () -> Unit, onNavigateAnalytics: () -> Unit) {
    val settingsVm: SettingsViewModel = viewModel()
    val user = FirebaseAuth.getInstance().currentUser
    val userName = user?.email?.substringBefore("@")?.replaceFirstChar { it.uppercase() } ?: "Usuario"

    val morningHour by settingsVm.morningAlertHour.collectAsState()
    val morningMin by settingsVm.morningAlertMinute.collectAsState()
    val calOffset by settingsVm.calendarAlertOffset.collectAsState()
    val budgetLimit by settingsVm.budgetLimit.collectAsState()
    val weight by settingsVm.bodyWeight.collectAsState()

    var showBudgetDialog by remember { mutableStateOf(false) }
    var showWeightDialog by remember { mutableStateOf(false) }
    var showTimeDialog by remember { mutableStateOf(false) }
    var showOffsetDialog by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(HBg, HBg2)))) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(bottom = 120.dp)
        ) {
            // Header
            Column(
                modifier = Modifier.fillMaxWidth().padding(top = 48.dp, bottom = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .clip(CircleShape)
                        .background(Brush.linearGradient(listOf(BrandColor, Color(0xFF9B59B6)))),
                    contentAlignment = Alignment.Center
                ) {
                    Text(userName.take(1).uppercase(), style = MaterialTheme.typography.displayMedium.copy(color = Color.White, fontWeight = FontWeight.ExtraBold))
                }
                Spacer(modifier = Modifier.height(16.dp))
                Text(userName, style = MaterialTheme.typography.headlineMedium.copy(color = HText, fontWeight = FontWeight.Bold))
                Text(user?.email ?: "", style = MaterialTheme.typography.bodyMedium.copy(color = HMuted))
            }

            // Analítica
            ProfileSectionTitle("Analítica y Progreso")
            SettingsItem(
                icon = Icons.Default.FitnessCenter,
                iconTint = BrandColor,
                title = "Resumen Semanal",
                subtitle = "Tus rachas y progreso de los últimos 7 días",
                onClick = onNavigateAnalytics
            )
            
            // Notificaciones
            ProfileSectionTitle("Notificaciones")
            SettingsItem(
                icon = Icons.Default.Notifications,
                iconTint = Color(0xFFEAB308),
                title = "Aviso matutino",
                subtitle = "Resumen del día a las %02d:%02d".format(morningHour, morningMin),
                onClick = { showTimeDialog = true }
            )
            SettingsItem(
                icon = Icons.Default.Notifications,
                iconTint = Color(0xFF8B5CF6),
                title = "Eventos del calendario",
                subtitle = "Avisar $calOffset minutos antes",
                onClick = { showOffsetDialog = true }
            )

            Spacer(modifier = Modifier.height(16.dp))
            ProfileSectionTitle("Salud y Finanzas")
            SettingsItem(
                icon = Icons.Default.Savings,
                iconTint = Color(0xFF10B981),
                title = "Presupuesto Mensual",
                subtitle = "%.0f€ límite".format(budgetLimit),
                onClick = { showBudgetDialog = true }
            )
            SettingsItem(
                icon = Icons.Default.Scale,
                iconTint = Color(0xFFEF4444),
                title = "Peso Corporal",
                subtitle = "%.1f kg".format(weight),
                onClick = { showWeightDialog = true }
            )

            Spacer(modifier = Modifier.height(16.dp))
            ProfileSectionTitle("Cuenta")
            SettingsItem(
                icon = Icons.Default.Logout,
                iconTint = Color(0xFFEF4444),
                title = "Cerrar sesión",
                subtitle = "Salir de tu cuenta en este dispositivo",
                onClick = {
                    FirebaseAuth.getInstance().signOut()
                    onLogout()
                }
            )
        }
    }

    if (showBudgetDialog) {
        var limitInput by remember { mutableStateOf(budgetLimit.toString()) }
        AlertDialog(
            onDismissRequest = { showBudgetDialog = false },
            title = { Text("Presupuesto") },
            text = {
                OutlinedTextField(
                    value = limitInput,
                    onValueChange = { limitInput = it },
                    label = { Text("Límite mensual (€)") }
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    limitInput.toFloatOrNull()?.let { settingsVm.updateBudgetLimit(it) }
                    showBudgetDialog = false
                }) { Text("Guardar") }
            }
        )
    }

    if (showWeightDialog) {
        var weightInput by remember { mutableStateOf(weight.toString()) }
        AlertDialog(
            onDismissRequest = { showWeightDialog = false },
            title = { Text("Peso") },
            text = {
                OutlinedTextField(
                    value = weightInput,
                    onValueChange = { weightInput = it },
                    label = { Text("Peso actual (kg)") }
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    weightInput.toFloatOrNull()?.let { settingsVm.updateBodyWeight(it) }
                    showWeightDialog = false
                }) { Text("Guardar") }
            }
        )
    }

    if (showOffsetDialog) {
        var offsetInput by remember { mutableStateOf(calOffset.toString()) }
        AlertDialog(
            onDismissRequest = { showOffsetDialog = false },
            title = { Text("Alerta Calendario") },
            text = {
                OutlinedTextField(
                    value = offsetInput,
                    onValueChange = { offsetInput = it },
                    label = { Text("Minutos de antelación") }
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    offsetInput.toIntOrNull()?.let { settingsVm.updateCalendarAlertOffset(it) }
                    showOffsetDialog = false
                }) { Text("Guardar") }
            }
        )
    }

    // A simple time picker dialogue replacement for brevity. 
    // Usually we would use TimePicker, but sticking to basic dialog for reliability without external libraries.
    if (showTimeDialog) {
        var hInput by remember { mutableStateOf(morningHour.toString()) }
        var mInput by remember { mutableStateOf(morningMin.toString()) }
        AlertDialog(
            onDismissRequest = { showTimeDialog = false },
            title = { Text("Aviso Matutino") },
            text = {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = hInput, onValueChange = { hInput = it }, label = { Text("Hora") }, modifier = Modifier.weight(1f))
                    OutlinedTextField(value = mInput, onValueChange = { mInput = it }, label = { Text("Min") }, modifier = Modifier.weight(1f))
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    val h = hInput.toIntOrNull() ?: 8
                    val m = mInput.toIntOrNull() ?: 0
                    settingsVm.updateMorningAlertTime(h, m)
                    showTimeDialog = false
                }) { Text("Guardar") }
            }
        )
    }
}

@Composable
private fun ProfileSectionTitle(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleSmall.copy(color = BrandColor, fontWeight = FontWeight.Bold),
        modifier = Modifier.padding(start = 24.dp, top = 16.dp, bottom = 8.dp)
    )
}

@Composable
private fun SettingsItem(icon: ImageVector, iconTint: Color, title: String, subtitle: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 24.dp, vertical = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier.size(40.dp).clip(RoundedCornerShape(12.dp)).background(iconTint.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(24.dp))
        }
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.bodyLarge.copy(color = HText, fontWeight = FontWeight.Medium))
            Text(subtitle, style = MaterialTheme.typography.bodySmall.copy(color = HMuted))
        }
        Icon(Icons.Default.ChevronRight, contentDescription = null, tint = HMuted)
    }
}
