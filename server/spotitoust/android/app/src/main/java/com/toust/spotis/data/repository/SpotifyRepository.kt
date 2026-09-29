package com.toust.spotis.data.repository

import com.google.gson.annotations.SerializedName
import com.toust.spotis.data.local.PreferencesManager
import com.toust.spotis.data.model.Album
import com.toust.spotis.data.model.Artist
import com.toust.spotis.data.model.MultiSearchResult
import com.toust.spotis.data.model.Playlist
import com.toust.spotis.data.model.SpotifyProfile
import com.toust.spotis.data.model.SpotifyTrack
import okhttp3.FormBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.logging.HttpLoggingInterceptor
import org.json.JSONObject
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

sealed class SpotifyResult<out T> {
    data class Success<T>(val data: T) : SpotifyResult<T>()
    data class Error(val message: String, val code: Int = 0) : SpotifyResult<Nothing>()
}

class SpotifyRepository(private val prefs: PreferencesManager) {

    companion object {
        private const val SPOTIFY_ACCOUNTS_URL = "https://accounts.spotify.com"
        private const val SPOTIFY_API_URL = "https://api.spotify.com/v1"
        private const val SCOPES = "user-read-private user-read-email user-top-read " +
                "user-library-read user-library-modify playlist-read-private " +
                "playlist-modify-public playlist-modify-private"
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        })
        .build()

    // ─── PKCE Auth ──────────────────────────────────────────────────────────────

    suspend fun generatePkceAuthUrl(): String {
        val verifier = generateCodeVerifier()
        prefs.saveCodeVerifier(verifier)
        val challenge = generateCodeChallenge(verifier)
        val clientId = prefs.getSpotifyClientId()

        return buildString {
            append("$SPOTIFY_ACCOUNTS_URL/authorize")
            append("?client_id=$clientId")
            append("&response_type=code")
            append("&redirect_uri=${PreferencesManager.SPOTIFY_REDIRECT_URI}")
            append("&scope=${SCOPES.replace(" ", "%20")}")
            append("&code_challenge_method=S256")
            append("&code_challenge=$challenge")
        }
    }

    suspend fun exchangeCodeForToken(code: String): SpotifyResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val verifier = prefs.getCodeVerifier() ?: return@withContext SpotifyResult.Error("Code verifier missing")
            val clientId = prefs.getSpotifyClientId()
            val clientSecret = prefs.getSpotifyClientSecret()

            val bodyBuilder = FormBody.Builder()
                .add("client_id", clientId)
                .add("grant_type", "authorization_code")
                .add("code", code)
                .add("redirect_uri", PreferencesManager.SPOTIFY_REDIRECT_URI)
                .add("code_verifier", verifier)

            if (clientSecret.isNotEmpty()) {
                bodyBuilder.add("client_secret", clientSecret)
            }

            val request = Request.Builder()
                .url("$SPOTIFY_ACCOUNTS_URL/api/token")
                .post(bodyBuilder.build())
                .header("Content-Type", "application/x-www-form-urlencoded")
                .build()

            val response = client.newCall(request).execute()
            val bodyText = response.body?.string() ?: ""

            if (!response.isSuccessful) {
                return@withContext SpotifyResult.Error("Token exchange failed: ${response.code}", response.code)
            }

            val json = JSONObject(bodyText)
            val accessToken = json.optString("access_token")
            val refreshToken = json.optString("refresh_token").takeIf { it.isNotEmpty() }

            if (accessToken.isNotEmpty()) {
                prefs.saveSpotifyTokens(accessToken, refreshToken)
                SpotifyResult.Success(Unit)
            } else {
                SpotifyResult.Error("No access token in response")
            }
        } catch (e: Exception) {
            SpotifyResult.Error(e.message ?: "Unknown error")
        }
    }

    suspend fun refreshAccessToken(): SpotifyResult<String> = withContext(Dispatchers.IO) {
        try {
            val refreshToken = prefs.getSpotifyRefreshToken()
                ?: return@withContext SpotifyResult.Error("No refresh token")
            val clientId = prefs.getSpotifyClientId()
            val clientSecret = prefs.getSpotifyClientSecret()

            val bodyBuilder = FormBody.Builder()
                .add("client_id", clientId)
                .add("grant_type", "refresh_token")
                .add("refresh_token", refreshToken)

            if (clientSecret.isNotEmpty()) {
                bodyBuilder.add("client_secret", clientSecret)
            }

            val request = Request.Builder()
                .url("$SPOTIFY_ACCOUNTS_URL/api/token")
                .post(bodyBuilder.build())
                .header("Content-Type", "application/x-www-form-urlencoded")
                .build()

            val response = client.newCall(request).execute()
            val bodyText = response.body?.string() ?: ""

            if (!response.isSuccessful) return@withContext SpotifyResult.Error("Refresh failed", response.code)

            val json = JSONObject(bodyText)
            val newToken = json.optString("access_token")
            val newRefresh = json.optString("refresh_token").takeIf { it.isNotEmpty() }

            if (newToken.isNotEmpty()) {
                prefs.saveSpotifyTokens(newToken, newRefresh)
                SpotifyResult.Success(newToken)
            } else {
                SpotifyResult.Error("No access token in refresh response")
            }
        } catch (e: Exception) {
            SpotifyResult.Error(e.message ?: "Unknown error")
        }
    }

    // ─── API Calls ───────────────────────────────────────────────────────────────

    private suspend fun getValidToken(): String? {
        val token = prefs.getSpotifyAccessToken() ?: return null
        return token
    }

    suspend fun getProfile(): SpotifyResult<SpotifyProfile> = withContext(Dispatchers.IO) {
        try {
            val token = getValidToken() ?: return@withContext SpotifyResult.Error("No token", 401)
            val request = Request.Builder()
                .url("$SPOTIFY_API_URL/me")
                .header("Authorization", "Bearer $token")
                .build()

            val response = client.newCall(request).execute()
            if (response.code == 401) {
                val refreshed = refreshAccessToken()
                if (refreshed is SpotifyResult.Error) return@withContext SpotifyResult.Error("Unauthorized", 401)
                return@withContext getProfile()
            }

            val body = response.body?.string() ?: return@withContext SpotifyResult.Error("Empty response")
            val json = JSONObject(body)

            val profile = SpotifyProfile(
                id = json.optString("id"),
                display_name = json.optString("display_name"),
                email = json.optString("email"),
                country = json.optString("country"),
                product = json.optString("product"),
                uri = json.optString("uri"),
                images = buildList {
                    val images = json.optJSONArray("images")
                    if (images != null) {
                        for (i in 0 until images.length()) {
                            val img = images.getJSONObject(i)
                            add(com.toust.spotis.data.model.SpotifyImage(url = img.optString("url")))
                        }
                    }
                }
            )
            SpotifyResult.Success(profile)
        } catch (e: Exception) {
            SpotifyResult.Error(e.message ?: "Unknown error")
        }
    }

    suspend fun searchMulti(query: String, limit: Int = 10): SpotifyResult<MultiSearchResult> = withContext(Dispatchers.IO) {
        try {
            val token = getValidToken() ?: return@withContext SpotifyResult.Error("No token", 401)
            val encodedQuery = java.net.URLEncoder.encode(query, "UTF-8")
            val request = Request.Builder()
                .url("$SPOTIFY_API_URL/search?q=$encodedQuery&type=track,artist,album,playlist&limit=$limit")
                .header("Authorization", "Bearer $token")
                .build()

            val response = client.newCall(request).execute()
            if (response.code == 401) {
                refreshAccessToken()
                return@withContext searchMulti(query, limit)
            }

            val body = response.body?.string() ?: return@withContext SpotifyResult.Error("Empty response")
            val json = JSONObject(body)
            
            val tracks = parseTracksFromSearch(json)
            val artists = parseArtistsFromSearch(json)
            val albums = parseAlbumsFromSearch(json)
            val playlists = parsePlaylistsFromSearch(json)
            
            SpotifyResult.Success(MultiSearchResult(tracks, artists, albums, playlists))
        } catch (e: Exception) {
            SpotifyResult.Error(e.message ?: "Unknown error")
        }
    }

    suspend fun getTopTracks(limit: Int = 10): SpotifyResult<List<SpotifyTrack>> = withContext(Dispatchers.IO) {
        try {
            val token = getValidToken() ?: return@withContext SpotifyResult.Error("No token", 401)
            val request = Request.Builder()
                .url("$SPOTIFY_API_URL/me/top/tracks?limit=$limit&time_range=long_term")
                .header("Authorization", "Bearer $token")
                .build()

            val response = client.newCall(request).execute()
            if (response.code == 401) {
                refreshAccessToken()
                return@withContext getTopTracks(limit)
            }
            if (!response.isSuccessful) return@withContext SpotifyResult.Error("Error ${response.code}", response.code)

            val body = response.body?.string() ?: return@withContext SpotifyResult.Error("Empty")
            val json = JSONObject(body)
            val items = json.optJSONArray("items") ?: return@withContext SpotifyResult.Success(emptyList())
            val tracks = mutableListOf<SpotifyTrack>()
            for (i in 0 until items.length()) {
                parseTrack(items.getJSONObject(i))?.let { tracks.add(it) }
            }
            SpotifyResult.Success(tracks)
        } catch (e: Exception) {
            SpotifyResult.Error(e.message ?: "Unknown error")
        }
    }

    // ─── Parsing ─────────────────────────────────────────────────────────────────

    private fun parseTracksFromSearch(json: JSONObject): List<com.toust.spotis.data.model.Track> {
        val tracksObj = json.optJSONObject("tracks") ?: return emptyList()
        val items = tracksObj.optJSONArray("items") ?: return emptyList()
        return buildList {
            for (i in 0 until items.length()) {
                parseTrack(items.getJSONObject(i))?.let { add(it.toTrack()) }
            }
        }
    }

    private fun parseArtistsFromSearch(json: JSONObject): List<Artist> {
        val artistsObj = json.optJSONObject("artists") ?: return emptyList()
        val items = artistsObj.optJSONArray("items") ?: return emptyList()
        return buildList {
            for (i in 0 until items.length()) {
                val a = items.getJSONObject(i)
                val images = a.optJSONArray("images")
                val cover = if (images != null && images.length() > 0) images.getJSONObject(0).optString("url") else ""
                add(Artist(id = a.optString("id"), name = a.optString("name"), coverUrl = cover))
            }
        }
    }

    private fun parseAlbumsFromSearch(json: JSONObject): List<Album> {
        val albumsObj = json.optJSONObject("albums") ?: return emptyList()
        val items = albumsObj.optJSONArray("items") ?: return emptyList()
        return buildList {
            for (i in 0 until items.length()) {
                val a = items.getJSONObject(i)
                val images = a.optJSONArray("images")
                val cover = if (images != null && images.length() > 0) images.getJSONObject(0).optString("url") else ""
                val artistsArr = a.optJSONArray("artists")
                val artistName = if (artistsArr != null && artistsArr.length() > 0) artistsArr.getJSONObject(0).optString("name") else ""
                add(Album(id = a.optString("id"), name = a.optString("name"), artist = artistName, coverUrl = cover))
            }
        }
    }

    private fun parsePlaylistsFromSearch(json: JSONObject): List<Playlist> {
        val playlistsObj = json.optJSONObject("playlists") ?: return emptyList()
        val items = playlistsObj.optJSONArray("items") ?: return emptyList()
        return buildList {
            for (i in 0 until items.length()) {
                val p = items.getJSONObject(i)
                val images = p.optJSONArray("images")
                val cover = if (images != null && images.length() > 0) images.getJSONObject(0).optString("url") else ""
                add(Playlist(id = p.optString("id"), name = p.optString("name"), coverUrl = cover, isSpotify = true))
            }
        }
    }

    private fun parseTrack(obj: JSONObject): SpotifyTrack? {
        return try {
            val albumObj = obj.optJSONObject("album") ?: JSONObject()
            val images = buildList {
                val imgs = albumObj.optJSONArray("images")
                if (imgs != null && imgs.length() > 0) {
                    add(com.toust.spotis.data.model.SpotifyImage(url = imgs.getJSONObject(0).optString("url")))
                }
            }
            val artists = buildList {
                val artistsArr = obj.optJSONArray("artists")
                if (artistsArr != null) {
                    for (i in 0 until artistsArr.length()) {
                        val a = artistsArr.getJSONObject(i)
                        add(com.toust.spotis.data.model.SpotifyArtist(id = a.optString("id"), name = a.optString("name")))
                    }
                }
            }
            SpotifyTrack(
                id = obj.optString("id"),
                name = obj.optString("name"),
                artists = artists,
                album = com.toust.spotis.data.model.SpotifyAlbum(
                    id = albumObj.optString("id"),
                    name = albumObj.optString("name"),
                    images = images
                ),
                preview_url = obj.optString("preview_url").takeIf { it.isNotEmpty() },
                duration_ms = obj.optLong("duration_ms"),
                uri = obj.optString("uri")
            )
        } catch (e: Exception) { null }
    }

    // ─── PKCE Crypto ─────────────────────────────────────────────────────────────

    private fun generateCodeVerifier(): String {
        val bytes = ByteArray(32)
        SecureRandom().nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    private fun generateCodeChallenge(verifier: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(verifier.toByteArray(Charsets.US_ASCII))
        return Base64.getUrlEncoder().withoutPadding().encodeToString(digest)
    }

    suspend fun clearTokens() = prefs.clearSpotifyTokens()
    suspend fun hasToken(): Boolean = prefs.getSpotifyAccessToken() != null
}
