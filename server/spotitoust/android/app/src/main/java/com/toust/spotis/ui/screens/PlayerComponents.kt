package com.toust.spotis.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.view.ViewGroup
import coil.compose.AsyncImage
import com.toust.spotis.ui.theme.*
import com.toust.spotis.viewmodel.PlayerUiState
import com.toust.spotis.viewmodel.PlayerViewModel

// ─── Mini Player (Persistent bottom bar) ─────────────────────────────────────

@Composable
fun MiniPlayer(
    viewModel: PlayerViewModel,
    onExpand: () -> Unit,
    modifier: Modifier = Modifier
) {
    val state by viewModel.uiState.collectAsState()
    val track = state.currentTrack ?: return

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(72.dp)
            .background(SpotisDarkPanel.copy(alpha = 0.96f))
            .clickable { onExpand() }
    ) {
        // Progress line at top
        LinearProgressIndicator(
            progress = { state.progress },
            modifier = Modifier
                .fillMaxWidth()
                .height(2.dp)
                .align(Alignment.TopCenter),
            color = SpotisGreen,
            trackColor = SpotisWhiteAlpha10
        )

        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Album Art
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(SpotisDarkCard)
            ) {
                if (track.albumArt.isNotEmpty()) {
                    val rotationAnim by rememberInfiniteTransition(label = "vinyl").animateFloat(
                        initialValue = 0f,
                        targetValue = 360f,
                        animationSpec = infiniteRepeatable(
                            animation = tween(12000, easing = LinearEasing),
                            repeatMode = RepeatMode.Restart
                        ),
                        label = "rotation"
                    )
                    AsyncImage(
                        model = track.albumArt,
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape)
                            .then(if (state.isPlaying) Modifier.graphicsLayer { rotationZ = rotationAnim } else Modifier)
                    )
                }
            }

            Spacer(Modifier.width(12.dp))

            // Track Info
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = track.title,
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = SpotisWhite,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = track.artist,
                    style = MaterialTheme.typography.labelSmall,
                    color = SpotisGray400,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // Controls
            IconButton(onClick = { viewModel.playPrev() }) {
                Icon(Icons.Default.SkipPrevious, contentDescription = null, tint = SpotisWhite, modifier = Modifier.size(28.dp))
            }

            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(SpotisGreen, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                if (state.isResolvingAudio) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = SpotisBlack, strokeWidth = 2.dp)
                } else {
                    IconButton(onClick = { viewModel.togglePlayPause() }) {
                        Icon(
                            imageVector = if (state.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                            contentDescription = null,
                            tint = SpotisBlack,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }

            IconButton(onClick = { viewModel.playNext() }) {
                Icon(Icons.Default.SkipNext, contentDescription = null, tint = SpotisWhite, modifier = Modifier.size(28.dp))
            }
        }
    }
}

// ─── Full Screen Player ───────────────────────────────────────────────────────

@Composable
fun FullScreenPlayer(
    viewModel: PlayerViewModel,
    onDismiss: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val track = state.currentTrack ?: return
    var showMenu by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SpotisBlack)
    ) {
        // Blurred album art background
        if (track.albumArt.isNotEmpty()) {
            AsyncImage(
                model = track.albumArt,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .blur(80.dp)
                    .graphicsLayer { alpha = 0.3f }
            )
        }

        // Dark overlay gradient
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color.Transparent,
                            SpotisBlack.copy(alpha = 0.7f),
                            SpotisBlack
                        )
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = 48.dp, bottom = 32.dp, start = 24.dp, end = 24.dp)
        ) {
            // Top Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.KeyboardArrowDown, contentDescription = "Close", tint = SpotisWhite, modifier = Modifier.size(32.dp))
                }
                
                // Audio / Video Toggle
                if (state.youtubeVideoId.isNotEmpty()) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(32.dp))
                            .background(SpotisDarkCard)
                            .clickable { viewModel.toggleVideoMode() }
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = if (state.showVideo) "🎬 Video" else "🎵 Audio",
                            color = SpotisWhite,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                } else {
                    Text("REPRODUCIENDO DESDE SPOTIS", style = MaterialTheme.typography.labelSmall, color = SpotisGray500, fontWeight = FontWeight.Bold)
                }

                IconButton(onClick = { /* More Options */ }) {
                    Icon(Icons.Default.MoreVert, contentDescription = "More", tint = SpotisWhite)
                }
            }

            Spacer(Modifier.height(32.dp))

            // Album Art or Video Player
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f)
                    .clip(RoundedCornerShape(32.dp))
                    .background(SpotisDarkPanel),
                contentAlignment = Alignment.Center
            ) {
                if ((state.showVideo || state.useWebAudio) && state.youtubeVideoId.isNotEmpty()) {
                    val initialStartTime = remember(state.youtubeVideoId) { (state.currentTimeMs / 1000).toInt() }
                    
                    AndroidView(
                        factory = { ctx ->
                            WebView(ctx).apply {
                                layoutParams = ViewGroup.LayoutParams(
                                    ViewGroup.LayoutParams.MATCH_PARENT,
                                    ViewGroup.LayoutParams.MATCH_PARENT
                                )
                                settings.javaScriptEnabled = true
                                settings.mediaPlaybackRequiresUserGesture = false
                                webChromeClient = WebChromeClient()
                                webViewClient = object : WebViewClient() {
                                    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                                        return true
                                    }
                                    
                                    override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): android.webkit.WebResourceResponse? {
                                        val url = request?.url?.toString() ?: return null
                                        val adDomains = listOf("doubleclick.net", "googlesyndication.com", "/adbreak", "/ptracking", "youtube.com/api/stats/ads", "youtube.com/pagead")
                                        if (adDomains.any { url.contains(it) }) {
                                            return android.webkit.WebResourceResponse("text/plain", "UTF-8", java.io.ByteArrayInputStream(ByteArray(0)))
                                        }
                                        return super.shouldInterceptRequest(view, request)
                                    }

                                    override fun onPageFinished(view: WebView?, url: String?) {
                                        val js = """
                                            setInterval(function() {
                                                var skipBtn = document.querySelector('.ytp-skip-ad-button') || document.querySelector('.ytp-ad-skip-button') || document.querySelector('.ytp-ad-skip-button-modern');
                                                if (skipBtn) skipBtn.click();
                                                
                                                var adShowing = document.querySelector('.ad-showing');
                                                if (adShowing) {
                                                    var v = document.querySelector('video');
                                                    if (v && v.duration) v.currentTime = v.duration;
                                                }
                                            }, 500);
                                        """.trimIndent()
                                        view?.evaluateJavascript(js, null)
                                    }
                                }
                                
                                val muteParam = if (state.useWebAudio) "0" else "1"
                                loadUrl("https://www.youtube.com/embed/${state.youtubeVideoId}?autoplay=1&mute=$muteParam&controls=0&modestbranding=1&playsinline=1&start=$initialStartTime")
                            }
                        },
                        modifier = Modifier.fillMaxSize(),
                        update = { webView ->
                            if (state.useWebAudio) {
                                val action = if (state.isPlaying) "play()" else "pause()"
                                webView.evaluateJavascript("var v = document.querySelector('video'); if (v) v.$action;", null)
                            }
                        }
                    )
                }
                
                if (!state.showVideo && track.albumArt.isNotEmpty()) {
                    AsyncImage(
                        model = track.albumArt,
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else if (!state.showVideo) {
                    Icon(Icons.Default.MusicNote, contentDescription = null, tint = SpotisGray700, modifier = Modifier.size(80.dp))
                }
            }

            Spacer(Modifier.height(40.dp))

            // Track Info
            Text(
                text = track.title,
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black),
                color = SpotisWhite,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                fontSize = 24.sp
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = track.artist,
                style = MaterialTheme.typography.bodyLarge,
                color = SpotisGray400
            )

            Spacer(Modifier.height(32.dp))

            // Progress Slider
            Column(modifier = Modifier.fillMaxWidth()) {
                Slider(
                    value = state.progress,
                    onValueChange = { viewModel.seekTo(it) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = SliderDefaults.colors(
                        thumbColor = SpotisWhite,
                        activeTrackColor = SpotisGreen,
                        inactiveTrackColor = SpotisWhiteAlpha20
                    )
                )
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(formatTime(state.currentTimeMs), style = MaterialTheme.typography.labelSmall, color = SpotisGray500)
                    Text(formatTime(state.durationMs), style = MaterialTheme.typography.labelSmall, color = SpotisGray500)
                }
            }

            Spacer(Modifier.height(24.dp))

            // Controls Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { viewModel.toggleShuffle() }) {
                    Icon(
                        Icons.Default.Shuffle,
                        contentDescription = null,
                        tint = if (state.isShuffle) SpotisGreen else SpotisGray400,
                        modifier = Modifier.size(24.dp)
                    )
                }

                IconButton(
                    onClick = { viewModel.playPrev() },
                    modifier = Modifier.size(52.dp)
                ) {
                    Icon(Icons.Default.SkipPrevious, contentDescription = null, tint = SpotisWhite, modifier = Modifier.size(40.dp))
                }

                // Play/Pause big button
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .background(SpotisWhite, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    if (state.isResolvingAudio) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp), color = SpotisBlack, strokeWidth = 2.dp)
                    } else {
                        IconButton(onClick = { viewModel.togglePlayPause() }) {
                            Icon(
                                imageVector = if (state.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                                contentDescription = "Play/Pause",
                                tint = SpotisBlack,
                                modifier = Modifier.size(40.dp)
                            )
                        }
                    }
                }

                IconButton(
                    onClick = { viewModel.playNext() },
                    modifier = Modifier.size(52.dp)
                ) {
                    Icon(Icons.Default.SkipNext, contentDescription = null, tint = SpotisWhite, modifier = Modifier.size(40.dp))
                }

                IconButton(onClick = { }) {
                    Icon(Icons.Default.Repeat, contentDescription = null, tint = SpotisGray400, modifier = Modifier.size(24.dp))
                }
            }

            Spacer(Modifier.height(24.dp))

            // Volume Slider
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.VolumeDown, contentDescription = null, tint = SpotisGray500, modifier = Modifier.size(18.dp))
                Slider(
                    value = state.volume,
                    onValueChange = { viewModel.setVolume(it) },
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 8.dp),
                    colors = SliderDefaults.colors(
                        thumbColor = SpotisWhite,
                        activeTrackColor = SpotisWhite.copy(alpha = 0.7f),
                        inactiveTrackColor = SpotisWhiteAlpha20
                    )
                )
                Icon(Icons.Default.VolumeUp, contentDescription = null, tint = SpotisGray500, modifier = Modifier.size(18.dp))
            }
        }
    }
}

private fun formatTime(ms: Long): String {
    val totalSecs = ms / 1000
    val mins = totalSecs / 60
    val secs = totalSecs % 60
    return "$mins:${if (secs < 10) "0$secs" else "$secs"}"
}

