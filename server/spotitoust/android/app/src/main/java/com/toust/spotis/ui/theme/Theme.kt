package com.toust.spotis.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val SpotisDarkColorScheme = darkColorScheme(
    primary = SpotisGreen,
    onPrimary = SpotisBlack,
    primaryContainer = SpotisGreenAlpha20,
    onPrimaryContainer = SpotisGreenLight,
    secondary = SpotisGray700,
    onSecondary = SpotisWhite,
    secondaryContainer = SpotisDarkCard,
    onSecondaryContainer = SpotisGray200,
    tertiary = SpotisGreenLight,
    onTertiary = SpotisBlack,
    background = SpotisBlack,
    onBackground = SpotisWhite,
    surface = SpotisDarkSurface,
    onSurface = SpotisWhite,
    surfaceVariant = SpotisDarkCard,
    onSurfaceVariant = SpotisGray400,
    outline = SpotisGray700,
    error = SpotisError,
    onError = SpotisWhite,
    errorContainer = SpotisErrorDark,
    onErrorContainer = Color(0xFFFFCDD2),
    inverseSurface = SpotisWhite,
    inverseOnSurface = SpotisBlack,
    scrim = Color(0xB3000000),
)

@Composable
fun SpotisTheme(content: @Composable () -> Unit) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = SpotisBlack.toArgb()
            window.navigationBarColor = SpotisBlack.toArgb()
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = false
                isAppearanceLightNavigationBars = false
            }
        }
    }

    MaterialTheme(
        colorScheme = SpotisDarkColorScheme,
        typography = SpotisTypography,
        content = content
    )
}