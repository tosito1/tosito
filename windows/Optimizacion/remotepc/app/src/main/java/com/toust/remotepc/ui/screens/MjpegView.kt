package com.toust.remotepc.ui.screens

import android.graphics.BitmapFactory
import android.util.Log
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.isActive
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.BufferedInputStream
import java.io.DataInputStream
import java.util.concurrent.TimeUnit

private const val MJPEG_TAG = "MjpegView"

/**
 * Composable que decodifica y muestra un stream MJPEG (multipart/x-mixed-replace).
 *
 * El servidor envía frames con el formato:
 *   \r\n--frame\r\n
 *   Content-Type: image/jpeg\r\n
 *   Content-Length: {len}\r\n
 *   \r\n
 *   {jpeg_bytes}
 *   ...
 */
@Composable
fun MjpegView(
    url: String,
    modifier: Modifier = Modifier.fillMaxSize(),
    contentScale: ContentScale = ContentScale.Fit,
    onError: () -> Unit = {}
) {
    var frame by remember { mutableStateOf<ImageBitmap?>(null) }

    LaunchedEffect(url) {
        withContext(Dispatchers.IO) {
            try {
                val client = OkHttpClient.Builder()
                    .readTimeout(0, TimeUnit.MILLISECONDS)   // Sin timeout (stream infinito)
                    .connectTimeout(15, TimeUnit.SECONDS)
                    .build()

                val request = Request.Builder()
                    .url(url)
                    .header("Accept", "multipart/x-mixed-replace")
                    .build()

                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        Log.e(MJPEG_TAG, "HTTP error: ${response.code}")
                        withContext(Dispatchers.Main) { onError() }
                        return@withContext
                    }

                    val body = response.body ?: run {
                        withContext(Dispatchers.Main) { onError() }
                        return@withContext
                    }

                    val reader = DataInputStream(BufferedInputStream(body.byteStream(), 65_536))
                    val lineBuffer = ByteArray(1024)

                    while (isActive) {
                        // 1. Buscar boundary
                        var line = readLineEfficiently(reader, lineBuffer) ?: break
                        while (!line.startsWith("--") && isActive) {
                            line = readLineEfficiently(reader, lineBuffer) ?: break
                        }
                        if (!isActive) break

                        // 2. Leer headers
                        var contentLength = 0
                        do {
                            line = readLineEfficiently(reader, lineBuffer) ?: break
                            if (line.lowercase().startsWith("content-length:")) {
                                contentLength = line.substringAfter(":").trim().toIntOrNull() ?: 0
                            }
                        } while (line.isNotEmpty() && isActive)

                        // 3. Leer JPEG
                        if (contentLength > 0 && isActive) {
                            val frameBytes = ByteArray(contentLength)
                            reader.readFully(frameBytes)

                            if (isActive) {
                                val bmp = BitmapFactory.decodeByteArray(frameBytes, 0, frameBytes.size)
                                if (bmp != null) {
                                    val imgBitmap = bmp.asImageBitmap()
                                    withContext(Dispatchers.Main) { 
                                        frame = imgBitmap
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(MJPEG_TAG, "Stream error: ${e.message}")
                withContext(Dispatchers.Main) { onError() }
            }
        }
    }

    frame?.let { bmp ->
        Image(
            bitmap = bmp,
            contentDescription = "Pantalla del PC",
            contentScale = contentScale,
            modifier = modifier
        )
    }
}

/** Lee una línea usando un buffer para evitar miles de llamadas a read() de un solo byte */
private fun readLineEfficiently(reader: DataInputStream, buffer: ByteArray): String? {
    var pos = 0
    while (pos < buffer.size) {
        val b = reader.read()
        if (b == -1) return if (pos == 0) null else String(buffer, 0, pos)
        if (b == '\n'.code) {
            var len = pos
            if (len > 0 && buffer[len - 1] == '\r'.code.toByte()) len--
            return String(buffer, 0, len)
        }
        buffer[pos++] = b.toByte()
    }
    return String(buffer, 0, pos)
}
