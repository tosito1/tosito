package com.toust.spotis.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.toust.spotis.data.model.Track
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "spotis_prefs")

class PreferencesManager(private val context: Context) {

    companion object {
        val SPOTIFY_ACCESS_TOKEN = stringPreferencesKey("spotify_access_token")
        val SPOTIFY_REFRESH_TOKEN = stringPreferencesKey("spotify_refresh_token")
        val SPOTIFY_CLIENT_ID = stringPreferencesKey("spotify_client_id")
        val SPOTIFY_CLIENT_SECRET = stringPreferencesKey("spotify_client_secret")
        val SPOTIFY_CODE_VERIFIER = stringPreferencesKey("spotify_code_verifier")
        val LISTENING_HISTORY = stringPreferencesKey("listening_history")

        const val DEFAULT_CLIENT_ID = "f765145a6b544913bb3cb8dda552ccf7"
        const val DEFAULT_CLIENT_SECRET = "d3388c3790154b1f8b943f025e8dd13b"
        const val SPOTIFY_REDIRECT_URI = "spotis://callback"
        const val MAX_HISTORY_SIZE = 50
    }

    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    // Spotify Token Management
    suspend fun saveSpotifyTokens(accessToken: String, refreshToken: String?) {
        context.dataStore.edit { prefs ->
            prefs[SPOTIFY_ACCESS_TOKEN] = accessToken
            if (refreshToken != null) prefs[SPOTIFY_REFRESH_TOKEN] = refreshToken
        }
    }

    suspend fun getSpotifyAccessToken(): String? =
        context.dataStore.data.first()[SPOTIFY_ACCESS_TOKEN]

    suspend fun getSpotifyRefreshToken(): String? =
        context.dataStore.data.first()[SPOTIFY_REFRESH_TOKEN]

    suspend fun saveSpotifyClientId(clientId: String) {
        context.dataStore.edit { it[SPOTIFY_CLIENT_ID] = clientId }
    }

    suspend fun getSpotifyClientId(): String =
        context.dataStore.data.first()[SPOTIFY_CLIENT_ID] ?: DEFAULT_CLIENT_ID

    suspend fun saveSpotifyClientSecret(secret: String) {
        context.dataStore.edit { it[SPOTIFY_CLIENT_SECRET] = secret }
    }

    suspend fun getSpotifyClientSecret(): String =
        context.dataStore.data.first()[SPOTIFY_CLIENT_SECRET] ?: DEFAULT_CLIENT_SECRET

    suspend fun saveCodeVerifier(verifier: String) {
        context.dataStore.edit { it[SPOTIFY_CODE_VERIFIER] = verifier }
    }

    suspend fun getCodeVerifier(): String? =
        context.dataStore.data.first()[SPOTIFY_CODE_VERIFIER]

    suspend fun clearSpotifyTokens() {
        context.dataStore.edit { prefs ->
            prefs.remove(SPOTIFY_ACCESS_TOKEN)
            prefs.remove(SPOTIFY_REFRESH_TOKEN)
            prefs.remove(SPOTIFY_CODE_VERIFIER)
        }
    }

    // Listening History
    suspend fun addToHistory(track: Track) {
        val history = getHistory().toMutableList()
        history.removeAll { it.id == track.id }
        history.add(0, track.copy(addedAt = System.currentTimeMillis()))
        if (history.size > MAX_HISTORY_SIZE) history.dropLast(history.size - MAX_HISTORY_SIZE)
        context.dataStore.edit { prefs ->
            prefs[LISTENING_HISTORY] = json.encodeToString(history)
        }
    }

    suspend fun getHistory(): List<Track> {
        val raw = context.dataStore.data.first()[LISTENING_HISTORY] ?: return emptyList()
        return try { json.decodeFromString(raw) } catch (e: Exception) { emptyList() }
    }

    fun observeHistory(): Flow<List<Track>> =
        context.dataStore.data.map { prefs ->
            val raw = prefs[LISTENING_HISTORY] ?: return@map emptyList()
            try { json.decodeFromString(raw) } catch (e: Exception) { emptyList() }
        }
}
