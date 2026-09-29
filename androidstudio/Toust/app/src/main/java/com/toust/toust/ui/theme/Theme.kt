package com.toust.toust.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val AppColorScheme = darkColorScheme(
    primary          = Color(0xFF4F8EF7),
    secondary        = Color(0xFF9B59F5),
    tertiary         = Color(0xFF00D4FF),
    background       = Color(0xFF0D0F1A),
    surface          = Color(0xFF161829),
    onPrimary        = Color.White,
    onSecondary      = Color.White,
    onBackground     = Color(0xFFEEF0FF),
    onSurface        = Color(0xFFEEF0FF),
)

@Composable
fun ToustTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = AppColorScheme,
        typography  = Typography,
        content     = content
    )
}