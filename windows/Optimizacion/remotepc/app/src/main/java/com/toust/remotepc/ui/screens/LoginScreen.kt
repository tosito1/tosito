package com.toust.remotepc.ui.screens

import com.toust.remotepc.ui.theme.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Computer
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.border
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.toust.remotepc.RemoteViewModel



@Composable
fun LoginScreen(viewModel: RemoteViewModel) {
    val uiState  by viewModel.uiState.collectAsState()
    val context  = LocalContext.current

    // Animación de pulso
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.95f, targetValue = 1.05f,
        animationSpec = infiniteRepeatable(animation = tween(2000, easing = EaseInOutSine), repeatMode = RepeatMode.Reverse), label = "scale"
    )

    Box(modifier = Modifier.fillMaxSize().background(BgDark), contentAlignment = Alignment.Center) {
        // Fondos Dinámicos Neon (Mesh Gradient Simulation)
        Box(modifier = Modifier.fillMaxSize()) {
            Box(Modifier.align(Alignment.TopStart).offset(x = (-100).dp, y = (-150).dp).size(400.dp).background(Brush.radialGradient(listOf(AccentPurple.copy(alpha = 0.25f), Color.Transparent)), CircleShape))
            Box(Modifier.align(Alignment.BottomEnd).offset(x = 100.dp, y = 150.dp).size(450.dp).background(Brush.radialGradient(listOf(AccentCyan.copy(alpha = 0.2f), Color.Transparent)), CircleShape))
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(40.dp),
            modifier = Modifier.padding(horizontal = 32.dp)
        ) {
            // Logo flotante brillante
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.scale(scale).size(120.dp).clip(CircleShape)
                    .background(Brush.linearGradient(listOf(AccentBlue, AccentPurple)))
                    .border(1.dp, Color.White.copy(alpha = 0.3f), CircleShape)
            ) {
                Icon(Icons.Default.Computer, contentDescription = null, tint = Color.White, modifier = Modifier.size(60.dp))
            }

            // Textos
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("PC Remoto", fontSize = 38.sp, fontWeight = FontWeight.Black, color = TextPrimary, letterSpacing = (-1).sp)
                Text("El control total de tu estación\nde trabajo desde tu bolsillo", fontSize = 14.sp, color = TextSecondary, textAlign = TextAlign.Center, lineHeight = 20.sp)
            }

            Spacer(Modifier.height(30.dp))

            // Glass Card para el Login
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = GlassCard),
                border = androidx.compose.foundation.BorderStroke(1.dp, GlassBorder),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text("Acceso Encriptado", fontSize = 12.sp, color = TextSecondary, fontWeight = FontWeight.Medium, letterSpacing = 1.sp)

                    Button(
                        onClick = { viewModel.signIn(context) },
                        enabled = !uiState.isLoading,
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.White,
                            disabledContainerColor = Color.White.copy(alpha = 0.4f)
                        )
                    ) {
                        if (uiState.isLoading) {
                            CircularProgressIndicator(color = BgDark, modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                        } else {
                            Text("Continuar con Google", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = BgDark)
                        }
                    }

                    // Error
                    uiState.errorMessage?.let { err ->
                        Text(text = err, color = RedError, fontSize = 13.sp, textAlign = TextAlign.Center)
                    }
                }
            }
        }
    }
}
