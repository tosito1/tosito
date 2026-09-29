package com.toust.spotis.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.auth.FirebaseUser
import com.toust.spotis.data.model.SpotifyProfile
import com.toust.spotis.ui.theme.*
import com.toust.spotis.viewmodel.AuthViewModel

@Composable
fun ProfileScreen(
    authViewModel: AuthViewModel,
    firebaseUser: FirebaseUser?,
    spotifyProfile: SpotifyProfile?
) {
    val uiState by authViewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpotisBlack)
            .verticalScroll(rememberScrollState())
            .windowInsetsPadding(WindowInsets.systemBars)
    ) {
        // Hero Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(220.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            listOf(SpotisGreenAlpha20, SpotisBlack)
                        )
                    )
            )

            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(horizontal = 24.dp, vertical = 20.dp)
            ) {
                // Avatar
                Box(
                    modifier = Modifier
                        .size(90.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(listOf(SpotisGreen, Color(0xFF10B981)))
                        )
                        .border(2.dp, SpotisWhiteAlpha20, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    val avatarUrl = spotifyProfile?.imageUrl?.takeIf { it.isNotEmpty() }
                        ?: firebaseUser?.photoUrl?.toString()?.takeIf { it.isNotEmpty() }
                    if (avatarUrl != null) {
                        AsyncImage(
                            model = avatarUrl,
                            contentDescription = null,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        val initial = spotifyProfile?.initials ?: firebaseUser?.displayName?.firstOrNull()?.uppercase() ?: "S"
                        Text(
                            text = initial,
                            color = SpotisBlack,
                            fontWeight = FontWeight.Black,
                            fontSize = 36.sp
                        )
                    }
                }

                Spacer(Modifier.height(12.dp))

                val displayName = spotifyProfile?.display_name?.takeIf { it.isNotEmpty() }
                    ?: firebaseUser?.displayName ?: "Usuario Spotis"
                Text(
                    text = displayName,
                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black),
                    color = SpotisWhite,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                val subtitle = when {
                    spotifyProfile != null -> "Spotify ${spotifyProfile.product}"
                    firebaseUser?.email != null -> firebaseUser.email ?: ""
                    else -> "Cuenta Spotis"
                }
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = SpotisGray400)
            }
        }

        Spacer(Modifier.height(8.dp))

        // Spotify Link Section
        ProfileSection(title = "Spotify") {
            if (spotifyProfile != null) {
                ProfileInfoRow(icon = Icons.Default.CheckCircle, label = "Cuenta vinculada", value = spotifyProfile.display_name, valueColor = SpotisGreen)
                ProfileInfoRow(icon = Icons.Default.Person, label = "ID", value = spotifyProfile.id)
                ProfileInfoRow(icon = Icons.Default.Email, label = "Email", value = spotifyProfile.email)
                Spacer(Modifier.height(8.dp))
                OutlinedButton(
                    onClick = { authViewModel.disconnectSpotify() },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, SpotisError.copy(alpha = 0.4f)),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = SpotisError)
                ) {
                    Text("Desvincular Spotify", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            } else {
                Text(
                    text = "Vincula tu cuenta de Spotify para acceder a tus playlists, historial y recomendaciones personalizadas.",
                    style = MaterialTheme.typography.bodySmall,
                    color = SpotisGray400,
                    lineHeight = 20.sp
                )
                Spacer(Modifier.height(12.dp))
                Button(
                    onClick = { /* trigger Spotify connect */ },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = SpotisGreen, contentColor = SpotisBlack)
                ) {
                    Icon(Icons.Default.MusicNote, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Vincular Spotify", fontWeight = FontWeight.Bold)
                }
            }
        }

        // Account Section
        if (firebaseUser != null) {
            ProfileSection(title = "Cuenta Spotis") {
                ProfileInfoRow(icon = Icons.Default.Person, label = "Nombre", value = firebaseUser.displayName ?: "—")
                ProfileInfoRow(icon = Icons.Default.Email, label = "Email", value = firebaseUser.email ?: "—")
            }
        }

        // Sign Out Section
        ProfileSection(title = "Sesión") {
            OutlinedButton(
                onClick = { authViewModel.signOut() },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, SpotisWhiteAlpha10),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = SpotisWhite)
            ) {
                Icon(Icons.Default.Logout, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
                Text("Cerrar Sesión", fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }

        Spacer(Modifier.height(120.dp))
    }
}

@Composable
private fun ProfileSection(
    title: String,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
    ) {
        Text(
            text = title.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = SpotisGray500,
            letterSpacing = 1.5.sp,
            modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)
        )
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = SpotisDarkCard,
            border = BorderStroke(1.dp, SpotisWhiteAlpha10),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                content()
            }
        }
    }
}

@Composable
private fun ProfileInfoRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String,
    valueColor: Color = SpotisWhite
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = SpotisGray500, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(10.dp))
        Text(label, style = MaterialTheme.typography.bodySmall, color = SpotisGray400, modifier = Modifier.weight(1f))
        Text(
            text = value,
            style = MaterialTheme.typography.labelMedium,
            color = valueColor,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.widthIn(max = 160.dp)
        )
    }
}
