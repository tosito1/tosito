package com.toust.spotis

import android.content.Intent
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService

import androidx.media3.common.Player

object PlayerManager {
    var player: Player? = null
    var mediaSession: MediaSession? = null
}

class PlaybackService : MediaSessionService() {
    
    override fun onCreate() {
        super.onCreate()
        val player = PlayerManager.player ?: return
        
        val session = MediaSession.Builder(this, player).build()
        PlayerManager.mediaSession = session
        addSession(session)
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? {
        return PlayerManager.mediaSession
    }
    
    // In Android 13+, the OS automatically manages the foreground service lifecycle 
    // when a MediaSessionService is running and playing audio.
    // By explicitly adding the session in onCreate, we ensure the OS spawns 
    // the media notification persistently even without a MediaController.
    
    override fun onDestroy() {
        PlayerManager.mediaSession?.release()
        PlayerManager.mediaSession = null
        super.onDestroy()
    }
}
