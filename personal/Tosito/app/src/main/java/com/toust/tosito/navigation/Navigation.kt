package com.toust.tosito.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material.icons.filled.Savings
import androidx.compose.material.icons.filled.Person
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Home : Screen("home", "Inicio", Icons.Default.Home)
    object Calendar : Screen("calendar", "Calendario", Icons.Default.CalendarToday)
    object Gym : Screen("gym", "Gym", Icons.Default.FitnessCenter)
    object Meals : Screen("meals", "Comidas", Icons.Default.Restaurant)
    object Savings : Screen("savings", "Ahorros", Icons.Default.Savings)
    object Login : Screen("login", "Acceso", Icons.Default.Home)
    object Profile : Screen("profile", "Perfil", Icons.Default.Person)
    object Analytics : Screen("analytics", "Estadísticas", Icons.Default.FitnessCenter)
}

val bottomNavItems = listOf(
    Screen.Home,
    Screen.Calendar,
    Screen.Gym,
    Screen.Meals,
    Screen.Savings
)
