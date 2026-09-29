package com.toust.spotis.data.repository

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import org.json.JSONArray
import org.json.JSONObject
import java.net.URLEncoder
import java.util.concurrent.TimeUnit

data class YouTubeResult(
    val videoId: String,
    val audioUrl: String? = null // Direct stream URL
)

class YouTubeRepository {

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .addInterceptor { chain ->
            val request = chain.request().newBuilder()
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .header("Accept", "application/json")
                .build()
            chain.proceed(request)
        }
        .build()

    // Base instances known to be highly reliable
    private val baseInstances = mutableSetOf(
        "https://inv.thepixora.com",
        "https://yewtu.be",
        "https://invidious.io.lol",
        "https://vid.priv.au",
        "https://invidious.lunar.icu"
    )

    private val pipedInstances = listOf(
        "https://api.piped.private.coffee",
        "https://pipedapi.kavin.rocks",
        "https://piped-api.lunar.icu"
    )

    private suspend fun fetchDynamicInstances() {
        var response: Response? = null
        try {
            val request = Request.Builder()
                .url("https://api.invidious.io/instances.json?sort_by=type,users")
                .build()
            response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val jsonStr = response.body?.string() ?: return
                val array = JSONArray(jsonStr)
                for (i in 0 until array.length()) {
                    val item = array.getJSONArray(i)
                    if (item.length() > 1) {
                        val info = item.getJSONObject(1)
                        if (info.optString("type") == "https" && info.optBoolean("api") && !info.optString("uri").contains(".onion")) {
                            baseInstances.add(info.getString("uri"))
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.w("YouTubeRepository", "Failed to fetch dynamic instances: ${e.message}")
        } finally {
            response?.close()
        }
    }

    suspend fun resolveVideoId(title: String, artist: String): YouTubeResult? = withContext(Dispatchers.IO) {
        val query = URLEncoder.encode("$artist - $title", "UTF-8")
        
        // Try fetching dynamic instances to heal the list
        fetchDynamicInstances()
        
        var fallbackVideoId: String? = null
        
        // 1. Try Invidious Search
        for (instance in baseInstances) {
            var response: Response? = null
            try {
                val searchUrl = "$instance/api/v1/search?q=$query&type=video"
                val request = Request.Builder().url(searchUrl).build()
                response = client.newCall(request).execute()
                
                if (response.isSuccessful) {
                    val jsonStr = response.body?.string()
                    if (jsonStr != null) {
                        val results = JSONArray(jsonStr)
                        if (results.length() > 0) {
                            val first = results.getJSONObject(0)
                            val videoId = first.optString("videoId")
                            if (videoId.isNotEmpty()) {
                                Log.d("YouTubeRepository", "Resolved videoId \"$videoId\" from Invidious search \"$instance\"")
                                fallbackVideoId = videoId
                                response.close() // Close before breaking
                                break
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                // Ignore and try next instance
            } finally {
                response?.close()
            }
        }
        
        // 2. If Invidious search failed, try Piped Search
        if (fallbackVideoId == null) {
            for (pipedInstance in pipedInstances) {
                var response: Response? = null
                try {
                    val searchUrl = "$pipedInstance/search?q=$query&filter=music_songs"
                    val request = Request.Builder().url(searchUrl).build()
                    response = client.newCall(request).execute()
                    
                    if (response.isSuccessful) {
                        val jsonStr = response.body?.string()
                        if (jsonStr != null) {
                            val data = JSONObject(jsonStr)
                            if (data.has("items")) {
                                val items = data.getJSONArray("items")
                                if (items.length() > 0) {
                                    val first = items.getJSONObject(0)
                                    val videoUrl = first.optString("url")
                                    // Piped URL looks like /watch?v=XXXXX
                                    if (videoUrl.contains("?v=")) {
                                        val videoId = videoUrl.substringAfter("?v=").substringBefore("&")
                                        if (videoId.isNotEmpty()) {
                                            Log.d("YouTubeRepository", "Resolved videoId \"$videoId\" from Piped search \"$pipedInstance\"")
                                            fallbackVideoId = videoId
                                            response.close() // Close before breaking
                                            break
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (e: Exception) {
                    // Ignore and try next instance
                } finally {
                    response?.close()
                }
            }
        }
        
        if (fallbackVideoId != null) {
            // 3. Try to resolve direct audio stream from Piped instances
            for (pipedInstance in pipedInstances) {
                var response: Response? = null
                try {
                    val streamUrl = "$pipedInstance/streams/$fallbackVideoId"
                    val request = Request.Builder().url(streamUrl).build()
                    response = client.newCall(request).execute()
                    
                    if (response.isSuccessful) {
                        val jsonStr = response.body?.string()
                        if (jsonStr != null) {
                            val data = JSONObject(jsonStr)
                            if (data.has("audioStreams")) {
                                val audioStreams = data.getJSONArray("audioStreams")
                                var bestAudioUrl: String? = null
                                var highestBitrate = 0
                                
                                for (i in 0 until audioStreams.length()) {
                                    val stream = audioStreams.getJSONObject(i)
                                    val format = stream.optString("format", "").uppercase()
                                    val mimeType = stream.optString("mimeType", "").lowercase()
                                    val bitrateStr = stream.optString("bitrate", "0")
                                    val bitrate = bitrateStr.toIntOrNull() ?: 0
                                    
                                    val url = stream.optString("url", "")
                                    if (url.isNotEmpty()) {
                                        // Massive priority to proxied URLs to bypass YouTube IP blocks
                                        val isProxied = !url.contains("googlevideo.com")
                                        // Prefer WebM/Opus to avoid the MP4/AAC massive PTS bug on ExoPlayer
                                        val isWebm = mimeType.contains("webm") || mimeType.contains("opus")
                                        val priorityBitrate = bitrate + (if (isProxied) 10000000 else 0) + (if (isWebm) 5000000 else 0)
                                        
                                        Log.d("YouTubeRepository", "Evaluating Piped format: $mimeType | Bitrate: $bitrate | Priority: $priorityBitrate | isWebm: $isWebm")
                                        
                                        if (priorityBitrate >= highestBitrate) {
                                            bestAudioUrl = url
                                            highestBitrate = priorityBitrate
                                        }
                                    }
                                }
                                
                                if (bestAudioUrl != null) {
                                    Log.d("YouTubeRepository", "Resolved audio URL from Piped. Final priority score: $highestBitrate")
                                    response.close() // Close before returning
                                    return@withContext YouTubeResult(videoId = fallbackVideoId, audioUrl = bestAudioUrl)
                                }
                            }
                        }
                    }
                } catch (e: Exception) {
                    Log.w("YouTubeRepository", "Piped stream error ($pipedInstance): ${e.message}")
                } finally {
                    response?.close()
                }
            }
            
            // 4. Try to resolve direct audio stream from Invidious instances (Fallback)
            for (instance in baseInstances) {
                var response: Response? = null
                try {
                    val videoUrl = "$instance/api/v1/videos/$fallbackVideoId?local=true"
                    val videoRequest = Request.Builder().url(videoUrl).build()
                    response = client.newCall(videoRequest).execute()
                    
                    if (response.isSuccessful) {
                        val videoJsonStr = response.body?.string()
                        if (videoJsonStr != null) {
                            val data = JSONObject(videoJsonStr)
                            var bestAudioUrl: String? = null
                            var highestBitrate = 0

                            // 1. Try progressive streams first to avoid PTS bugs that cause decoder drops on MIUI
                            if (data.has("formatStreams")) {
                                val progFormats = data.getJSONArray("formatStreams")
                                for (i in 0 until progFormats.length()) {
                                    val format = progFormats.getJSONObject(i)
                                    val type = format.optString("type", "").lowercase()
                                    if (type.contains("mp4")) {
                                        var url = format.optString("url", "")
                                        if (url.isNotEmpty()) {
                                            if (url.startsWith("//")) url = "https:$url"
                                            else if (url.startsWith("/")) url = instance.removeSuffix("/") + url
                                            
                                            bestAudioUrl = url
                                            highestBitrate = 99999999 // Massive priority
                                            break
                                        }
                                    }
                                }
                            }

                            // 2. Fallback to adaptive formats
                            if (bestAudioUrl == null && data.has("adaptiveFormats")) {
                                val formats = data.getJSONArray("adaptiveFormats")
                                var highestBitrate = 0
                                
                                for (i in 0 until formats.length()) {
                                    val format = formats.getJSONObject(i)
                                    val type = format.optString("type", "").lowercase()
                                    if (type.startsWith("audio/")) {
                                        val bitrateStr = format.optString("bitrate", "0")
                                        val bitrate = bitrateStr.toIntOrNull() ?: 0
                                        
                                        var url = format.optString("url", "")
                                        if (url.isNotEmpty()) {
                                            if (url.startsWith("//")) url = "https:$url"
                                            else if (url.startsWith("/")) url = instance.removeSuffix("/") + url
                                            
                                            // Massive priority to proxied URLs to bypass YouTube IP blocks
                                            val isProxied = !url.contains("googlevideo.com")
                                            // Prefer WebM/Opus to avoid the MP4/AAC massive PTS bug on ExoPlayer
                                            val isWebm = type.contains("webm") || type.contains("opus")
                                            val priorityBitrate = bitrate + (if (isProxied) 10000000 else 0) + (if (isWebm) 5000000 else 0)
                                            
                                            Log.d("YouTubeRepository", "Evaluating Invidious format: $type | Bitrate: $bitrate | Priority: $priorityBitrate | isWebm: $isWebm")
                                            
                                            if (priorityBitrate >= highestBitrate) {
                                                bestAudioUrl = url
                                                highestBitrate = priorityBitrate
                                            }
                                        }
                                    }
                                }
                                
                                if (bestAudioUrl != null) {
                                    Log.d("YouTubeRepository", "Resolved audio URL. Final priority score: $highestBitrate")
                                    response.close() // Close before returning
                                    return@withContext YouTubeResult(videoId = fallbackVideoId, audioUrl = bestAudioUrl)
                                }
                            }
                        }
                    }
                } catch (e: Exception) {
                    // Ignore
                } finally {
                    response?.close()
                }
            }
        }
        
        return@withContext if (fallbackVideoId != null) YouTubeResult(videoId = fallbackVideoId) else null
    }
}
