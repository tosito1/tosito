package com.toust.tosito.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.google.firebase.auth.FirebaseAuth
import com.toust.tosito.data.model.MealType
import com.toust.tosito.data.model.TransactionType
import com.toust.tosito.navigation.Screen
import com.toust.tosito.ui.viewmodel.GymViewModel
import com.toust.tosito.ui.viewmodel.MealViewModel
import com.toust.tosito.ui.viewmodel.SavingsViewModel
import com.toust.tosito.ui.viewmodel.CalendarViewModel
import com.toust.tosito.data.model.TimelineItem
import java.text.SimpleDateFormat
import java.util.*

// ─── Paleta del Home ──────────────────────────────────────────────────────────
private val HBg       = Color(0xFF080C14)
private val HBg2      = Color(0xFF0F1520)
private val HCard     = Color(0xFF141C2A)
private val HCard2    = Color(0xFF1A2438)
private val HBorder   = Color(0xFF243044)
private val HText     = Color(0xFFEDF2FF)
private val HMuted    = Color(0xFF6B7FA3)

// Gradientes por sección
private val CalGrad   = Brush.linearGradient(listOf(Color(0xFF667EEA), Color(0xFF9B59B6)))
private val GymGrad   = Brush.linearGradient(listOf(Color(0xFFEF4444), Color(0xFFF97316)))
private val MealGrad  = Brush.linearGradient(listOf(Color(0xFF14B8A6), Color(0xFF06B6D4)))
private val SaveGrad  = Brush.linearGradient(listOf(Color(0xFF10B981), Color(0xFF34D399)))
private val BgGrad    = Brush.verticalGradient(listOf(HBg, HBg2))

private val CalColor  = Color(0xFF7C3AED)
private val GymColor  = Color(0xFFEF4444)
private val MealColor = Color(0xFF14B8A6)
private val SaveColor = Color(0xFF10B981)

// ─────────────────────────────────────────────────────────────────────────────
// HOME SCREEN
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun HomeScreen(
    onNavigate: (Screen) -> Unit,
    userId: String = FirebaseAuth.getInstance().currentUser?.uid ?: ""
) {
    val gymVm:     GymViewModel     = viewModel()
    val mealVm:    MealViewModel    = viewModel()
    val savingsVm: SavingsViewModel = viewModel()
    val calVm:     CalendarViewModel= viewModel()
    val notesVm:   com.toust.tosito.ui.viewmodel.NotesViewModel = viewModel()

    LaunchedEffect(userId) {
        gymVm.loadAll()
        mealVm.loadAll()
        savingsVm.loadAll()
        calVm.loadAll()
        notesVm.loadNotes()
    }

    val todayRoutine   by gymVm.currentRoutine.collectAsState()
    val sessionActive  by gymVm.sessionActive.collectAsState()
    val dayPlan        by mealVm.dayPlan.collectAsState()
    val goals          by savingsVm.goals.collectAsState()
    val savingsSummary by savingsVm.summary.collectAsState()
    val budgetLimit    by savingsVm.budgetLimit.collectAsState()
    val timelineItems  by calVm.timelineItems.collectAsState()
    val notesList      by notesVm.notes.collectAsState()

    Box(modifier = Modifier.fillMaxSize().background(BgGrad)) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 100.dp)
        ) {
            // ── Saludo + fecha ────────────────────────────────────────────────
            item { HomeHeader(userId = userId, onNavigate = onNavigate) }

            // ── Tarjetas de acción rápida (horizontal scroll) ─────────────────
            item { QuickActionsRow(onNavigate = onNavigate) }

            // ── Calendario ────────────────────────────────────────────────────
            item { SectionLabel("📅 Próximo evento") }
            item {
                val cal = Calendar.getInstance()
                val currentMinutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
                val upcomingEvent = timelineItems.firstOrNull { it.endMinutes > currentMinutes }
                
                CalendarHeroCard(
                    upcomingEvent = upcomingEvent,
                    onClick = { onNavigate(Screen.Calendar) }
                )
            }

            // ── Sección Gym ────────────────────────────────────────────────────
            item { SectionLabel("💪 Entrenamiento de hoy") }
            item {
                GymHeroCard(
                    routine       = todayRoutine,
                    sessionActive = sessionActive,
                    onClick       = { onNavigate(Screen.Gym) }
                )
            }

            // ── Sección Comidas ────────────────────────────────────────────────
            item { SectionLabel("🍽️ Plan de comidas") }
            item {
                MealsHeroCard(
                    dayPlan       = dayPlan,
                    allMeals      = mealVm.allMeals.collectAsState().value,
                    isTrainingDay = todayRoutine?.exercises?.isNotEmpty() == true,
                    onClick       = { onNavigate(Screen.Meals) }
                )
            }

            // ── Sección Ahorros + Objetivos ───────────────────────────────────
            item { SectionLabel("💰 Presupuesto y Metas") }
            item {
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    SavingsBalanceCard(
                        modifier = Modifier.weight(1f),
                        expense  = savingsSummary.totalExpense,
                        limit    = budgetLimit,
                        onClick  = { onNavigate(Screen.Savings) }
                    )
                    GoalsCard(
                        modifier = Modifier.weight(1f),
                        goals    = goals,
                        onClick  = { onNavigate(Screen.Savings) }
                    )
                }
            }

            // ── Sección Analítica ──────────────────────────────────────────────
            item {
                Button(
                    onClick = { onNavigate(Screen.Analytics) },
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Icon(androidx.compose.material.icons.Icons.Default.FitnessCenter, contentDescription = null, tint = Color.White)
                    Spacer(Modifier.width(8.dp))
                    Text("Ver mi Resumen Semanal 🔥", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Color.White))
                }
            }

            item { Spacer(Modifier.height(16.dp)) }

            // ── Sección Notas ──────────────────────────────────────────────────
            item { SectionLabel("📝 Notas rápidas") }
            item {
                NotesCard(
                    notes = notesList,
                    onAdd = { notesVm.addNote(it) },
                    onToggle = { notesVm.toggleNote(it) },
                    onDelete = { notesVm.deleteNote(it) }
                )
            }

            item { Spacer(Modifier.height(8.dp)) }
        }

    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun HomeHeader(userId: String, onNavigate: (Screen) -> Unit) {
    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    val greeting = when {
        hour < 6  -> "Buenas noches 🌙"
        hour < 12 -> "Buenos días ☀️"
        hour < 18 -> "Buenas tardes 🌤️"
        else      -> "Buenas noches 🌙"
    }
    val sdf = SimpleDateFormat("EEEE, d 'de' MMMM", Locale("es", "ES"))
    val dateStr = sdf.format(Date()).replaceFirstChar { it.uppercase() }
    val userName = FirebaseAuth.getInstance().currentUser?.email?.substringBefore("@")?.replaceFirstChar { it.uppercase() } ?: "Usuario"

    Row(modifier = Modifier.fillMaxWidth().padding(start = 20.dp, end = 20.dp, top = 24.dp, bottom = 8.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
        Column {
            Text(greeting, style = MaterialTheme.typography.bodyMedium.copy(color = HMuted))
            Text(userName, style = MaterialTheme.typography.headlineMedium.copy(
                fontWeight = FontWeight.ExtraBold, color = HText, fontSize = 28.sp))
            Text(dateStr, style = MaterialTheme.typography.bodySmall.copy(color = HMuted))
        }
        // Avatar
        Box(modifier = Modifier.size(52.dp).clip(CircleShape)
            .background(Brush.linearGradient(listOf(CalColor, GymColor)))
            .clickable { onNavigate(Screen.Profile) },
            contentAlignment = Alignment.Center) {
            Text(userName.take(1).uppercase(), style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.ExtraBold, color = Color.White))
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESOS RÁPIDOS
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun QuickActionsRow(onNavigate: (Screen) -> Unit) {
    val actions = listOf(
        Triple("Calendario", "📅", CalGrad) to Screen.Calendar,
        Triple("Gym",        "🏋️", GymGrad)  to Screen.Gym,
        Triple("Comidas",    "🍽️", MealGrad) to Screen.Meals,
        Triple("Ahorros",    "💰", SaveGrad) to Screen.Savings
    )
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        items(actions) { (info, screen) ->
            val (label, emoji, grad) = info
            Column(modifier = Modifier.clickable { onNavigate(screen) },
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Box(modifier = Modifier.size(58.dp).clip(RoundedCornerShape(18.dp)).background(grad)
                    .shadow(8.dp, RoundedCornerShape(18.dp)),
                    contentAlignment = Alignment.Center) {
                    Text(emoji, fontSize = 26.sp)
                }
                Text(label, style = MaterialTheme.typography.labelSmall.copy(color = HMuted, fontWeight = FontWeight.Medium))
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun SectionLabel(text: String) {
    Text(text, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold, color = HText, fontSize = 14.sp),
        modifier = Modifier.padding(start = 20.dp, top = 16.dp, bottom = 6.dp, end = 16.dp))
}

@Composable
fun HSmallBadge(text: String, color: Color) {
    Box(modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(color.copy(0.15f)).padding(horizontal = 8.dp, vertical = 4.dp)) {
        Text(text, style = MaterialTheme.typography.labelSmall.copy(color = color, fontWeight = FontWeight.SemiBold))
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TARJETA GYM
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun GymHeroCard(routine: com.toust.tosito.data.model.GymRoutine?, sessionActive: Boolean, onClick: () -> Unit) {
    val exercises   = routine?.exercises ?: emptyList()
    val totalSets   = exercises.sumOf { it.sets }
    val estTime     = totalSets * 3

    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
        .clickable { onClick() }.shadow(12.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = HCard),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(GymColor.copy(0.4f), GymColor.copy(0.05f))))) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Box(modifier = Modifier.size(40.dp).clip(RoundedCornerShape(12.dp)).background(GymGrad), contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.FitnessCenter, null, tint = Color.White, modifier = Modifier.size(20.dp))
                    }
                    Column {
                        Text(if (sessionActive) "¡A darle caña!" else "Rutina de hoy", style = MaterialTheme.typography.labelSmall.copy(color = GymColor))
                        Text(routine?.name?.ifEmpty { routine.dayOfWeek } ?: "Sin rutina hoy",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold, color = HText))
                    }
                }
                Icon(Icons.Default.ChevronRight, null, tint = HMuted)
            }
            if (routine != null && exercises.isNotEmpty()) {
                Spacer(Modifier.height(14.dp))
                // Stats
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    GymStatPill("${exercises.size} ejerc.", GymColor)
                    GymStatPill("$totalSets series", GymColor.copy(0.8f))
                    GymStatPill("~${estTime}m", GymColor.copy(0.6f))
                }
                Spacer(Modifier.height(12.dp))
                // Chips de ejercicios
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    exercises.take(3).forEach { ex ->
                        Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp))
                            .background(GymColor.copy(0.1f)).border(1.dp, GymColor.copy(0.25f), RoundedCornerShape(10.dp))
                            .padding(vertical = 8.dp), contentAlignment = Alignment.Center) {
                            Text(ex.name, style = MaterialTheme.typography.labelSmall.copy(color = GymColor, fontWeight = FontWeight.Bold, fontSize = 10.sp), maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                    }
                }
            } else {
                Spacer(Modifier.height(12.dp))
                Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp))
                    .background(GymColor.copy(0.06f)).padding(16.dp), contentAlignment = Alignment.Center) {
                    Text("🏖️ Hoy toca descansar", style = MaterialTheme.typography.bodyMedium.copy(color = HMuted))
                }
            }
        }
    }
}

@Composable
fun GymStatPill(text: String, color: Color) {
    Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(color.copy(0.12f)).padding(horizontal = 10.dp, vertical = 5.dp)) {
        Text(text, style = MaterialTheme.typography.labelSmall.copy(color = color, fontWeight = FontWeight.Bold))
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TARJETA COMIDAS
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun MealsHeroCard(
    dayPlan: com.toust.tosito.data.model.DayMealPlan?,
    allMeals: List<com.toust.tosito.data.model.Meal>,
    isTrainingDay: Boolean,
    onClick: () -> Unit
) {
    val planned = dayPlan?.plannedMeals ?: emptyList()
    val eaten   = planned.count { it.isEaten }
    val nextMealPlan = planned.firstOrNull { !it.isEaten }
    val nextMealData = nextMealPlan?.let { nm -> allMeals.firstOrNull { it.id == nm.mealId } }
    
    val totalCal = planned.sumOf { pm ->
        (allMeals.firstOrNull { it.id == pm.mealId }?.totalCalories?.times(pm.servings))?.toDouble() ?: 0.0
    }
    val mealTypes = listOf(
        MealType.DESAYUNO to planned.filter { it.mealType == MealType.DESAYUNO },
        MealType.ALMUERZO to planned.filter { it.mealType == MealType.ALMUERZO },
        MealType.CENA     to planned.filter { it.mealType == MealType.CENA }
    )
    val progress = if (planned.isNotEmpty()) eaten.toFloat() / planned.size else 0f
    val animProgress by animateFloatAsState(progress, spring(Spring.DampingRatioMediumBouncy), label = "")

    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).clickable { onClick() }.shadow(12.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = HCard),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(MealColor.copy(0.4f), MealColor.copy(0.05f))))) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Box(modifier = Modifier.size(40.dp).clip(RoundedCornerShape(12.dp)).background(MealGrad), contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.Restaurant, null, tint = Color.White, modifier = Modifier.size(20.dp))
                    }
                    Column {
                        if (nextMealPlan != null && nextMealData != null) {
                            Text("Próxima: ${nextMealPlan.mealType.label}", style = MaterialTheme.typography.labelSmall.copy(color = MealColor))
                            Text(nextMealData.name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold, color = HText))
                        } else if (planned.isNotEmpty()) {
                            Text("¡Todo comido!", style = MaterialTheme.typography.labelSmall.copy(color = MealColor))
                            Text("Plan completado", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold, color = HText))
                        } else {
                            Text("Sin comidas", style = MaterialTheme.typography.labelSmall.copy(color = HMuted))
                            Text("Planifica tu día", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold, color = HText))
                        }
                    }
                }
                Icon(Icons.Default.ChevronRight, null, tint = HMuted)
            }
            if (planned.isNotEmpty()) {
                Spacer(Modifier.height(14.dp))
                // Smart banner mini si es día de entreno
                if (isTrainingDay) {
                    Row(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).clip(RoundedCornerShape(8.dp)).background(MealColor.copy(0.15f)).padding(horizontal = 10.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("💪", fontSize = 16.sp)
                        Text("Hoy se entrena. ¡Prioriza proteína!", style = MaterialTheme.typography.labelSmall.copy(color = MealColor, fontWeight = FontWeight.Bold))
                    }
                }
                
                // Progress bar
                LinearProgressIndicator(progress = { animProgress }, modifier = Modifier.fillMaxWidth().height(6.dp).clip(CircleShape),
                    color = MealColor, trackColor = MealColor.copy(0.12f))
                Spacer(Modifier.height(14.dp))
                // Por tipo de comida
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    mealTypes.forEach { (type, items) ->
                        if (items.isNotEmpty()) {
                            Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(12.dp))
                                .background(MealColor.copy(0.08f)).border(1.dp, MealColor.copy(0.2f), RoundedCornerShape(12.dp))
                                .padding(horizontal = 8.dp, vertical = 10.dp)) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                                    Text(type.emoji, fontSize = 20.sp)
                                    Spacer(Modifier.height(4.dp))
                                    Text(type.label, style = MaterialTheme.typography.labelSmall.copy(color = HMuted, fontSize = 9.sp))
                                    Text("${items.size}", style = MaterialTheme.typography.labelMedium.copy(color = MealColor, fontWeight = FontWeight.Bold))
                                }
                            }
                        }
                    }
                }
            } else {
                Spacer(Modifier.height(12.dp))
                Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp))
                    .background(MealColor.copy(0.06f)).padding(16.dp), contentAlignment = Alignment.Center) {
                    Text("🍳 Planifica tus comidas para hoy", style = MaterialTheme.typography.bodyMedium.copy(color = HMuted))
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TARJETA AHORROS (balance)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun SavingsBalanceCard(modifier: Modifier = Modifier, expense: Double, limit: Double, onClick: () -> Unit) {
    val remaining = limit - expense
    val overBudget = remaining < 0
    Card(modifier = modifier.clickable { onClick() }.shadow(12.dp, RoundedCornerShape(22.dp)),
        shape = RoundedCornerShape(22.dp), colors = CardDefaults.cardColors(containerColor = HCard),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(if (overBudget) GymColor.copy(0.4f) else SaveColor.copy(0.4f), Color.Transparent)))) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(modifier = Modifier.size(34.dp).clip(RoundedCornerShape(10.dp)).background(if (overBudget) GymGrad else SaveGrad), contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.AccountBalanceWallet, null, tint = Color.White, modifier = Modifier.size(17.dp))
                }
                Text("Presupuesto", style = MaterialTheme.typography.labelLarge.copy(color = HText, fontWeight = FontWeight.Bold))
            }
            Text(
                "%.0f€".format(remaining),
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, color = if (overBudget) Color(0xFFEF4444) else SaveColor, fontSize = 22.sp)
            )
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("📉", fontSize = 11.sp)
                    Text("%.0f€ gastados".format(expense), style = MaterialTheme.typography.labelSmall.copy(color = Color(0xFFEF4444), fontWeight = FontWeight.Bold))
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("🎯", fontSize = 11.sp)
                    Text("%.0f€ límite".format(limit), style = MaterialTheme.typography.labelSmall.copy(color = SaveColor, fontWeight = FontWeight.Bold))
                }
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                Icon(Icons.Default.ChevronRight, null, tint = HMuted, modifier = Modifier.size(16.dp))
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TARJETA OBJETIVOS
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun GoalsCard(modifier: Modifier = Modifier, goals: List<com.toust.tosito.data.model.SavingsGoal>, onClick: () -> Unit) {
    val active    = goals.filter { !it.isCompleted }
    val totalProg = if (active.isNotEmpty()) active.sumOf { it.progress } / active.size else 0.0
    val animProg  by animateFloatAsState(totalProg.toFloat(), spring(Spring.DampingRatioMediumBouncy), label = "")

    Card(modifier = modifier.clickable { onClick() }.shadow(12.dp, RoundedCornerShape(22.dp)),
        shape = RoundedCornerShape(22.dp), colors = CardDefaults.cardColors(containerColor = HCard),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(CalColor.copy(0.4f), CalColor.copy(0.05f))))) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(modifier = Modifier.size(34.dp).clip(RoundedCornerShape(10.dp))
                    .background(Brush.linearGradient(listOf(CalColor, Color(0xFF6366F1)))), contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.Star, null, tint = Color.White, modifier = Modifier.size(17.dp))
                }
                Text("Objetivos", style = MaterialTheme.typography.labelLarge.copy(color = HText, fontWeight = FontWeight.Bold))
            }
            // Gráfico circular compacto
            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                Box(modifier = Modifier.size(72.dp), contentAlignment = Alignment.Center) {
                    androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
                        drawCircle(color = CalColor.copy(0.1f))
                        drawArc(color = CalColor, startAngle = -90f, sweepAngle = 360f * animProg,
                            useCenter = false, style = Stroke(width = 9f, cap = StrokeCap.Round))
                    }
                    Text("${(totalProg * 100).toInt()}%", style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold, color = CalColor))
                }
            }
            Text("${active.size} activos · ${goals.count { it.isCompleted }} completados",
                style = MaterialTheme.typography.labelSmall.copy(color = HMuted, fontSize = 10.sp), textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                modifier = Modifier.fillMaxWidth())
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                Icon(Icons.Default.ChevronRight, null, tint = HMuted, modifier = Modifier.size(16.dp))
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TARJETA CALENDARIO
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun CalendarHeroCard(upcomingEvent: TimelineItem?, onClick: () -> Unit) {
    val cal      = Calendar.getInstance()
    val sdfMonth = SimpleDateFormat("MMMM yyyy", Locale("es","ES"))
    val monthStr = sdfMonth.format(cal.time).replaceFirstChar { it.uppercase() }

    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).clickable { onClick() }.shadow(12.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = HCard),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(CalColor.copy(0.4f), CalColor.copy(0.05f))))) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Box(modifier = Modifier.size(40.dp).clip(RoundedCornerShape(12.dp)).background(CalGrad), contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.Event, null, tint = Color.White, modifier = Modifier.size(20.dp))
                    }
                    Column {
                        if (upcomingEvent != null) {
                            Text("A continuación", style = MaterialTheme.typography.labelSmall.copy(color = CalColor))
                            Text(upcomingEvent.title, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold, color = HText))
                        } else {
                            Text("Libre por hoy", style = MaterialTheme.typography.labelSmall.copy(color = CalColor))
                            Text("Sin más eventos", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold, color = HText))
                        }
                    }
                }
                Icon(Icons.Default.ChevronRight, null, tint = HMuted)
            }
            if (upcomingEvent != null) {
                Spacer(Modifier.height(14.dp))
                // Fila con el horario
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    val startStr = com.toust.tosito.data.model.minutesToTimeString(upcomingEvent.startMinutes)
                    val endStr = com.toust.tosito.data.model.minutesToTimeString(upcomingEvent.endMinutes)
                    
                    Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(CalColor.copy(0.12f)).padding(horizontal = 10.dp, vertical = 5.dp)) {
                        Text("$startStr - $endStr", style = MaterialTheme.typography.labelSmall.copy(color = CalColor, fontWeight = FontWeight.Bold))
                    }
                    val type = when (upcomingEvent) {
                        is TimelineItem.Block -> upcomingEvent.block.category.label
                        is TimelineItem.Event -> upcomingEvent.event.category.label
                    }
                    Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(CalColor.copy(0.12f)).padding(horizontal = 10.dp, vertical = 5.dp)) {
                        Text(type, style = MaterialTheme.typography.labelSmall.copy(color = CalColor.copy(0.8f), fontWeight = FontWeight.Bold))
                    }
                }
            } else {
                Spacer(Modifier.height(12.dp))
                Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp))
                    .background(CalColor.copy(0.06f)).padding(16.dp), contentAlignment = Alignment.Center) {
                    Text("🎉 Has terminado por hoy", style = MaterialTheme.typography.bodyMedium.copy(color = HMuted))
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TARJETA NOTAS
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun NotesCard(
    notes: List<com.toust.tosito.data.model.Note>,
    onAdd: (String) -> Unit,
    onToggle: (com.toust.tosito.data.model.Note) -> Unit,
    onDelete: (com.toust.tosito.data.model.Note) -> Unit
) {
    var newNoteText by remember { mutableStateOf("") }
    
    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).shadow(12.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = HCard),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(Color(0xFFF59E0B).copy(0.4f), Color.Transparent)))) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            
            // Lista de notas (máx 5 para no ocupar mucho)
            val toShow = notes.take(5)
            if (toShow.isNotEmpty()) {
                toShow.forEach { note ->
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                        Checkbox(
                            checked = note.isCompleted,
                            onCheckedChange = { onToggle(note) },
                            colors = CheckboxDefaults.colors(checkedColor = Color(0xFFF59E0B), uncheckedColor = HMuted)
                        )
                        Text(
                            text = note.text,
                            style = MaterialTheme.typography.bodyMedium.copy(
                                color = if (note.isCompleted) HMuted else HText,
                                textDecoration = if (note.isCompleted) androidx.compose.ui.text.style.TextDecoration.LineThrough else null
                            ),
                            modifier = Modifier.weight(1f).clickable { onToggle(note) }
                        )
                        IconButton(onClick = { onDelete(note) }, modifier = Modifier.size(24.dp)) {
                            Icon(Icons.Default.Close, null, tint = HMuted, modifier = Modifier.size(16.dp))
                        }
                    }
                }
                if (notes.size > 5) {
                    Text("+ ${notes.size - 5} notas más...", style = MaterialTheme.typography.labelSmall.copy(color = HMuted), modifier = Modifier.padding(start = 12.dp))
                }
            } else {
                Text("No hay notas, añade un recordatorio rápido.", style = MaterialTheme.typography.bodySmall.copy(color = HMuted), modifier = Modifier.padding(start = 12.dp))
            }

            // Input nueva nota
            OutlinedTextField(
                value = newNoteText,
                onValueChange = { newNoteText = it },
                placeholder = { Text("Escribe una nota...", color = HMuted) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFFF59E0B),
                    unfocusedBorderColor = HBorder,
                    focusedTextColor = HText,
                    unfocusedTextColor = HText
                ),
                trailingIcon = {
                    if (newNoteText.isNotBlank()) {
                        IconButton(onClick = { onAdd(newNoteText); newNoteText = "" }) {
                            Icon(Icons.Default.Send, null, tint = Color(0xFFF59E0B))
                        }
                    }
                }
            )
        }
    }
}
