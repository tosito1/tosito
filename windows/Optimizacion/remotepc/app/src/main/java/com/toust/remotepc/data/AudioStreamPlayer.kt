package com.toust.remotepc.data

import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.BufferedInputStream
import java.util.concurrent.TimeUnit

class AudioStreamPlayer {
    private var audioTrack: AudioTrack? = null
    private var job: Job? = null
    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .connectTimeout(15, TimeUnit.SECONDS)
        .build()

    fun start(url: String, idToken: String? = null) {
        if (job != null) return

        job = GlobalScope.launch(Dispatchers.IO) {
            try {
                val requestBuilder = Request.Builder().url(url)
                if (idToken != null) {
                    requestBuilder.addHeader("Authorization", "Bearer $idToken")
                }
                
                val request = requestBuilder.build()
                val response = client.newCall(request).execute()

                if (!response.isSuccessful) {
                    Log.e("AudioStream", "Error al conectar: ${response.code} ${response.message}")
                    return@launch
                }

                val inputStream = BufferedInputStream(response.body?.byteStream() ?: return@launch)
                
                // Leer cabecera WAV (44 bytes)
                val header = ByteArray(44)
                var headerRead = 0
                while (headerRead < 44) {
                    val r = inputStream.read(header, headerRead, 44 - headerRead)
                    if (r == -1) break
                    headerRead += r
                }

                // Extraer sample rate (bytes 24-27, little endian)
                val sampleRate = if (headerRead == 44) {
                    (header[24].toInt() and 0xFF) or
                    ((header[25].toInt() and 0xFF) shl 8) or
                    ((header[26].toInt() and 0xFF) shl 16) or
                    ((header[27].toInt() and 0xFF) shl 24)
                } else 48000 // Fallback

                Log.d("AudioStream", "Detectado sample rate: $sampleRate Hz")

                val bufferSize = AudioTrack.getMinBufferSize(
                    sampleRate,
                    AudioFormat.CHANNEL_OUT_STEREO,
                    AudioFormat.ENCODING_PCM_16BIT
                ).coerceAtLeast(8192)

                audioTrack = AudioTrack(
                    AudioManager.STREAM_MUSIC,
                    sampleRate,
                    AudioFormat.CHANNEL_OUT_STEREO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    bufferSize,
                    AudioTrack.MODE_STREAM
                )

                audioTrack?.play()
                Log.d("AudioStream", "Reproducción iniciada")

                val buffer = ByteArray(bufferSize)
                while (job?.isActive == true) {
                    val bytesRead = inputStream.read(buffer)
                    if (bytesRead == -1) break
                    if (bytesRead > 0) {
                        audioTrack?.write(buffer, 0, bytesRead)
                    }
                }

            } catch (e: Exception) {
                Log.e("AudioStream", "Error en stream: ${e.message}")
            } finally {
                stop()
            }
        }
    }

    fun stop() {
        job?.cancel()
        job = null
        try {
            audioTrack?.stop()
            audioTrack?.release()
        } catch (_: Exception) {}
        audioTrack = null
    }
}
