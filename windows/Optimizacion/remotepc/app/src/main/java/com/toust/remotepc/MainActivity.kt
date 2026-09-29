package com.toust.remotepc

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.lifecycle.viewmodel.compose.viewModel
import com.toust.remotepc.ui.screens.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val viewModel: RemoteViewModel = viewModel()
            val uiState by viewModel.uiState.collectAsState()

            Surface(
                modifier = Modifier.fillMaxSize(),
                color = Color(0xFF0D0D14)
            ) {
                when (uiState.screen) {
                    is Screen.Login  -> LoginScreen(viewModel = viewModel)
                    is Screen.Setup  -> SetupScreen(viewModel = viewModel)
                    is Screen.Remote -> RemoteScreen(viewModel = viewModel)
                }
            }
        }
    }
}