package com.toust.spotis.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.pager.*
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
import com.toust.spotis.data.model.Album
import com.toust.spotis.data.model.Artist
import com.toust.spotis.data.model.Playlist
import com.toust.spotis.data.model.Track
import com.toust.spotis.ui.theme.*
import com.toust.spotis.viewmodel.MainViewModel
import com.toust.spotis.viewmodel.PlayerViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiscoverScreen(
    mainViewModel: MainViewModel,
    playerViewModel: PlayerViewModel,
    userId: String
) {
    val uiState by mainViewModel.uiState.collectAsState()
    val playerState by playerViewModel.uiState.collectAsState()
    val scope = rememberCoroutineScope()
    var searchQuery by remember { mutableStateOf("") }
    var searchJob by remember { mutableStateOf<Job?>(null) }

    LaunchedEffect(userId) {
        mainViewModel.init(userId)
        mainViewModel.loadTopTracks()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpotisBlack)
    ) {
        // Top Search Bar & Tabs
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.verticalGradient(listOf(SpotisDarkPanel, Color.Transparent)))
                .padding(top = 12.dp)
                .windowInsetsPadding(WindowInsets.statusBars)
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { query ->
                    searchQuery = query
                    searchJob?.cancel()
                    searchJob = scope.launch {
                        delay(400)
                        if (query.isNotBlank()) mainViewModel.searchTracks(query)
                        else mainViewModel.clearSearch()
                    }
                },
                placeholder = { Text("Buscar canciones, artistas, álbumes...", color = SpotisGray700, fontSize = 14.sp) },
                leadingIcon = {
                    if (uiState.isSearching) CircularProgressIndicator(modifier = Modifier.size(18.dp), color = SpotisGreen, strokeWidth = 2.dp)
                    else Icon(Icons.Default.Search, contentDescription = null, tint = SpotisGray500)
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = ""; mainViewModel.clearSearch() }) {
                            Icon(Icons.Default.Close, contentDescription = null, tint = SpotisGray400)
                        }
                    }
                },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = SpotisWhite, unfocusedTextColor = SpotisWhite,
                    focusedBorderColor = SpotisGreen.copy(alpha = 0.5f), unfocusedBorderColor = SpotisWhiteAlpha10,
                    cursorColor = SpotisGreen, focusedContainerColor = SpotisDarkCard, unfocusedContainerColor = SpotisDarkCard
                )
            )

            // Search Tabs (only visible when searching)
            if (searchQuery.isNotEmpty()) {
                SearchTabsRow(
                    activeTab = uiState.searchActiveTab,
                    onTabSelect = { mainViewModel.setSearchTab(it) }
                )
            }
            Spacer(Modifier.height(12.dp))
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 160.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            if (searchQuery.isNotEmpty()) {
                when (uiState.searchActiveTab) {
                    "all" -> {
                        if (uiState.searchResults.isNotEmpty()) {
                            item { SectionHeader(title = "Mejor resultado", icon = Icons.Default.Star) }
                            item {
                                val topTrack = uiState.searchResults.first()
                                BestMatchCard(
                                    track = topTrack,
                                    onClick = { playerViewModel.playTrack(topTrack, uiState.searchResults) }
                                )
                            }
                            item { SectionHeader(title = "Canciones", icon = Icons.Default.MusicNote) }
                            items(uiState.searchResults.take(4), key = { "search_trk_${it.id}" }) { track ->
                                TrackRow(
                                    track = track,
                                    isPlaying = playerState.currentTrack?.id == track.id && playerState.isPlaying,
                                    isFavorite = mainViewModel.isFavorite(track.id),
                                    onPlay = { playerViewModel.playTrack(track, uiState.searchResults) },
                                    onFavorite = { mainViewModel.toggleFavorite(userId, track) }
                                )
                            }
                        }
                        if (uiState.searchArtists.isNotEmpty()) {
                            item {
                                SectionHeader(title = "Artistas", icon = Icons.Default.Person)
                                LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                    items(uiState.searchArtists) { artist ->
                                        ArtistCard(artist = artist, onClick = { searchQuery = artist.name; mainViewModel.setSearchTab("all"); mainViewModel.searchTracks(artist.name) })
                                    }
                                }
                            }
                        }
                        if (uiState.searchAlbums.isNotEmpty()) {
                            item {
                                SectionHeader(title = "Álbumes", icon = Icons.Default.Album)
                                LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                    items(uiState.searchAlbums) { album ->
                                        AlbumCard(album = album, onClick = { })
                                    }
                                }
                            }
                        }
                    }
                    "tracks" -> {
                        item { SectionHeader(title = "Canciones", icon = Icons.Default.MusicNote) }
                        items(uiState.searchResults, key = { "trk_${it.id}" }) { track ->
                            TrackRow(
                                track = track,
                                isPlaying = playerState.currentTrack?.id == track.id && playerState.isPlaying,
                                isFavorite = mainViewModel.isFavorite(track.id),
                                onPlay = { playerViewModel.playTrack(track, uiState.searchResults) },
                                onFavorite = { mainViewModel.toggleFavorite(userId, track) }
                            )
                        }
                    }
                    "artists" -> {
                        item { SectionHeader(title = "Artistas", icon = Icons.Default.Person) }
                        item {
                            FlowRow(modifier = Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                uiState.searchArtists.forEach { artist ->
                                    ArtistCard(artist = artist, onClick = { searchQuery = artist.name; mainViewModel.setSearchTab("all"); mainViewModel.searchTracks(artist.name) })
                                }
                            }
                        }
                    }
                    "albums" -> {
                        item { SectionHeader(title = "Álbumes", icon = Icons.Default.Album) }
                        item {
                            FlowRow(modifier = Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                uiState.searchAlbums.forEach { album ->
                                    AlbumCard(album = album, onClick = {})
                                }
                            }
                        }
                    }
                    "playlists" -> {
                        item { SectionHeader(title = "Playlists", icon = Icons.Default.QueueMusic) }
                        item {
                            FlowRow(modifier = Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                uiState.searchPlaylists.forEach { playlist ->
                                    PlaylistCard(playlist = playlist, onClick = {})
                                }
                            }
                        }
                    }
                }
            } else {
                
                // 1. Hero Carousel (Global Hits)
                if (uiState.globalHits.isNotEmpty()) {
                    item {
                        HeroCarousel(
                            tracks = uiState.globalHits.take(5),
                            onPlay = { track, index -> playerViewModel.playTrack(track, uiState.globalHits.take(5)) }
                        )
                    }
                }

                // 2. Playlists Row
                if (uiState.playlists.isNotEmpty()) {
                    item {
                        SectionHeader(title = "Tus Playlists", icon = Icons.Default.QueueMusic)
                        LazyRow(
                            contentPadding = PaddingValues(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(uiState.playlists, key = { it.id }) { playlist ->
                                PlaylistCard(playlist = playlist, onClick = {
                                    playlist.tracks.firstOrNull()?.let { track -> playerViewModel.playTrack(track, playlist.tracks) }
                                })
                            }
                        }
                    }
                }

                // 3. Tus Top Canciones (Spotify Personalized - si hay sesión de Spotify)
                if (uiState.topTracks.isNotEmpty()) {
                    item { SectionHeader(title = "Tus Top Canciones", icon = Icons.Default.Star) }
                    items(uiState.topTracks.take(5), key = { "top_${it.id}" }) { track ->
                        TrackRow(
                            track = track,
                            isPlaying = playerState.currentTrack?.id == track.id && playerState.isPlaying,
                            isFavorite = mainViewModel.isFavorite(track.id),
                            onPlay = { playerViewModel.playTrack(track, uiState.topTracks) },
                            onFavorite = { mainViewModel.toggleFavorite(userId, track) }
                        )
                    }
                }

                // 4. Aterrizaje Rápido (Quick Play Grid)
                if (uiState.globalHits.size > 5) {
                    item {
                        SectionHeader(title = "Aterrizaje Rápido", icon = Icons.Default.Bolt)
                        QuickPlayGrid(
                            tracks = uiState.globalHits.drop(5).take(4),
                            onPlay = { track -> playerViewModel.playTrack(track, uiState.globalHits.drop(5).take(4)) }
                        )
                    }
                }

                // 5. Horizontal Slider: Éxitos Latino
                if (uiState.latinHits.isNotEmpty()) {
                    item {
                        SectionHeader(title = "Éxitos Latino", icon = Icons.Default.LocalFireDepartment)
                        HorizontalTrackSlider(
                            tracks = uiState.latinHits,
                            onPlay = { track -> playerViewModel.playTrack(track, uiState.latinHits) }
                        )
                    }
                }

                // 6. Horizontal Slider: Relax & Chill Vibes
                if (uiState.chillHits.isNotEmpty()) {
                    item {
                        SectionHeader(title = "Relax & Chill Vibes", icon = Icons.Default.NightlightRound)
                        HorizontalTrackSlider(
                            tracks = uiState.chillHits,
                            onPlay = { track -> playerViewModel.playTrack(track, uiState.chillHits) }
                        )
                    }
                }

                // 7. Workout Energy (Horizontal Grid)
                if (uiState.workoutHits.isNotEmpty()) {
                    item {
                        SectionHeader(title = "Workout Energy", icon = Icons.Default.FitnessCenter)
                        HorizontalTrackSlider(
                            tracks = uiState.workoutHits,
                            onPlay = { track -> playerViewModel.playTrack(track, uiState.workoutHits) }
                        )
                    }
                }

                // 8. Navegar por Géneros
                item {
                    SectionHeader(title = "Navegar por géneros", icon = Icons.Default.Category)
                    GenreGrid(
                        onGenreClick = { genre -> 
                            searchQuery = genre
                            mainViewModel.searchTracks(genre)
                        }
                    )
                }
            }
        }
    }
}

// ─── Componentes Visuales ────────────────────────────────────────────────────────

@Composable
fun SearchTabsRow(activeTab: String, onTabSelect: (String) -> Unit) {
    val tabs = listOf(
        "all" to "Todos",
        "tracks" to "Canciones",
        "artists" to "Artistas",
        "albums" to "Álbumes",
        "playlists" to "Playlists"
    )
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(tabs) { (id, label) ->
            val isActive = activeTab == id
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(32.dp))
                    .background(if (isActive) SpotisWhite else SpotisDarkCard)
                    .border(1.dp, if (isActive) Color.Transparent else SpotisWhiteAlpha20, RoundedCornerShape(32.dp))
                    .clickable { onTabSelect(id) }
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Text(
                    text = label,
                    color = if (isActive) SpotisBlack else SpotisWhite,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }
        }
    }
}

@Composable
fun BestMatchCard(track: Track, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(SpotisDarkCard)
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        AsyncImage(
            model = track.albumArt,
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(80.dp)
                .clip(CircleShape)
        )
        Spacer(Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = track.title,
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black),
                color = SpotisWhite,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = "Canción • ${track.artist}",
                style = MaterialTheme.typography.bodyMedium,
                color = SpotisGray400,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
        Box(modifier = Modifier.size(48.dp).background(SpotisGreen, CircleShape), contentAlignment = Alignment.Center) {
            Icon(Icons.Default.PlayArrow, contentDescription = null, tint = SpotisBlack)
        }
    }
}

@Composable
fun ArtistCard(artist: Artist, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(120.dp)
            .clickable { onClick() },
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        AsyncImage(
            model = artist.coverUrl,
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(120.dp)
                .clip(CircleShape)
                .background(SpotisDarkCard)
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = artist.name,
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
            color = SpotisWhite,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        Text(
            text = "Artista",
            style = MaterialTheme.typography.labelSmall,
            color = SpotisGray500
        )
    }
}

@Composable
fun AlbumCard(album: Album, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(140.dp)
            .clickable { onClick() }
    ) {
        AsyncImage(
            model = album.coverUrl,
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(140.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(SpotisDarkCard)
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = album.name,
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
            color = SpotisWhite,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        Text(
            text = "Álbum • ${album.artist}",
            style = MaterialTheme.typography.labelSmall,
            color = SpotisGray500,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun HeroCarousel(tracks: List<Track>, onPlay: (Track, Int) -> Unit) {
    val pagerState = rememberPagerState(pageCount = { tracks.size })
    
    HorizontalPager(
        state = pagerState,
        contentPadding = PaddingValues(horizontal = 32.dp),
        pageSpacing = 16.dp,
        modifier = Modifier
            .fillMaxWidth()
            .height(260.dp)
            .padding(top = 16.dp)
    ) { page ->
        val track = tracks[page]
        Box(
            modifier = Modifier
                .fillMaxSize()
                .clip(RoundedCornerShape(24.dp))
                .clickable { onPlay(track, page) }
        ) {
            AsyncImage(
                model = track.albumArt,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
            // Gradient Overlay
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.8f)),
                        startY = 100f
                    ))
            )
            // Content
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(16.dp)
            ) {
                Text(
                    text = "RECOMENDADO PARA TI",
                    style = MaterialTheme.typography.labelSmall,
                    color = SpotisGreen,
                    fontWeight = FontWeight.Bold
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = track.title,
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black),
                    color = SpotisWhite,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = track.artist,
                    style = MaterialTheme.typography.bodyMedium,
                    color = SpotisGray400,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            
            // Play Button Icon
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp)
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(SpotisGreen),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = null, tint = SpotisBlack, modifier = Modifier.size(28.dp))
            }
        }
    }
}

@Composable
fun QuickPlayGrid(tracks: List<Track>, onPlay: (Track) -> Unit) {
    Column(
        modifier = Modifier.padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        val rows = tracks.chunked(2)
        rows.forEach { rowTracks ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                rowTracks.forEach { track ->
                    Row(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(SpotisDarkCard)
                            .clickable { onPlay(track) }
                            .padding(end = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        AsyncImage(
                            model = track.albumArt,
                            contentDescription = null,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.size(56.dp)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = track.title,
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = SpotisWhite,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
                if (rowTracks.size == 1) Spacer(Modifier.weight(1f))
            }
        }
    }
}

@Composable
fun HorizontalTrackSlider(tracks: List<Track>, onPlay: (Track) -> Unit) {
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(tracks, key = { it.id }) { track ->
            Column(
                modifier = Modifier
                    .width(140.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .clickable { onPlay(track) }
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(SpotisDarkCard)
                ) {
                    AsyncImage(
                        model = track.albumArt,
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }
                Spacer(Modifier.height(8.dp))
                Text(
                    text = track.title,
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                    color = SpotisWhite,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = track.artist,
                    style = MaterialTheme.typography.labelSmall,
                    color = SpotisGray500,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun GenreGrid(onGenreClick: (String) -> Unit) {
    val genres = listOf("Pop", "Hip Hop", "Rock", "Electrónica", "Jazz", "Indie", "Reggaeton", "Metal")
    val colors = listOf(Color(0xFFE13300), Color(0xFF7358FF), Color(0xFF1DB954), Color(0xFFE91429), Color(0xFF777777), Color(0xFF509BF5), Color(0xFFFF4632), Color(0xFF1E3264))

    Column(
        modifier = Modifier.padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        val rows = genres.zip(colors).chunked(2)
        rows.forEach { rowItems ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                rowItems.forEach { (genre, color) ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(80.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(color)
                            .clickable { onGenreClick(genre) }
                            .padding(16.dp),
                        contentAlignment = Alignment.TopStart
                    ) {
                        Text(
                            text = genre,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black),
                            color = SpotisWhite
                        )
                    }
                }
                if (rowItems.size == 1) Spacer(Modifier.weight(1f))
            }
        }
    }
}

@Composable
fun SectionHeader(title: String, icon: androidx.compose.ui.graphics.vector.ImageVector? = null, modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier.padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        if (icon != null) {
            Icon(icon, contentDescription = null, tint = SpotisGreen, modifier = Modifier.size(24.dp))
            Spacer(Modifier.width(8.dp))
        }
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black),
            color = SpotisWhite
        )
    }
}

@Composable
fun TrackRow(
    track: Track,
    isPlaying: Boolean,
    isFavorite: Boolean,
    onPlay: () -> Unit,
    onFavorite: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onPlay() }
            .background(if (isPlaying) SpotisGreenAlpha10 else Color.Transparent)
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(SpotisDarkCard)
        ) {
            if (track.albumArt.isNotEmpty()) {
                AsyncImage(model = track.albumArt, contentDescription = null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
            } else {
                Icon(Icons.Default.MusicNote, contentDescription = null, tint = SpotisGray700, modifier = Modifier.fillMaxSize().padding(12.dp))
            }
            if (isPlaying) {
                Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.5f)), contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.VolumeUp, contentDescription = null, tint = SpotisGreen, modifier = Modifier.size(20.dp))
                }
            }
        }

        Spacer(Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(text = track.title, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold), color = if (isPlaying) SpotisGreen else SpotisWhite, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(text = track.artist, style = MaterialTheme.typography.bodySmall, color = SpotisGray400, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }

        Text(text = track.durationFormatted, style = MaterialTheme.typography.labelSmall, color = SpotisGray500, modifier = Modifier.padding(horizontal = 8.dp))

        IconButton(onClick = onFavorite, modifier = Modifier.size(36.dp)) {
            Icon(imageVector = if (isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder, contentDescription = null, tint = if (isFavorite) SpotisGreen else SpotisGray500, modifier = Modifier.size(18.dp))
        }
    }
}

@Composable
fun PlaylistCard(playlist: Playlist, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(140.dp)
            .clickable { onClick() }
            .padding(bottom = 4.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(140.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(SpotisDarkCard)
        ) {
            val coverUrl = playlist.coverUrl.takeIf { it.isNotEmpty() } ?: playlist.tracks.firstOrNull()?.albumArt ?: ""
            if (coverUrl.isNotEmpty()) {
                AsyncImage(model = coverUrl, contentDescription = null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
            } else {
                Icon(Icons.Default.QueueMusic, contentDescription = null, tint = SpotisGray700, modifier = Modifier.fillMaxSize().padding(32.dp))
            }
        }
        Spacer(Modifier.height(6.dp))
        Text(text = playlist.name, style = MaterialTheme.typography.labelMedium, color = SpotisWhite, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(text = "${playlist.trackCount} canciones", style = MaterialTheme.typography.labelSmall, color = SpotisGray500)
    }
}
