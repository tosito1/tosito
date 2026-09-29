package com.toust.tosito.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.viewmodel.compose.viewModel
import com.toust.tosito.data.model.Exercise
import com.toust.tosito.data.model.MuscleGroup
import com.toust.tosito.data.model.WorkoutSession
import com.toust.tosito.ui.viewmodel.GymViewModel

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Paleta
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
private val GymBg     = Color(0xFF0D0D16)
private val GymBg2    = Color(0xFF14121F)
private val GymCard   = Color(0xFF1E1B2E)
private val GymCard2  = Color(0xFF252338)
private val GymBorder = Color(0xFF3A3558)
private val GymRed    = Color(0xFFEF4444)
private val GymOrange = Color(0xFFF97316)
private val GymAmber  = Color(0xFFF59E0B)
private val GymGreen  = Color(0xFF22C55E)
private val GymBlue   = Color(0xFF3B82F6)
private val GymPurple = Color(0xFF8B5CF6)
private val GymMuted  = Color(0xFF8B88B0)
private val GymText   = Color(0xFFE8E6FF)

private val RedGrad    = Brush.linearGradient(listOf(GymRed, GymOrange))
private val GreenGrad  = Brush.linearGradient(listOf(GymGreen, Color(0xFF4ADE80)))
private val PurpleGrad = Brush.linearGradient(listOf(GymPurple, Color(0xFFA78BFA)))
private val BgGrad     = Brush.verticalGradient(listOf(GymBg, GymBg2))

fun muscleColor(m: MuscleGroup): Color = when (m) {
    MuscleGroup.PECHO    -> GymRed
    MuscleGroup.ESPALDA  -> GymBlue
    MuscleGroup.HOMBROS  -> GymOrange
    MuscleGroup.BICEPS   -> GymPurple
    MuscleGroup.TRICEPS  -> GymAmber
    MuscleGroup.PIERNAS  -> GymGreen
    MuscleGroup.GLUTEOS  -> Color(0xFFEC4899)
    MuscleGroup.ABDOMEN  -> Color(0xFF06B6D4)
    MuscleGroup.CARDIO   -> GymRed
    MuscleGroup.FULL_BODY -> GymOrange
    MuscleGroup.OTRO     -> GymMuted
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PANTALLA PRINCIPAL
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Composable
fun GymScreen(
    userId: String = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid ?: ""
) {
    val vm: GymViewModel = viewModel()
    val activeTab       by vm.activeTab.collectAsState()
    val sessionActive   by vm.sessionActive.collectAsState()
    val showDialog      by vm.showExerciseDialog.collectAsState()
    val editingExercise by vm.editingExercise.collectAsState()
    val restActive      by vm.restTimerActive.collectAsState()
    val restSeconds     by vm.restTimerSeconds.collectAsState()

    val context = androidx.compose.ui.platform.LocalContext.current
    val vibrator = remember { context.getSystemService(android.content.Context.VIBRATOR_SERVICE) as android.os.Vibrator }
    
    androidx.compose.runtime.LaunchedEffect(restSeconds, restActive) {
        if (restActive && restSeconds == 0) {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                vibrator.vibrate(android.os.VibrationEffect.createOneShot(1000, android.os.VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(1000)
            }
            vm.skipRestTimer()
        }
    }
    val isLoading       by vm.isLoading.collectAsState()

    Box(modifier = Modifier.fillMaxSize().background(BgGrad)) {
        Column(modifier = Modifier.fillMaxSize()) {
            // â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            GymHeader(sessionActive = sessionActive, activeTab = activeTab)

            // â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            GymTabRow(activeTab = activeTab, onTabSelected = { vm.setTab(it) })

            // â”€â”€ Contenido â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            AnimatedContent(
                targetState = activeTab,
                transitionSpec = { fadeIn(tween(200)) togetherWith fadeOut(tween(200)) },
                label = "gym_tab"
            ) { tab ->
                when (tab) {
                    0 -> RoutinesTab(vm = vm)
                    1 -> SessionTab(vm = vm)
                    2 -> HistoryTab(vm = vm)
                    3 -> ProgressTab(vm = vm)
                }
            }
        }

        // â”€â”€ Timer descanso flotante â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        AnimatedVisibility(
            visible = restActive,
            modifier = Modifier.align(Alignment.TopCenter).padding(top = 8.dp),
            enter = fadeIn() + expandVertically(),
            exit  = fadeOut() + shrinkVertically()
        ) {
            RestTimerBanner(seconds = restSeconds, onSkip = { vm.skipRestTimer() })
        }

        // â”€â”€ FAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (activeTab == 0 && !sessionActive) {
            FloatingActionButton(
                onClick  = { vm.showAddExerciseDialog() },
                modifier = Modifier.align(Alignment.BottomEnd).padding(20.dp),
                shape    = CircleShape,
                containerColor = GymRed,
                elevation = FloatingActionButtonDefaults.elevation(6.dp)
            ) {
                Icon(Icons.Default.Add, "AÃ±adir ejercicio", tint = Color.White)
            }
        }
    }

    if (showDialog) {
        ExerciseDialog(
            exercise  = editingExercise,
            onDismiss = { vm.hideExerciseDialog() },
            onSave    = { vm.saveExercise(it) }
        )
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HEADER
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Composable
fun GymHeader(sessionActive: Boolean, activeTab: Int) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(start = 20.dp, end = 16.dp, top = 20.dp, bottom = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier
            .size(44.dp).clip(RoundedCornerShape(14.dp))
            .background(RedGrad),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.FitnessCenter, null, tint = Color.White, modifier = Modifier.size(24.dp))
        }
        Spacer(Modifier.width(14.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text("Gym", style = MaterialTheme.typography.headlineMedium.copy(
                fontWeight = FontWeight.ExtraBold, color = Color.White, fontSize = 26.sp))
            Text(if (sessionActive) "ðŸ”´ SesiÃ³n en curso" else "Tu entrenamiento",
                style = MaterialTheme.typography.bodySmall.copy(
                    color = if (sessionActive) GymRed else GymMuted))
        }
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TABS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Composable
fun GymTabRow(activeTab: Int, onTabSelected: (Int) -> Unit) {
    val tabs = listOf("ðŸ’ª Rutinas", "â–¶ SesiÃ³n", "ðŸ“Š Historial", "ðŸ“ˆ Progreso")
    Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp)
        .clip(RoundedCornerShape(14.dp)).background(GymCard).padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        tabs.forEachIndexed { i, label ->
            val sel = activeTab == i
            Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp))
                .background(if (sel) RedGrad else Brush.linearGradient(listOf(Color.Transparent, Color.Transparent)))
                .clickable { onTabSelected(i) }.padding(vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(label, style = MaterialTheme.typography.labelMedium.copy(
                    fontWeight = if (sel) FontWeight.ExtraBold else FontWeight.Normal,
                    color = if (sel) Color.White else GymMuted,
                    fontSize = 11.sp
                ))
            }
        }
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TAB 0: RUTINAS DEL DÃA
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Composable
fun RoutinesTab(vm: GymViewModel) {
    val selectedDay   by vm.selectedDayOfWeek.collectAsState()
    val currentRoutine by vm.currentRoutine.collectAsState()
    val isLoading     by vm.isLoading.collectAsState()
    val sessionActive by vm.sessionActive.collectAsState()
    val allDays = vm.getAllDaysOfWeek()
    val isToday = vm.isToday()

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 120.dp)
    ) {
        // â”€â”€ Selector de dÃ­a â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        item {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                // Flechas + tÃ­tulo del dÃ­a
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = { vm.getPreviousDay() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = GymText)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(selectedDay, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, color = GymText))
                        if (isToday) Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(GymRed.copy(0.15f)).padding(horizontal = 10.dp, vertical = 2.dp)) {
                            Text("Hoy", style = MaterialTheme.typography.labelSmall.copy(color = GymRed, fontWeight = FontWeight.Bold))
                        }
                    }
                    IconButton(onClick = { vm.getNextDay() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = GymText)
                    }
                }
                // Chips de dÃ­as de la semana
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    allDays.forEach { day ->
                        val isSelected = day == selectedDay
                        val isT = day == vm.getAllDaysOfWeek()[java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_WEEK).let {
                            listOf(0,0,1,2,3,4,5,6).getOrElse(it) { 0 }
                        }]
                        Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(8.dp))
                            .background(if (isSelected) RedGrad else Brush.linearGradient(listOf(GymCard2, GymCard2)))
                            .border(1.dp, if (isSelected) Color.Transparent else GymBorder, RoundedCornerShape(8.dp))
                            .clickable { vm.loadRoutineForDay(day) }.padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(day.take(3), style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) Color.White else GymMuted,
                                fontSize = 9.sp
                            ))
                        }
                    }
                }
            }
        }

        // â”€â”€ Stats card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        item {
            val totalEx = vm.getTotalExercises()
            val totalSets = vm.getTotalSets()
            val estTime = vm.getEstimatedTime()
            val totalVol = vm.getTotalVolume()
            Card(modifier = Modifier.fillMaxWidth().padding(16.dp),
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                border = CardDefaults.outlinedCardBorder()
            ) {
                Box(modifier = Modifier.fillMaxWidth().background(
                    Brush.linearGradient(listOf(GymRed, GymOrange))
                ).padding(22.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        GymStatItem("Ejercicios", totalEx.toString(), "ðŸ’ª")
                        GymStatItem("Series", totalSets.toString(), "ðŸ”„")
                        GymStatItem("~Tiempo", "${estTime}m", "â±")
                        GymStatItem("Volumen", "${totalVol.toInt()}kg", "ðŸ“¦")
                    }
                }
            }
        }

        // â”€â”€ Ejercicios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (isLoading) {
            item { GymLoadingPlaceholder() }
        } else if (currentRoutine?.exercises.isNullOrEmpty()) {
            item {
                GymEmptyState(day = selectedDay, onAdd = { vm.showAddExerciseDialog() })
            }
        } else {
            itemsIndexed(currentRoutine!!.exercises) { idx, exercise ->
                ExerciseCard(
                    exercise = exercise,
                    index    = idx,
                    sessionActive = sessionActive,
                    completedSets = vm.completedSetsByExercise[exercise.name] ?: 0,
                    onEdit   = { vm.showEditExerciseDialog(exercise, idx) },
                    onDelete = { vm.deleteExercise(idx) },
                    onLogSet = {} // Logging desde la tab de sesiÃ³n
                )
            }
        }

        // â”€â”€ BotÃ³n iniciar sesiÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (!currentRoutine?.exercises.isNullOrEmpty() && !sessionActive) {
            item {
                Spacer(Modifier.height(8.dp))
                Box(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
                    .clip(RoundedCornerShape(18.dp)).background(RedGrad)
                    .clickable { vm.startSession(); vm.setTab(1) }.padding(18.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.PlayArrow, null, tint = Color.White, modifier = Modifier.size(24.dp))
                        Text("Comenzar sesiÃ³n", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold, color = Color.White))
                    }
                }
            }
        }
    }
}

@Composable
fun GymStatItem(label: String, value: String, emoji: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(emoji, fontSize = 18.sp)
        Text(value, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, color = Color.White))
        Text(label, style = MaterialTheme.typography.labelSmall.copy(color = Color.White.copy(0.75f)))
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TAB 1: SESIÃ“N ACTIVA
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Composable
fun SessionTab(vm: GymViewModel) {
    val sessionActive  by vm.sessionActive.collectAsState()
    val sessionSeconds by vm.sessionSeconds.collectAsState()
    val currentRoutine by vm.currentRoutine.collectAsState()
    val completedSets  by vm.completedSets.collectAsState()
    val context = androidx.compose.ui.platform.LocalContext.current

    if (!sessionActive) {
        // No hay sesiÃ³n activa
        Column(modifier = Modifier.fillMaxSize().padding(40.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text("âš¡", fontSize = 60.sp, textAlign = TextAlign.Center)
            Spacer(Modifier.height(16.dp))
            Text("Sin sesiÃ³n activa", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = GymText))
            Spacer(Modifier.height(8.dp))
            Text("Ve a Rutinas y pulsa Comenzar sesiÃ³n", style = MaterialTheme.typography.bodyMedium.copy(color = GymMuted), textAlign = TextAlign.Center)
            Spacer(Modifier.height(24.dp))
            Button(onClick = { vm.setTab(0) },
                colors = ButtonDefaults.buttonColors(containerColor = GymRed),
                shape = RoundedCornerShape(14.dp)
            ) { Text("Ver rutinas") }
        }
        return
    }

    // â”€â”€ SesiÃ³n en curso â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    val h = sessionSeconds / 3600
    val m = (sessionSeconds % 3600) / 60
    val s = sessionSeconds % 60
    val timerText = if (h > 0) "%d:%02d:%02d".format(h, m, s) else "%02d:%02d".format(m, s)

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 120.dp)
    ) {
        // â”€â”€ Timer grande â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        item {
            Card(modifier = Modifier.fillMaxWidth().padding(16.dp),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.Transparent)
            ) {
                Box(modifier = Modifier.fillMaxWidth().background(RedGrad).padding(28.dp)) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        Text("ðŸ”´ SESIÃ“N EN CURSO", style = MaterialTheme.typography.labelLarge.copy(color = Color.White.copy(0.8f), fontWeight = FontWeight.Bold, letterSpacing = 2.sp))
                        Spacer(Modifier.height(8.dp))
                        Text(timerText, style = MaterialTheme.typography.displayLarge.copy(fontWeight = FontWeight.ExtraBold, color = Color.White, fontSize = 56.sp))
                        Spacer(Modifier.height(4.dp))
                        Text("${completedSets.size} series completadas",
                            style = MaterialTheme.typography.bodyMedium.copy(color = Color.White.copy(0.8f)))
                    }
                }
            }
        }

        // â”€â”€ Ejercicios con botones de log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        item {
            Text("  Ejercicios", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = GymText),
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp))
        }

        val exercises = currentRoutine?.exercises ?: emptyList()
        items(exercises) { exercise ->
            val done = completedSets.count { it.exerciseName == exercise.name }
            SessionExerciseCard(
                exercise  = exercise,
                setsCompleted = done,
                onLogSet  = { reps, weight -> vm.logSet(exercise.name, reps, weight) }
            )
        }

        // â”€â”€ Finalizar / Cancelar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        item {
            Spacer(Modifier.height(16.dp))
            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(16.dp))
                    .background(GymCard2).border(1.dp, GymBorder, RoundedCornerShape(16.dp))
                    .clickable { vm.cancelSession() }.padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Stop, null, tint = GymMuted, modifier = Modifier.size(18.dp))
                        Text("Cancelar", style = MaterialTheme.typography.labelLarge.copy(color = GymMuted))
                    }
                }
                Box(modifier = Modifier.weight(2f).clip(RoundedCornerShape(16.dp))
                    .background(GreenGrad).clickable { vm.finishSession(context) }.padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Check, null, tint = Color.White, modifier = Modifier.size(20.dp))
                        Text("Finalizar sesiÃ³n", style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold, color = Color.White))
                    }
                }
            }
        }
    }
}

@Composable
fun SessionExerciseCard(exercise: Exercise, setsCompleted: Int, onLogSet: (Int, Float) -> Unit) {
    val color = muscleColor(exercise.muscleGroup)
    var showLogDialog by remember { mutableStateOf(false) }
    val allDone = setsCompleted >= exercise.sets && exercise.sets > 0

    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 5.dp),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = if (allDone) GymGreen.copy(0.1f) else GymCard2),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = Brush.linearGradient(if (allDone) listOf(GymGreen, GymGreen) else listOf(color.copy(0.3f), color.copy(0.1f)))
        )
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            // Progreso circular de series
            Box(modifier = Modifier.size(52.dp), contentAlignment = Alignment.Center) {
                val progress = if (exercise.sets > 0) setsCompleted.toFloat() / exercise.sets else 0f
                val animProg by animateFloatAsState(progress, spring(Spring.DampingRatioMediumBouncy), label = "")
                androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
                    drawCircle(color = color.copy(0.15f))
                    drawArc(
                        color = color,
                        startAngle = -90f,
                        sweepAngle = 360f * animProg,
                        useCenter = false,
                        style = androidx.compose.ui.graphics.drawscope.Stroke(width = 5f)
                    )
                }
                Text(
                    "$setsCompleted/${exercise.sets}",
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.ExtraBold, color = if (allDone) GymGreen else color, fontSize = 10.sp)
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(exercise.name, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold, color = GymText), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (exercise.reps.isNotBlank()) SmallBadge("${exercise.reps} reps", color)
                    if (exercise.weight > 0) SmallBadge("${exercise.weight}kg", GymAmber)
                    SmallBadge("${exercise.restSeconds}s rest", GymBlue)
                }
                if (exercise.notes.isNotBlank()) Text(exercise.notes, style = MaterialTheme.typography.labelSmall.copy(color = GymMuted), maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            if (!allDone) {
                Box(modifier = Modifier.clip(RoundedCornerShape(12.dp)).background(color).clickable { showLogDialog = true }.padding(10.dp)) {
                    Text("+ Serie", style = MaterialTheme.typography.labelLarge.copy(color = Color.White, fontWeight = FontWeight.ExtraBold))
                }
            } else {
                Icon(Icons.Default.Check, null, tint = GymGreen, modifier = Modifier.size(28.dp))
            }
        }
    }

    if (showLogDialog) {
        LogSetDialog(
            exerciseName   = exercise.name,
            defaultReps    = exercise.reps.toIntOrNull() ?: 10,
            defaultWeight  = exercise.weight,
            onDismiss      = { showLogDialog = false },
            onLog          = { r, w -> onLogSet(r, w); showLogDialog = false }
        )
    }
}

@Composable
fun LogSetDialog(exerciseName: String, defaultReps: Int, defaultWeight: Float, onDismiss: () -> Unit, onLog: (Int, Float) -> Unit) {
    var reps   by remember { mutableIntStateOf(defaultReps) }
    var weight by remember { mutableFloatStateOf(defaultWeight) }
    Dialog(onDismissRequest = onDismiss) {
        Card(shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = GymCard),
            border = CardDefaults.outlinedCardBorder()) {
            Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("Registrar serie", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, color = GymText))
                Text(exerciseName, style = MaterialTheme.typography.bodyLarge.copy(color = GymRed, fontWeight = FontWeight.Bold))
                // Reps
                Column {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Repeticiones", style = MaterialTheme.typography.labelLarge.copy(color = GymMuted))
                        Text("$reps reps", style = MaterialTheme.typography.labelLarge.copy(color = GymText, fontWeight = FontWeight.Bold))
                    }
                    Slider(value = reps.toFloat(), onValueChange = { reps = it.toInt() }, valueRange = 1f..30f, steps = 28,
                        colors = SliderDefaults.colors(thumbColor = GymRed, activeTrackColor = GymRed))
                }
                // Peso
                Column {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Peso (kg)", style = MaterialTheme.typography.labelLarge.copy(color = GymMuted))
                        Text("${"%.1f".format(weight)} kg", style = MaterialTheme.typography.labelLarge.copy(color = GymText, fontWeight = FontWeight.Bold))
                    }
                    Slider(value = weight, onValueChange = { weight = (it * 2).toInt() / 2f }, valueRange = 0f..200f,
                        colors = SliderDefaults.colors(thumbColor = GymAmber, activeTrackColor = GymAmber))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    TextButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Cancelar", color = GymMuted) }
                    Button(onClick = { onLog(reps, weight) }, modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = GymGreen), shape = RoundedCornerShape(12.dp)) {
                        Text("âœ“ Registrar", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TAB 2: HISTORIAL
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Composable
fun HistoryTab(vm: GymViewModel) {
    val sessions by vm.recentSessions.collectAsState()

    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 100.dp)) {
        // â”€â”€ EstadÃ­sticas globales â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        item {
            val totalSess = vm.getTotalSessionsCount()
            val totalVol  = vm.getTotalVolumeAllTime()
            val avgMin    = vm.getAvgSessionMinutes()
            Row(modifier = Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatCard("Sesiones", totalSess.toString(), "ðŸ‹ï¸", GymRed, modifier = Modifier.weight(1f))
                StatCard("Volumen", "${(totalVol/1000).toInt()}t", "ðŸ“¦", GymOrange, modifier = Modifier.weight(1f))
                StatCard("Media", "${avgMin}m", "â±", GymGreen, modifier = Modifier.weight(1f))
            }
        }

        // â”€â”€ Registro de Peso â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        item {
            val weight by vm.bodyWeight.collectAsState()
            var showWeightDialog by remember { mutableStateOf(false) }

            Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
                .clickable { showWeightDialog = true },
                shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = GymCard2),
                border = CardDefaults.outlinedCardBorder()
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                        Box(modifier = Modifier.size(44.dp).clip(RoundedCornerShape(12.dp)).background(GymBlue.copy(0.15f)), contentAlignment = Alignment.Center) {
                            Text("âš–ï¸", fontSize = 20.sp)
                        }
                        Column {
                            Text("Peso Corporal", style = MaterialTheme.typography.bodyLarge.copy(color = GymText, fontWeight = FontWeight.Bold))
                            if (weight > 0) {
                                Text("%.1f kg".format(weight), style = MaterialTheme.typography.labelMedium.copy(color = GymBlue, fontWeight = FontWeight.Bold))
                            } else {
                                Text("Sin registrar", style = MaterialTheme.typography.labelMedium.copy(color = GymMuted))
                            }
                        }
                    }
                    Icon(Icons.Default.Edit, null, tint = GymMuted, modifier = Modifier.size(18.dp))
                }
            }

            if (showWeightDialog) {
                var input by remember { mutableStateOf(if (weight > 0) weight.toString() else "") }
                AlertDialog(
                    onDismissRequest = { showWeightDialog = false },
                    containerColor = GymCard,
                    title = { Text("Registrar Peso", color = GymText) },
                    text = {
                        OutlinedTextField(
                            value = input,
                            onValueChange = { input = it },
                            label = { Text("Peso (kg)") },
                            singleLine = true
                        )
                    },
                    confirmButton = {
                        Button(onClick = {
                            input.toDoubleOrNull()?.let { vm.updateBodyWeight(it) }
                            showWeightDialog = false
                        }, colors = ButtonDefaults.buttonColors(containerColor = GymBlue)) {
                            Text("Guardar")
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { showWeightDialog = false }) { Text("Cancelar", color = GymMuted) }
                    }
                )
            }
        }

        if (sessions.isEmpty()) {
            item {
                Column(modifier = Modifier.fillMaxWidth().padding(60.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("ðŸ“Š", fontSize = 52.sp)
                    Text("Sin historial", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = GymText))
                    Text("Completa tu primera sesiÃ³n para verla aquÃ­", style = MaterialTheme.typography.bodyMedium.copy(color = GymMuted), textAlign = TextAlign.Center)
                }
            }
        } else {
            item { Text("  Sesiones recientes", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = GymText), modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) }
            items(sessions) { session -> SessionHistoryCard(session) }
        }
    }
}

@Composable
fun StatCard(label: String, value: String, emoji: String, color: Color, modifier: Modifier = Modifier) {
    Card(modifier = modifier, shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = GymCard),
        border = CardDefaults.outlinedCardBorder()
    ) {
        Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(emoji, fontSize = 22.sp)
            Text(value, style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold, color = color))
            Text(label, style = MaterialTheme.typography.labelSmall.copy(color = GymMuted))
        }
    }
}

@Composable
fun SessionHistoryCard(session: WorkoutSession) {
    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 5.dp),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = GymCard2),
        border = CardDefaults.outlinedCardBorder()
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(48.dp).clip(RoundedCornerShape(14.dp)).background(GymRed.copy(0.15f)), contentAlignment = Alignment.Center) {
                Text("ðŸ’ª", fontSize = 20.sp)
            }
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(session.routineName.ifEmpty { session.dayOfWeek },
                    style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold, color = GymText))
                Text(session.date, style = MaterialTheme.typography.labelSmall.copy(color = GymMuted))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (session.durationMinutes > 0) SmallBadge("${session.durationMinutes}m", GymBlue)
                    if (session.completedSets.isNotEmpty()) SmallBadge("${session.completedSets.size} series", GymPurple)
                    if (session.totalVolume > 0) SmallBadge("${session.totalVolume.toInt()}kg", GymAmber)
                }
            }
            if (session.startTime.isNotBlank()) {
                Text(session.startTime, style = MaterialTheme.typography.labelMedium.copy(color = GymMuted))
            }
        }
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TARJETA DE EJERCICIO (tab rutinas)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Composable
fun ExerciseCard(
    exercise: Exercise, index: Int,
    sessionActive: Boolean, completedSets: Int,
    onEdit: () -> Unit, onDelete: () -> Unit, onLogSet: () -> Unit
) {
    val color = muscleColor(exercise.muscleGroup)
    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 5.dp),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = GymCard2),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = Brush.linearGradient(listOf(color.copy(0.3f), color.copy(0.05f)))
        )
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            // NÃºmero
            Box(modifier = Modifier.size(38.dp).clip(CircleShape).background(color.copy(0.15f)), contentAlignment = Alignment.Center) {
                Text("${index + 1}", style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold, color = color))
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(exercise.muscleGroup.emoji, fontSize = 13.sp)
                    Text(exercise.muscleGroup.label, style = MaterialTheme.typography.labelSmall.copy(color = color, fontWeight = FontWeight.Bold))
                }
                Text(exercise.name, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold, color = GymText), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (exercise.sets > 0) SmallBadge("${exercise.sets} series", color)
                    if (exercise.reps.isNotBlank()) SmallBadge("${exercise.reps} reps", GymOrange)
                    if (exercise.weight > 0) SmallBadge("${exercise.weight}kg", GymAmber)
                    SmallBadge("${exercise.restSeconds}s", GymBlue)
                }
                if (exercise.notes.isNotBlank()) Text(exercise.notes, style = MaterialTheme.typography.labelSmall.copy(color = GymMuted), maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp)) {
                IconButton(onClick = onEdit, modifier = Modifier.size(30.dp)) { Icon(Icons.Default.Edit, null, tint = GymMuted, modifier = Modifier.size(15.dp)) }
                IconButton(onClick = onDelete, modifier = Modifier.size(30.dp)) { Icon(Icons.Default.Delete, null, tint = GymRed.copy(0.7f), modifier = Modifier.size(15.dp)) }
            }
        }
    }
}

@Composable
fun SmallBadge(text: String, color: Color) {
    Box(modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(color.copy(0.14f)).padding(horizontal = 7.dp, vertical = 3.dp)) {
        Text(text, style = MaterialTheme.typography.labelSmall.copy(color = color, fontWeight = FontWeight.SemiBold))
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TIMER DE DESCANSO FLOTANTE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Composable
fun RestTimerBanner(seconds: Int, onSkip: () -> Unit) {
    Row(modifier = Modifier.padding(16.dp)
        .clip(RoundedCornerShape(20.dp))
        .background(Brush.linearGradient(listOf(GymBlue, GymPurple)))
        .padding(horizontal = 20.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Icon(Icons.Default.Timer, null, tint = Color.White, modifier = Modifier.size(22.dp))
        Column {
            Text("Descanso", style = MaterialTheme.typography.labelSmall.copy(color = Color.White.copy(0.8f)))
            Text("%02d:%02d".format(seconds / 60, seconds % 60),
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, color = Color.White))
        }
        Spacer(Modifier.weight(1f))
        Box(modifier = Modifier.clip(RoundedCornerShape(10.dp)).background(Color.White.copy(0.2f))
            .clickable { onSkip() }.padding(horizontal = 10.dp, vertical = 6.dp)) {
            Text("Saltar", style = MaterialTheme.typography.labelMedium.copy(color = Color.White, fontWeight = FontWeight.Bold))
        }
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ESTADOS VACÃO / CARGANDO
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Composable
fun GymEmptyState(day: String, onAdd: () -> Unit) {
    Column(modifier = Modifier.fillMaxWidth().padding(48.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text("ðŸ‹ï¸", fontSize = 52.sp, textAlign = TextAlign.Center)
        Text("Descanso el $day", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = GymText))
        Text("No hay ejercicios programados.\nÂ¡AÃ±ade el primero!", style = MaterialTheme.typography.bodyMedium.copy(color = GymMuted), textAlign = TextAlign.Center)
        Button(onClick = onAdd, colors = ButtonDefaults.buttonColors(containerColor = GymRed), shape = RoundedCornerShape(14.dp)) {
            Icon(Icons.Default.Add, null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text("AÃ±adir ejercicio")
        }
    }
}

@Composable
fun GymLoadingPlaceholder() {
    Column(modifier = Modifier.fillMaxWidth().padding(24.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        repeat(3) {
            Box(modifier = Modifier.fillMaxWidth().height(76.dp).clip(RoundedCornerShape(18.dp)).background(GymCard))
        }
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DIÃLOGO DE EJERCICIO
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExerciseDialog(exercise: Exercise?, onDismiss: () -> Unit, onSave: (Exercise) -> Unit) {
    var name        by remember(exercise) { mutableStateOf(exercise?.name ?: "") }
    var reps        by remember(exercise) { mutableStateOf(exercise?.reps ?: "") }
    var sets        by remember(exercise) { mutableStateOf(exercise?.sets?.toString() ?: "") }
    var weight      by remember(exercise) { mutableStateOf(exercise?.weight?.toString() ?: "") }
    var notes       by remember(exercise) { mutableStateOf(exercise?.notes ?: "") }
    var restSeconds by remember(exercise) { mutableIntStateOf(exercise?.restSeconds ?: 90) }
    var muscle      by remember(exercise) { mutableStateOf(exercise?.muscleGroup ?: MuscleGroup.OTRO) }
    var showMenu    by remember { mutableStateOf(false) }
    val isEdit = exercise != null

    Dialog(onDismissRequest = onDismiss) {
        Card(shape = RoundedCornerShape(26.dp), colors = CardDefaults.cardColors(containerColor = GymCard),
            border = CardDefaults.outlinedCardBorder()) {
            LazyColumn(modifier = Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                item {
                    Text(if (isEdit) "âœï¸ Editar ejercicio" else "ðŸ’ª Nuevo ejercicio",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, color = GymText))
                }
                item {
                    OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nombre del ejercicio") },
                        modifier = Modifier.fillMaxWidth(), singleLine = true, shape = RoundedCornerShape(12.dp))
                }
                // Grupo muscular
                item {
                    Box(modifier = Modifier.fillMaxWidth()) {
                        Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                            .background(GymCard2).border(1.dp, GymBorder, RoundedCornerShape(12.dp))
                            .clickable { showMenu = true }.padding(14.dp)
                        ) {
                            Column {
                                Text("Grupo muscular", style = MaterialTheme.typography.labelSmall.copy(color = GymMuted))
                                Spacer(Modifier.height(3.dp))
                                Text("${muscle.emoji} ${muscle.label}", style = MaterialTheme.typography.bodyMedium.copy(color = muscleColor(muscle), fontWeight = FontWeight.Bold))
                            }
                        }
                        DropdownMenu(expanded = showMenu, onDismissRequest = { showMenu = false }) {
                            MuscleGroup.values().forEach { m ->
                                DropdownMenuItem(text = { Text("${m.emoji} ${m.label}") }, onClick = { muscle = m; showMenu = false })
                            }
                        }
                    }
                }
                // Series, reps, peso
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(value = sets, onValueChange = { if (it.all { c -> c.isDigit() }) sets = it },
                            label = { Text("Series") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                        OutlinedTextField(value = reps, onValueChange = { reps = it },
                            label = { Text("Reps") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                        OutlinedTextField(value = weight, onValueChange = { weight = it },
                            label = { Text("Peso kg") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                    }
                }
                // Descanso
                item {
                    Column {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Descanso entre series", style = MaterialTheme.typography.labelLarge.copy(color = GymMuted))
                            Text("${restSeconds}s", style = MaterialTheme.typography.labelLarge.copy(color = GymText, fontWeight = FontWeight.Bold))
                        }
                        Slider(value = restSeconds.toFloat(), onValueChange = { restSeconds = it.toInt() },
                            valueRange = 30f..300f, steps = 54,
                            colors = SliderDefaults.colors(thumbColor = GymBlue, activeTrackColor = GymBlue))
                    }
                }
                // Notas
                item {
                    OutlinedTextField(value = notes, onValueChange = { notes = it }, label = { Text("Notas (opcional)") },
                        modifier = Modifier.fillMaxWidth(), maxLines = 2, shape = RoundedCornerShape(12.dp))
                }
                // Botones
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Cancelar", color = GymMuted) }
                        Button(onClick = {
                            if (name.trim().isNotBlank()) {
                                onSave(Exercise(
                                    name = name.trim(), reps = reps.trim(),
                                    sets = sets.toIntOrNull() ?: 0,
                                    weight = weight.toFloatOrNull() ?: 0f,
                                    muscleGroup = muscle, restSeconds = restSeconds,
                                    notes = notes.trim()
                                ))
                            }
                        }, enabled = name.trim().isNotBlank(),
                            colors = ButtonDefaults.buttonColors(containerColor = GymRed),
                            modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp)
                        ) { Text("Guardar", fontWeight = FontWeight.Bold) }
                    }
                }
            }
        }
    }
}

@Composable
fun ProgressTab(vm: GymViewModel) {
    val exercises = remember { vm.getUniqueExercises() }
    var selectedExercise by remember { mutableStateOf(exercises.firstOrNull() ?: "") }
    var expanded by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        contentPadding = PaddingValues(bottom = 100.dp)
    ) {
        if (exercises.isEmpty()) {
            item {
                Text(
                    "TodavÃ­a no tienes sesiones registradas para ver tu progreso.",
                    style = MaterialTheme.typography.bodyMedium.copy(color = GymMuted),
                    modifier = Modifier.padding(16.dp)
                )
            }
        } else {
            item {
                Text("GrÃ¡ficas de Progreso ðŸ“ˆ", style = MaterialTheme.typography.titleLarge.copy(color = GymText, fontWeight = FontWeight.Bold))
                Spacer(Modifier.height(16.dp))
                
                // Dropdown
                Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(GymCard).clickable { expanded = true }.padding(16.dp)) {
                    Text(selectedExercise.ifEmpty { "Selecciona un ejercicio" }, style = MaterialTheme.typography.bodyLarge.copy(color = GymText))
                    DropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false },
                        modifier = Modifier.background(GymCard)
                    ) {
                        exercises.forEach { ex ->
                            DropdownMenuItem(
                                text = { Text(ex, color = GymText) },
                                onClick = { selectedExercise = ex; expanded = false }
                            )
                        }
                    }
                }
                
                Spacer(Modifier.height(24.dp))
            }
            
            if (selectedExercise.isNotEmpty()) {
                val progressData = vm.getExerciseProgress(selectedExercise)
                if (progressData.size < 2) {
                    item {
                        Text(
                            "Necesitas al menos 2 sesiones para ver la grÃ¡fica de evoluciÃ³n.",
                            style = MaterialTheme.typography.bodyMedium.copy(color = GymMuted)
                        )
                    }
                } else {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth().height(250.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = GymCard)
                        ) {
                            Column(modifier = Modifier.padding(16.dp).fillMaxSize()) {
                                Text("Peso MÃ¡ximo (kg) a lo largo del tiempo", style = MaterialTheme.typography.titleMedium.copy(color = GymText))
                                Spacer(Modifier.height(16.dp))
                                
                                val maxWeight = progressData.maxOf { it.second }
                                val minWeight = progressData.minOf { it.second }
                                val weightRange = if (maxWeight == minWeight) 1f else maxWeight - minWeight
                                
                                Row(
                                    modifier = Modifier.fillMaxWidth().weight(1f),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.Bottom
                                ) {
                                    progressData.forEach { (date, weight) ->
                                        val heightRatio = if (weightRange == 0f) 0.5f else ((weight - minWeight) / weightRange) * 0.8f + 0.2f
                                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = weight.toString(),
                                                style = MaterialTheme.typography.bodySmall.copy(color = GymMuted, fontSize = 10.sp)
                                            )
                                            Spacer(Modifier.height(4.dp))
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxWidth(0.6f)
                                                    .fillMaxHeight(heightRatio)
                                                    .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                                                    .background(GymRed)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
