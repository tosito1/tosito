package com.toust.tosito

import android.app.Application
import android.util.Log
import com.google.firebase.FirebaseApp
import com.google.firebase.firestore.FirebaseFirestore

class TositoApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Inicializar Firebase manualmente
        initializeFirebase()
        
        com.toust.tosito.utils.NotificationHelper.createChannels(this)
        com.toust.tosito.receivers.NotificationScheduler.scheduleDailyMorningAlert(this)
    }
    
    private fun initializeFirebase() {
        try {
            // Verificar si Firebase ya está inicializado
            val existingApps = try {
                FirebaseApp.getApps(this)
            } catch (e: Exception) {
                emptyList<FirebaseApp>()
            }
            
            if (existingApps.isEmpty()) {
                Log.d("TositoApplication", "Initializing Firebase using google-services.json...")
                
                try {
                    FirebaseApp.initializeApp(this)
                    Log.d("TositoApplication", "Firebase initialized successfully with default options")
                } catch (e: Exception) {
                    Log.e("TositoApplication", "Failed to initialize Firebase: ${e.message}", e)
                }
            } else {
                Log.d("TositoApplication", "Firebase already initialized by provider (${existingApps.size} apps)")
            }
            
            // Verificar que Firestore funcione
            try {
                val firestore = FirebaseFirestore.getInstance()
                Log.d("TositoApplication", "Firestore instance obtained successfully")
            } catch (e: IllegalStateException) {
                Log.e("TositoApplication", "Firestore not available: ${e.message}")
                Log.e("TositoApplication", "Firebase may not be properly initialized")
            } catch (e: Exception) {
                Log.e("TositoApplication", "Error getting Firestore instance: ${e.message}", e)
            }
        } catch (e: Exception) {
            Log.e("TositoApplication", "Unexpected error initializing Firebase", e)
        }
    }
}
