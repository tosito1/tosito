package com.toust.spotis.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.toust.spotis.ui.theme.*
import com.toust.spotis.viewmodel.MainViewModel
import com.toust.spotis.viewmodel.PlayerViewModel

@Composable
fun PlaylistsScreen(
    mainViewModel: MainViewModel,
    playerViewModel: PlayerViewModel,
    userId: String
) {
    val uiState by mainViewModel.uiState.collectAsState()
    val playerState by playerViewModel.uiState.collectAsState()
    var showCreateDialog by remember { mutableStateOf(false) }
    var newPlaylistName by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpotisBlack)
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 20.dp)
                .windowInsetsPadding(WindowInsets.statusBars),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "Tu Colección",
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black),
                color = SpotisWhite
            )
            IconButton(
                onClick = { showCreateDialog = true },
                modifier = Modifier
                    .size(40.dp)
                    .background(SpotisGreen, RoundedCornerShape(12.dp))
            ) {
                Icon(Icons.Default.Add, contentDescription = "Nueva playlist", tint = SpotisBlack)
            }
        }

        if (uiState.playlists.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.QueueMusic, contentDescription = null, tint = SpotisGray700, modifier = Modifier.size(72.dp))
                    Spacer(Modifier.height(16.dp))
                    Text("Aún no hay playlists", style = MaterialTheme.typography.bodyLarge, color = SpotisGray500)
                    Spacer(Modifier.height(8.dp))
                    Button(
                        onClick = { showCreateDialog = true },
                        colors = ButtonDefaults.buttonColors(containerColor = SpotisGreen, contentColor = SpotisBlack)
                    ) {
                        Text("Crear playlist", fontWeight = FontWeight.Bold)
                    }
                }
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(bottom = 160.dp),
                verticalArrangement = Arrangement.spacedBy(1.dp)
            ) {
                items(uiState.playlists, key = { it.id }) { playlist ->
                    PlaylistRow(
                        name = playlist.name,
                        trackCount = playlist.trackCount,
                        coverUrl = playlist.tracks.firstOrNull()?.albumArt ?: "",
                        isPlaying = playlist.tracks.any { it.id == playerState.currentTrack?.id } && playerState.isPlaying,
                        onPlay = {
                            playlist.tracks.firstOrNull()?.let { track ->
                                playerViewModel.playTrack(track, playlist.tracks)
                            }
                        },
                        onDelete = { mainViewModel.deletePlaylist(userId, playlist.id) }
                    )
                }
            }
        }
    }

    // Create Playlist Dialog
    if (showCreateDialog) {
        AlertDialog(
            onDismissRequest = { showCreateDialog = false; newPlaylistName = "" },
            containerColor = SpotisDarkPanel,
            shape = RoundedCornerShape(20.dp),
            title = {
                Text("Nueva Playlist", color = SpotisWhite, fontWeight = FontWeight.Black)
            },
            text = {
                OutlinedTextField(
                    value = newPlaylistName,
                    onValueChange = { newPlaylistName = it },
                    placeholder = { Text("Nombre de la playlist", color = SpotisGray700) },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = SpotisWhite,
                        unfocusedTextColor = SpotisWhite,
                        focusedBorderColor = SpotisGreen.copy(alpha = 0.5f),
                        unfocusedBorderColor = SpotisWhiteAlpha10,
                        cursorColor = SpotisGreen,
                        focusedContainerColor = SpotisWhiteAlpha10,
                        unfocusedContainerColor = SpotisWhiteAlpha10
                    )
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newPlaylistName.isNotBlank()) {
                            mainViewModel.createPlaylist(userId, newPlaylistName)
                            showCreateDialog = false
                            newPlaylistName = ""
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SpotisGreen, contentColor = SpotisBlack)
                ) {
                    Text("Crear", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateDialog = false; newPlaylistName = "" }) {
                    Text("Cancelar", color = SpotisGray400)
                }
            }
        )
    }
}

@Composable
fun FavoritesScreen(
    mainViewModel: MainViewModel,
    playerViewModel: PlayerViewModel,
    userId: String
) {
    val uiState by mainViewModel.uiState.collectAsState()
    val playerState by playerViewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpotisBlack)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 20.dp)
                .windowInsetsPadding(WindowInsets.statusBars),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "Favoritos",
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black),
                color = SpotisWhite
            )
            if (uiState.favorites.isNotEmpty()) {
                IconButton(
                    onClick = {
                        uiState.favorites.firstOrNull()?.let { track ->
                            playerViewModel.playTrack(track, uiState.favorites)
                        }
                    },
                    modifier = Modifier
                        .size(40.dp)
                        .background(SpotisGreen, RoundedCornerShape(12.dp))
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null, tint = SpotisBlack)
                }
            }
        }

        if (uiState.favorites.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.FavoriteBorder, contentDescription = null, tint = SpotisGray700, modifier = Modifier.size(72.dp))
                    Spacer(Modifier.height(16.dp))
                    Text("Aún no hay favoritos", style = MaterialTheme.typography.bodyLarge, color = SpotisGray500)
                    Spacer(Modifier.height(4.dp))
                    Text("Pulsa ♥ en cualquier canción", style = MaterialTheme.typography.bodySmall, color = SpotisGray700)
                }
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(bottom = 160.dp)
            ) {
                items(uiState.favorites, key = { it.id }) { track ->
                    TrackRow(
                        track = track,
                        isPlaying = playerState.currentTrack?.id == track.id && playerState.isPlaying,
                        isFavorite = true,
                        onPlay = { playerViewModel.playTrack(track, uiState.favorites) },
                        onFavorite = { mainViewModel.toggleFavorite(userId, track) }
                    )
                }
            }
        }
    }
}

@Composable
private fun PlaylistRow(
    name: String,
    trackCount: Int,
    coverUrl: String,
    isPlaying: Boolean,
    onPlay: () -> Unit,
    onDelete: () -> Unit
) {
    var showMenu by remember { mutableStateOf(false) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onPlay() }
            .background(if (isPlaying) SpotisGreenAlpha10 else Color.Transparent)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .background(SpotisDarkCard, RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.QueueMusic, contentDescription = null, tint = SpotisGray700, modifier = Modifier.size(28.dp))
        }
        Spacer(Modifier.width(14.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = name,
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                color = if (isPlaying) SpotisGreen else SpotisWhite,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = "$trackCount canciones",
                style = MaterialTheme.typography.bodySmall,
                color = SpotisGray500
            )
        }
        Box {
            IconButton(onClick = { showMenu = true }) {
                Icon(Icons.Default.MoreVert, contentDescription = null, tint = SpotisGray400)
            }
            DropdownMenu(
                expanded = showMenu,
                onDismissRequest = { showMenu = false },
                containerColor = SpotisDarkPanel
            ) {
                DropdownMenuItem(
                    text = { Text("Eliminar", color = SpotisError) },
                    onClick = { showMenu = false; onDelete() },
                    leadingIcon = { Icon(Icons.Default.Delete, contentDescription = null, tint = SpotisError) }
                )
            }
        }
    }
}
