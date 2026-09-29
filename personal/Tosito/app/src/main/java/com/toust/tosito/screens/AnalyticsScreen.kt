package com.toust.tosito.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.Restaurant
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
import androidx.lifecycle.viewmodel.compose.viewModel
import com.toust.tosito.ui.viewmodel.AnalyticsViewModel

private val HBg       = Color(0xFF080C14)
private val HBg2      = Color(0xFF0F1520)
private val HCard     = Color(0xFF141C2A)
private val HText     = Color(0xFFEDF2FF)
private val HMuted    = Color(0xFF6B7FA3)
private val BrandColor = Color(0xFF6366F1)
private val GymColor  = Color(0xFFEAB308)
private val MealColor = Color(0xFFEC4899)
private val SaveColor = Color(0xFF10B981)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnalyticsScreen(onBack: () -> Unit) {
    val analyticsVm: AnalyticsViewModel = viewModel()
    val stats by analyticsVm.weeklyStats.collectAsState()
    val isLoading by analyticsVm.isLoading.collectAsState()
    
    // Refresh when loading the screen
    LaunchedEffect(Unit) {
        analyticsVm.loadStats()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Resumen Semanal", style = MaterialTheme.typography.titleLarge.copy(color = HText, fontWeight = FontWeight.Bold)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Atrás", tint = HText)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = HBg)
            )
        },
        containerColor = Color.Transparent
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(HBg, HBg2))).padding(padding)) {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center), color = BrandColor)
            } else {
                Column(
                    modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    
                    // Main message
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = HCard)
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Text(
                                "¡Gran trabajo esta semana! 🚀", 
                                style = MaterialTheme.typography.titleMedium.copy(color = BrandColor, fontWeight = FontWeight.Bold)
                            )
                            Spacer(Modifier.height(8.dp))
                            val savedStr = if (stats.savedAmount >= 0) "has ahorrado %.0f€".format(stats.savedAmount) else "te has pasado %.0f€".format(-stats.savedAmount)
                            val mealPercent = (stats.mealCompletionRatio * 100).toInt()
                            Text(
                                "Has entrenado ${stats.gymDaysCount} días, has cumplido tu dieta al $mealPercent% y $savedStr.",
                                style = MaterialTheme.typography.bodyLarge.copy(color = HText)
                            )
                        }
                    }

                    // Rachas (Streaks)
                    Text("Tus Rachas Activas 🔥", style = MaterialTheme.typography.titleMedium.copy(color = HText, fontWeight = FontWeight.Bold), modifier = Modifier.padding(top = 8.dp, start = 8.dp))
                    
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        StreakCard(
                            modifier = Modifier.weight(1f),
                            title = "Gym",
                            days = stats.gymStreak,
                            icon = Icons.Default.FitnessCenter,
                            color = GymColor
                        )
                        StreakCard(
                            modifier = Modifier.weight(1f),
                            title = "Dieta",
                            days = stats.mealStreak,
                            icon = Icons.Default.Restaurant,
                            color = MealColor
                        )
                    }

                    // Progress Bars
                    Text("Desempeño últimos 7 días 📊", style = MaterialTheme.typography.titleMedium.copy(color = HText, fontWeight = FontWeight.Bold), modifier = Modifier.padding(top = 16.dp, start = 8.dp))
                    
                    StatProgressCard("Entrenamientos (Objetivo: 4 días)", stats.gymDaysCount / 4f, GymColor, "${stats.gymDaysCount} días")
                    StatProgressCard("Cumplimiento Dieta", stats.mealCompletionRatio, MealColor, "${(stats.mealCompletionRatio * 100).toInt()}%")
                    
                    val budgetRatio = if (stats.savedAmount > 0) 1f else 0f
                    StatProgressCard("Ahorro positivo", budgetRatio, SaveColor, if (stats.savedAmount >= 0) "Sí" else "No")
                }
            }
        }
    }
}

@Composable
fun StreakCard(modifier: Modifier = Modifier, title: String, days: Int, icon: ImageVector, color: Color) {
    Card(
        modifier = modifier.height(130.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = HCard)
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(32.dp).clip(CircleShape).background(color.copy(alpha = 0.2f)), contentAlignment = Alignment.Center) {
                    Icon(icon, null, tint = color, modifier = Modifier.size(16.dp))
                }
                Spacer(Modifier.width(8.dp))
                Text(title, style = MaterialTheme.typography.bodyMedium.copy(color = HMuted, fontWeight = FontWeight.Medium))
            }
            Row(verticalAlignment = Alignment.Bottom) {
                Text(days.toString(), style = MaterialTheme.typography.displaySmall.copy(color = HText, fontWeight = FontWeight.ExtraBold))
                Spacer(Modifier.width(4.dp))
                Text("días", style = MaterialTheme.typography.bodyLarge.copy(color = HMuted), modifier = Modifier.padding(bottom = 6.dp))
            }
        }
    }
}

@Composable
fun StatProgressCard(title: String, ratio: Float, color: Color, label: String) {
    val animatedRatio by animateFloatAsState(targetValue = ratio.coerceIn(0f, 1f), animationSpec = tween(1000))
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = HCard)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(title, style = MaterialTheme.typography.bodyMedium.copy(color = HText))
                Text(label, style = MaterialTheme.typography.bodyMedium.copy(color = color, fontWeight = FontWeight.Bold))
            }
            Spacer(Modifier.height(12.dp))
            Box(modifier = Modifier.fillMaxWidth().height(8.dp).clip(CircleShape).background(color.copy(0.1f))) {
                Box(modifier = Modifier.fillMaxWidth(animatedRatio).fillMaxHeight().clip(CircleShape).background(color))
            }
        }
    }
}
