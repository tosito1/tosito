package com.toust.spotis.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.toust.spotis.data.model.Album
import com.toust.spotis.data.model.Artist
import com.toust.spotis.data.model.Playlist
import com.toust.spotis.data.model.Track
import com.toust.spotis.data.repository.PlaylistRepository
import com.toust.spotis.data.repository.SpotifyRepository
import com.toust.spotis.data.repository.SpotifyResult
import com.toust.spotis.data.repository.TrackRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class MainUiState(
    val playlists: List<Playlist> = emptyList(),
    val favorites: List<Track> = emptyList(),
    val searchResults: List<Track> = emptyList(),
    val searchArtists: List<Artist> = emptyList(),
    val searchAlbums: List<Album> = emptyList(),
    val searchPlaylists: List<Playlist> = emptyList(),
    val searchActiveTab: String = "all", // "all", "tracks", "artists", "albums", "playlists"
    val recommendations: List<Track> = emptyList(),
    val topTracks: List<Track> = emptyList(),
    val globalHits: List<Track> = emptyList(),
    val latinHits: List<Track> = emptyList(),
    val chillHits: List<Track> = emptyList(),
    val workoutHits: List<Track> = emptyList(),
    val isSearching: Boolean = false,
    val isLoadingRecs: Boolean = false,
    val notification: String? = null,
    val error: String? = null
)

class MainViewModel(
    private val playlistRepo: PlaylistRepository,
    private val trackRepo: TrackRepository,
    private val spotifyRepo: SpotifyRepository,
    private val iTunesRepo: com.toust.spotis.data.repository.ITunesRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState

    private var currentUserId: String? = null

    fun init(userId: String) {
        if (currentUserId == userId) return
        currentUserId = userId
        observePlaylists(userId)
        observeFavorites(userId)
    }

    private fun observePlaylists(userId: String) {
        viewModelScope.launch {
            playlistRepo.observePlaylists(userId).collect { playlists ->
                _uiState.value = _uiState.value.copy(playlists = playlists)
            }
        }
    }

    private fun observeFavorites(userId: String) {
        viewModelScope.launch {
            trackRepo.observeFavorites(userId).collect { favs ->
                _uiState.value = _uiState.value.copy(favorites = favs)
            }
        }
    }

    fun setSearchTab(tab: String) {
        _uiState.value = _uiState.value.copy(searchActiveTab = tab)
    }

    fun searchTracks(query: String) {
        if (query.isBlank()) {
            clearSearch()
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSearching = true)
            // Try Spotify Search first
            when (val result = spotifyRepo.searchMulti(query)) {
                is SpotifyResult.Success -> {
                    _uiState.value = _uiState.value.copy(
                        searchResults = result.data.tracks,
                        searchArtists = result.data.artists,
                        searchAlbums = result.data.albums,
                        searchPlaylists = result.data.playlists,
                        isSearching = false
                    )
                }
                is SpotifyResult.Error -> {
                    // Fallback to iTunes API if Spotify fails (e.g. no token)
                    val itunesResults = iTunesRepo.searchMulti(query, 20)
                    _uiState.value = _uiState.value.copy(
                        searchResults = itunesResults.tracks,
                        searchArtists = itunesResults.artists,
                        searchAlbums = itunesResults.albums,
                        searchPlaylists = itunesResults.playlists,
                        isSearching = false
                    )
                }
            }
        }
    }

    fun clearSearch() {
        _uiState.value = _uiState.value.copy(
            searchResults = emptyList(),
            searchArtists = emptyList(),
            searchAlbums = emptyList(),
            searchPlaylists = emptyList(),
            searchActiveTab = "all"
        )
    }

    fun loadTopTracks() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingRecs = true)
            
            // Try to load Spotify Top Tracks first
            when (val result = spotifyRepo.getTopTracks()) {
                is SpotifyResult.Success -> {
                    _uiState.value = _uiState.value.copy(
                        topTracks = result.data.map { it.toTrack() }
                    )
                }
                is SpotifyResult.Error -> {
                    // Fallback to iTunes if Spotify fails (e.g. no token)
                    _uiState.value = _uiState.value.copy(topTracks = emptyList())
                }
            }

            // Load Generic ITunes Hits in parallel for the UI sections
            launch {
                val global = iTunesRepo.fetchTracks("top hits global", 25)
                _uiState.value = _uiState.value.copy(globalHits = global)
            }
            launch {
                val latin = iTunesRepo.fetchTracks("top hits latino", 15)
                _uiState.value = _uiState.value.copy(latinHits = latin)
            }
            launch {
                val chill = iTunesRepo.fetchTracks("lofi chill vibes", 15)
                _uiState.value = _uiState.value.copy(chillHits = chill)
            }
            launch {
                val workout = iTunesRepo.fetchTracks("workout running dance", 15)
                _uiState.value = _uiState.value.copy(workoutHits = workout)
            }

            _uiState.value = _uiState.value.copy(isLoadingRecs = false)
        }
    }

    fun toggleFavorite(userId: String, track: Track) {
        viewModelScope.launch {
            val isFav = trackRepo.isFavorite(userId, track.id)
            if (isFav) {
                trackRepo.removeFavorite(userId, track.id)
                showNotification("Eliminado de favoritos")
            } else {
                trackRepo.addFavorite(userId, track)
                showNotification("Añadido a favoritos ♥")
            }
        }
    }

    fun createPlaylist(userId: String, name: String) {
        viewModelScope.launch {
            if (name.isBlank()) return@launch
            playlistRepo.createPlaylist(userId, name)
            showNotification("Playlist \"$name\" creada")
        }
    }

    fun addTrackToPlaylist(userId: String, playlistId: String, track: Track) {
        viewModelScope.launch {
            playlistRepo.addTrackToPlaylist(userId, playlistId, track)
            showNotification("Añadido a la playlist")
        }
    }

    fun removeTrackFromPlaylist(userId: String, playlistId: String, trackId: String) {
        viewModelScope.launch {
            playlistRepo.removeTrackFromPlaylist(userId, playlistId, trackId)
        }
    }

    fun deletePlaylist(userId: String, playlistId: String) {
        viewModelScope.launch {
            playlistRepo.deletePlaylist(userId, playlistId)
            showNotification("Playlist eliminada")
        }
    }

    private fun showNotification(message: String) {
        _uiState.value = _uiState.value.copy(notification = message)
        viewModelScope.launch {
            kotlinx.coroutines.delay(3000)
            _uiState.value = _uiState.value.copy(notification = null)
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun isFavorite(trackId: String): Boolean =
        _uiState.value.favorites.any { it.id == trackId }
}
