package com.toust.spotis.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import com.toust.spotis.data.local.PreferencesManager
import com.toust.spotis.data.model.Track
import com.toust.spotis.data.repository.YouTubeRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class PlayerUiState(
    val currentTrack: Track? = null,
    val queue: List<Track> = emptyList(),
    val currentIndex: Int = 0,
    val isPlaying: Boolean = false,
    val isShuffle: Boolean = false,
    val progress: Float = 0f,          // 0..1
    val currentTimeMs: Long = 0L,
    val durationMs: Long = 0L,
    val volume: Float = 0.8f,
    val isFullScreen: Boolean = false,
    val isResolvingAudio: Boolean = false,
    val showVideo: Boolean = false,
    val useWebAudio: Boolean = false,
    val youtubeVideoId: String = "" // Fallback info if needed
)

class PlayerViewModel(
    context: Context,
    private val prefs: PreferencesManager,
    private val youtubeRepo: YouTubeRepository = YouTubeRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(PlayerUiState())
    val uiState: StateFlow<PlayerUiState> = _uiState
    
    val exoPlayer: ExoPlayer = ExoPlayer.Builder(context)
        .setRenderersFactory(
            androidx.media3.exoplayer.DefaultRenderersFactory(context)
                .setEnableDecoderFallback(true)
                .forceDisableMediaCodecAsynchronousQueueing()
        )
        .setMediaSourceFactory(
            androidx.media3.exoplayer.source.DefaultMediaSourceFactory(
                context,
                androidx.media3.extractor.DefaultExtractorsFactory()
                    .setMp4ExtractorFlags(androidx.media3.extractor.mp4.Mp4Extractor.FLAG_WORKAROUND_IGNORE_EDIT_LISTS)
                    .setFragmentedMp4ExtractorFlags(androidx.media3.extractor.mp4.FragmentedMp4Extractor.FLAG_WORKAROUND_IGNORE_TFDT_BOX)
            ).setDataSourceFactory(
                androidx.media3.datasource.DefaultDataSource.Factory(
                    context,
                    androidx.media3.datasource.DefaultHttpDataSource.Factory()
                        .setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                        .setDefaultRequestProperties(mapOf("Accept" to "*/*"))
                        .setAllowCrossProtocolRedirects(true)
                        .setConnectTimeoutMs(15000)
                        .setReadTimeoutMs(15000)
                )
            )
        )
        .build()
        
    private var progressJob: Job? = null

    init {
        // Intercept MediaSession commands to use our custom playNext/playPrev queue logic
        val forwardingPlayer = object : androidx.media3.common.ForwardingPlayer(exoPlayer) {
            override fun seekToNext() { playNext() }
            override fun seekToNextMediaItem() { playNext() }
            override fun seekToPrevious() { playPrev() }
            override fun seekToPreviousMediaItem() { playPrev() }
            override fun setShuffleModeEnabled(shuffleModeEnabled: Boolean) {
                if (shuffleModeEnabled != _uiState.value.isShuffle) toggleShuffle()
            }
            override fun hasNextMediaItem(): Boolean = true
            override fun hasPreviousMediaItem(): Boolean = true
            override fun getAvailableCommands(): androidx.media3.common.Player.Commands {
                return super.getAvailableCommands().buildUpon()
                    .add(androidx.media3.common.Player.COMMAND_SEEK_TO_NEXT)
                    .add(androidx.media3.common.Player.COMMAND_SEEK_TO_NEXT_MEDIA_ITEM)
                    .add(androidx.media3.common.Player.COMMAND_SEEK_TO_PREVIOUS)
                    .add(androidx.media3.common.Player.COMMAND_SEEK_TO_PREVIOUS_MEDIA_ITEM)
                    .add(androidx.media3.common.Player.COMMAND_SET_SHUFFLE_MODE)
                    .build()
            }
        }
        
        // Share player with the service so it can create the MediaSession with the Service context
        com.toust.spotis.PlayerManager.player = forwardingPlayer
        
        // Start the MediaSessionService natively by binding a MediaController to it.
        // This ensures the OS wires up the notification manager properly.
        val sessionToken = androidx.media3.session.SessionToken(
            context,
            android.content.ComponentName(context, com.toust.spotis.PlaybackService::class.java)
        )
        androidx.media3.session.MediaController.Builder(context, sessionToken).buildAsync()
        
        exoPlayer.addListener(object : Player.Listener {
            override fun onIsPlayingChanged(isPlaying: Boolean) {
                _uiState.value = _uiState.value.copy(isPlaying = isPlaying)
                if (isPlaying) startProgressSimulation() else stopProgressSimulation()
            }

            override fun onPlaybackStateChanged(playbackState: Int) {
                if (playbackState == Player.STATE_ENDED) {
                    onTrackEnded()
                }
            }

            override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                android.util.Log.e("PlayerViewModel", "ExoPlayer Error: ${error.message}")
                onTrackEnded()
            }
        })
        exoPlayer.volume = _uiState.value.volume
    }

    private fun startProgressSimulation() {
        progressJob?.cancel()
        progressJob = viewModelScope.launch {
            while (isActive) {
                val current = exoPlayer.currentPosition
                val duration = exoPlayer.duration.coerceAtLeast(1L)
                val progress = if (duration > 0) current.toFloat() / duration else 0f
                _uiState.value = _uiState.value.copy(
                    currentTimeMs = current,
                    durationMs = duration,
                    progress = progress
                )
                delay(500)
            }
        }
    }

    private fun stopProgressSimulation() {
        progressJob?.cancel()
    }

    fun playTrack(track: Track, queue: List<Track> = listOf(track)) {
        val index = queue.indexOfFirst { it.id == track.id }.coerceAtLeast(0)
        _uiState.value = _uiState.value.copy(
            currentTrack = track,
            queue = queue,
            currentIndex = index,
            isPlaying = false,
            progress = 0f,
            currentTimeMs = 0L,
            durationMs = track.durationMs.coerceAtLeast(1L),
            isResolvingAudio = true
        )
        
        exoPlayer.pause()
        
        viewModelScope.launch {
            prefs.addToHistory(track)
            
            // Resolve direct audio URL
            val result = youtubeRepo.resolveVideoId(track.title, track.artist)
            
            if (result?.audioUrl != null) {
                _uiState.value = _uiState.value.copy(
                    isResolvingAudio = false,
                    youtubeVideoId = result.videoId,
                    useWebAudio = false
                )
                val mediaItem = buildMediaItem(track, result.audioUrl)
                exoPlayer.setMediaItem(mediaItem)
                exoPlayer.prepare()
                exoPlayer.play()
            } else if (result?.videoId != null) {
                // If we only got videoId but no direct audio, fallback to WebAudio (unmuting the iframe)
                _uiState.value = _uiState.value.copy(
                    isResolvingAudio = false, 
                    youtubeVideoId = result.videoId,
                    useWebAudio = true,
                    isPlaying = true
                )
                exoPlayer.stop()
                exoPlayer.clearMediaItems()
            } else {
                _uiState.value = _uiState.value.copy(isResolvingAudio = false, useWebAudio = false)
                // Fallback to preview
                if (!track.previewUrl.isNullOrEmpty()) {
                    val mediaItem = buildMediaItem(track, track.previewUrl)
                    exoPlayer.setMediaItem(mediaItem)
                    exoPlayer.prepare()
                    exoPlayer.play()
                }
            }
        }
    }
    
    private fun buildMediaItem(track: Track, url: String): androidx.media3.common.MediaItem {
        val metadata = androidx.media3.common.MediaMetadata.Builder()
            .setTitle(track.title)
            .setArtist(track.artist)
            .setArtworkUri(android.net.Uri.parse(track.albumArt))
            .build()
            
        return androidx.media3.common.MediaItem.Builder()
            .setUri(url)
            .setMediaMetadata(metadata)
            .build()
    }

    fun togglePlayPause() {
        if (_uiState.value.useWebAudio) {
            _uiState.value = _uiState.value.copy(isPlaying = !_uiState.value.isPlaying)
        } else {
            if (exoPlayer.isPlaying) {
                exoPlayer.pause()
            } else {
                exoPlayer.play()
            }
        }
    }

    fun playNext() {
        val state = _uiState.value
        val nextIndex = if (state.isShuffle) {
            (0 until state.queue.size).random()
        } else {
            (state.currentIndex + 1).coerceAtMost(state.queue.size - 1)
        }
        val nextTrack = state.queue.getOrNull(nextIndex) ?: return
        playTrack(nextTrack, state.queue)
    }

    fun playPrev() {
        val state = _uiState.value
        if (exoPlayer.currentPosition > 3000L) {
            exoPlayer.seekTo(0L); return
        }
        val prevIndex = (state.currentIndex - 1).coerceAtLeast(0)
        val prevTrack = state.queue.getOrNull(prevIndex) ?: return
        playTrack(prevTrack, state.queue)
    }

    fun toggleShuffle() {
        _uiState.value = _uiState.value.copy(isShuffle = !_uiState.value.isShuffle)
    }

    fun toggleVideoMode() {
        val newVideoMode = !_uiState.value.showVideo
        _uiState.value = _uiState.value.copy(showVideo = newVideoMode)
    }

    fun seekTo(progress: Float) {
        if (_uiState.value.useWebAudio) return // Seeking not supported in WebAudio fallback yet
        val duration = exoPlayer.duration.coerceAtLeast(1L)
        exoPlayer.seekTo((progress * duration).toLong())
    }

    fun setVolume(volume: Float) {
        val safeVol = volume.coerceIn(0f, 1f)
        exoPlayer.volume = safeVol
        _uiState.value = _uiState.value.copy(volume = safeVol)
    }

    fun setFullScreen(fullScreen: Boolean) {
        _uiState.value = _uiState.value.copy(isFullScreen = fullScreen)
    }

    override fun onCleared() {
        super.onCleared()
        exoPlayer.release()
    }

    private fun onTrackEnded() {
        playNext()
    }
}
