package com.toust.spotis.data.repository

import com.google.gson.annotations.SerializedName
import com.toust.spotis.data.model.Album
import com.toust.spotis.data.model.Artist
import com.toust.spotis.data.model.MultiSearchResult
import com.toust.spotis.data.model.Track
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Query

// --- iTunes API Models ---

data class ITunesResponse(
    @SerializedName("resultCount") val resultCount: Int,
    @SerializedName("results") val results: List<ITunesTrack>
)

data class ITunesTrack(
    @SerializedName("trackId") val trackId: Long,
    @SerializedName("trackName") val trackName: String,
    @SerializedName("artistName") val artistName: String,
    @SerializedName("collectionName") val collectionName: String?,
    @SerializedName("artworkUrl100") val artworkUrl100: String?,
    @SerializedName("previewUrl") val previewUrl: String?,
    @SerializedName("trackTimeMillis") val trackTimeMillis: Long?
) {
    fun toTrack(): Track? {
        if (previewUrl == null) return null
        return Track(
            id = "itunes_$trackId",
            title = trackName,
            artist = artistName,
            albumArt = artworkUrl100?.replace("100x100", "600x600") ?: "",
            previewUrl = previewUrl,
            durationMs = trackTimeMillis ?: 30000L
        )
    }
}

// --- Retrofit Interface ---

interface ITunesApi {
    @GET("search")
    suspend fun searchTracks(
        @Query("term") query: String,
        @Query("media") media: String = "music",
        @Query("entity") entity: String = "song",
        @Query("limit") limit: Int = 20
    ): ITunesResponse
}

// --- Repository ---

class ITunesRepository {

    private val api: ITunesApi

    init {
        val client = OkHttpClient.Builder()
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            })
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl("https://itunes.apple.com/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        api = retrofit.create(ITunesApi::class.java)
    }

    suspend fun fetchTracks(query: String, limit: Int = 20): List<Track> = withContext(Dispatchers.IO) {
        try {
            val response = api.searchTracks(query = query, limit = limit)
            response.results.mapNotNull { it.toTrack() }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    suspend fun searchMulti(query: String, limit: Int = 20): MultiSearchResult {
        val tracks = fetchTracks(query, limit)
        val artists = tracks.distinctBy { it.artist }.map { track ->
            Artist(
                id = "itunes_artist_${track.artist.hashCode()}",
                name = track.artist,
                coverUrl = track.albumArt,
                isSpotify = false
            )
        }
        val albums = tracks.distinctBy { it.albumArt }.map { track ->
            Album(
                id = "itunes_album_${track.albumArt.hashCode()}",
                name = track.title + " (Album)",
                artist = track.artist,
                coverUrl = track.albumArt,
                isSpotify = false
            )
        }
        return MultiSearchResult(
            tracks = tracks,
            artists = artists,
            albums = albums,
            playlists = emptyList()
        )
    }
}
