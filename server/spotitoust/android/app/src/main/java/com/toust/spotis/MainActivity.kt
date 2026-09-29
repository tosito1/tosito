package com.toust.spotis

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.*
import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import coil.compose.AsyncImage
import com.toust.spotis.data.local.PreferencesManager
import com.toust.spotis.data.repository.*
import com.toust.spotis.ui.screens.*
import com.toust.spotis.ui.theme.*
import com.toust.spotis.viewmodel.*

class MainActivity : ComponentActivity() {

    private val prefs by lazy { PreferencesManager(applicationContext) }
    private val authRepo by lazy { AuthRepository() }
    private val spotifyRepo by lazy { SpotifyRepository(prefs) }
    private val trackRepo by lazy { TrackRepository() }
    private val playlistRepo by lazy { PlaylistRepository() }
    private val itunesRepo by lazy { ITunesRepository() }

    private val authViewModel by lazy {
        ViewModelProvider(this, object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T =
                AuthViewModel(authRepo, spotifyRepo, prefs) as T
        })[AuthViewModel::class.java]
    }

    private val playerViewModel by lazy {
        ViewModelProvider(this, object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T =
                PlayerViewModel(applicationContext, prefs) as T
        })[PlayerViewModel::class.java]
    }

    private val mainViewModel by lazy {
        ViewModelProvider(this, object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T =
                MainViewModel(playlistRepo, trackRepo, spotifyRepo, itunesRepo) as T
        })[MainViewModel::class.java]
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Request notification permissions for Android 13+ (Required for MediaSessionService)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 0)
        }
        
        enableEdgeToEdge()
        handleIntent(intent)

        setContent {
            SpotisTheme {
                SpotisApp(
                    authViewModel = authViewModel,
                    playerViewModel = playerViewModel,
                    mainViewModel = mainViewModel
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        val data = intent?.data ?: return
        if (data.scheme == "spotis" && data.host == "callback") {
            val code = data.getQueryParameter("code")
            if (!code.isNullOrEmpty()) {
                authViewModel.handleSpotifyCallback(code)
            }
        }
    }
}

// ─── Root App Composable ──────────────────────────────────────────────────────

@Composable
fun SpotisApp(
    authViewModel: AuthViewModel,
    playerViewModel: PlayerViewModel,
    mainViewModel: MainViewModel
) {
    val authState by authViewModel.uiState.collectAsState()
    val playerState by playerViewModel.uiState.collectAsState()
    val mainState by mainViewModel.uiState.collectAsState()
    var isFullScreenPlayer by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {

        when {
            // Checking session
            authState.isCheckingSession -> SpotisLoadingScreen()

            // Not authenticated
            !authState.isAuthenticated -> LoginScreen(viewModel = authViewModel)

            // Authenticated
            else -> {
                val userId = authState.firebaseUser?.uid ?: "spotify_user"
                MainNavigation(
                    authViewModel = authViewModel,
                    playerViewModel = playerViewModel,
                    mainViewModel = mainViewModel,
                    userId = userId,
                    authState = authState,
                    onExpandPlayer = { isFullScreenPlayer = true }
                )
            }
        }

        // Global Notification Toast
        AnimatedVisibility(
            visible = mainState.notification != null,
            enter = slideInVertically(initialOffsetY = { -it }) + fadeIn(),
            exit = slideOutVertically(targetOffsetY = { -it }) + fadeOut(),
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 60.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(50.dp),
                color = SpotisDarkCard,
                border = androidx.compose.foundation.BorderStroke(1.dp, SpotisWhiteAlpha20),
                shadowElevation = 8.dp
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .background(SpotisGreen, CircleShape)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = mainState.notification ?: "",
                        style = MaterialTheme.typography.labelMedium,
                        color = SpotisWhite
                    )
                }
            }
        }

        // Full Screen Player Overlay
        AnimatedVisibility(
            visible = isFullScreenPlayer && playerState.currentTrack != null,
            enter = slideInVertically(initialOffsetY = { it }),
            exit = slideOutVertically(targetOffsetY = { it }),
            modifier = Modifier.fillMaxSize()
        ) {
            FullScreenPlayer(
                viewModel = playerViewModel,
                onDismiss = { isFullScreenPlayer = false }
            )
        }
    }
}

// ─── Main Navigation with Bottom Nav ─────────────────────────────────────────

sealed class Screen(val route: String, val label: String, val icon: ImageVector) {
    object Discover : Screen("discover", "Inicio", Icons.Default.Home)
    object Playlists : Screen("playlists", "Listas", Icons.Default.QueueMusic)
    object Favorites : Screen("favorites", "Favoritos", Icons.Default.Favorite)
    object Profile : Screen("profile", "Perfil", Icons.Default.Person)
}

@Composable
fun MainNavigation(
    authViewModel: AuthViewModel,
    playerViewModel: PlayerViewModel,
    mainViewModel: MainViewModel,
    userId: String,
    authState: AuthUiState,
    onExpandPlayer: () -> Unit
) {
    val navController = rememberNavController()
    val navBackStack by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStack?.destination?.route
    val playerState by playerViewModel.uiState.collectAsState()

    val screens = listOf(Screen.Discover, Screen.Playlists, Screen.Favorites, Screen.Profile)

    Scaffold(
        containerColor = SpotisBlack,
        bottomBar = {
            Column {
                // Mini Player
                AnimatedVisibility(
                    visible = playerState.currentTrack != null,
                    enter = slideInVertically(initialOffsetY = { it }),
                    exit = slideOutVertically(targetOffsetY = { it })
                ) {
                    MiniPlayer(viewModel = playerViewModel, onExpand = onExpandPlayer)
                }

                // Bottom Navigation Bar
                NavigationBar(
                    containerColor = SpotisDarkPanel.copy(alpha = 0.95f),
                    tonalElevation = 0.dp,
                    modifier = Modifier.height(80.dp)
                ) {
                    screens.forEach { screen ->
                        val selected = currentRoute == screen.route
                        if (screen == Screen.Profile) {
                            ProfileNavItem(
                                selected = selected,
                                spotifyProfile = authState.spotifyProfile,
                                firebaseUser = authState.firebaseUser,
                                onClick = { navController.navigate(screen.route) { launchSingleTop = true } }
                            )
                        } else {
                            NavigationBarItem(
                                selected = selected,
                                onClick = { navController.navigate(screen.route) { launchSingleTop = true } },
                                icon = {
                                    Icon(
                                        screen.icon,
                                        contentDescription = screen.label,
                                        modifier = Modifier.size(24.dp)
                                    )
                                },
                                label = {
                                    AnimatedVisibility(visible = selected) {
                                        Text(screen.label, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = SpotisGreen,
                                    selectedTextColor = SpotisWhite,
                                    unselectedIconColor = SpotisGray500,
                                    indicatorColor = SpotisGreenAlpha10
                                )
                            )
                        }
                    }
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Discover.route,
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            composable(Screen.Discover.route) {
                DiscoverScreen(mainViewModel, playerViewModel, userId)
            }
            composable(Screen.Playlists.route) {
                PlaylistsScreen(mainViewModel, playerViewModel, userId)
            }
            composable(Screen.Favorites.route) {
                FavoritesScreen(mainViewModel, playerViewModel, userId)
            }
            composable(Screen.Profile.route) {
                ProfileScreen(authViewModel, authState.firebaseUser, authState.spotifyProfile)
            }
        }
    }
}

@Composable
private fun RowScope.ProfileNavItem(
    selected: Boolean,
    spotifyProfile: com.toust.spotis.data.model.SpotifyProfile?,
    firebaseUser: com.google.firebase.auth.FirebaseUser?,
    onClick: () -> Unit
) {
    NavigationBarItem(
        selected = selected,
        onClick = onClick,
        icon = {
            val avatarUrl = spotifyProfile?.imageUrl?.takeIf { it.isNotEmpty() }
                ?: firebaseUser?.photoUrl?.toString()?.takeIf { it.isNotEmpty() }
            if (avatarUrl != null) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(SpotisDarkCard)
                        .then(
                            if (selected) Modifier.clip(CircleShape)
                                .background(SpotisGreenAlpha30)
                            else Modifier
                        )
                ) {
                    AsyncImage(
                        model = avatarUrl,
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            } else {
                val initial = spotifyProfile?.initials
                    ?: firebaseUser?.displayName?.firstOrNull()?.uppercase()
                    ?: "S"
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(if (selected) SpotisGreen else SpotisDarkCard),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        initial,
                        color = if (selected) SpotisBlack else SpotisGray400,
                        fontWeight = FontWeight.Black,
                        fontSize = 12.sp
                    )
                }
            }
        },
        label = {
            AnimatedVisibility(visible = selected) {
                Text("Perfil", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = SpotisWhite)
            }
        },
        colors = NavigationBarItemDefaults.colors(
            selectedTextColor = SpotisWhite,
            unselectedIconColor = SpotisGray500,
            indicatorColor = Color.Transparent
        )
    )
}

// ─── Loading Screen ───────────────────────────────────────────────────────────

@Composable
fun SpotisLoadingScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SpotisBlack),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(contentAlignment = Alignment.Center) {
                CircularProgressIndicator(
                    modifier = Modifier.size(64.dp),
                    color = SpotisGreen,
                    strokeWidth = 2.dp,
                    trackColor = SpotisWhiteAlpha10
                )
                Text("S", color = SpotisGreen, fontWeight = FontWeight.Black, fontSize = 24.sp)
            }
            Spacer(Modifier.height(20.dp))
            Text(
                "SPOTIS",
                color = SpotisWhite,
                fontWeight = FontWeight.Black,
                letterSpacing = 6.sp,
                fontSize = 14.sp
            )
            Spacer(Modifier.height(4.dp))
            Text(
                "Cargando tu sesión...",
                color = SpotisGray500,
                fontSize = 11.sp
            )
        }
    }
}