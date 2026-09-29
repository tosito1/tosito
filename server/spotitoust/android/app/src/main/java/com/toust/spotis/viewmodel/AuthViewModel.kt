package com.toust.spotis.viewmodel

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.FirebaseUser
import com.toust.spotis.data.local.PreferencesManager
import com.toust.spotis.data.model.SpotifyProfile
import com.toust.spotis.data.repository.AuthRepository
import com.toust.spotis.data.repository.AuthResult
import com.toust.spotis.data.repository.SpotifyRepository
import com.toust.spotis.data.repository.SpotifyResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class AuthUiState(
    val isLoading: Boolean = false,
    val isCheckingSession: Boolean = true,
    val firebaseUser: FirebaseUser? = null,
    val spotifyProfile: SpotifyProfile? = null,
    val spotifyToken: String? = null,
    val authMode: AuthMode = AuthMode.SIGN_IN,
    val error: String? = null,
    val isAuthenticated: Boolean = false
)

enum class AuthMode { SIGN_IN, SIGN_UP }

class AuthViewModel(
    private val authRepo: AuthRepository,
    private val spotifyRepo: SpotifyRepository,
    private val prefs: PreferencesManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState

    // Google Sign-In Web Client ID (client_type: 3 from google-services.json)
    private val googleWebClientId = "662096449944-bfvtiu8b68hi4pljcqtbcn54mae5vmcd.apps.googleusercontent.com"

    init {
        observeFirebaseAuth()
        restoreSpotifySession()
    }

    private fun observeFirebaseAuth() {
        viewModelScope.launch {
            authRepo.observeAuthState().collect { user ->
                _uiState.value = _uiState.value.copy(
                    firebaseUser = user,
                    isCheckingSession = false,
                    isAuthenticated = user != null || _uiState.value.spotifyToken != null
                )
            }
        }
    }

    private fun restoreSpotifySession() {
        viewModelScope.launch {
            val token = prefs.getSpotifyAccessToken()
            if (token != null) {
                _uiState.value = _uiState.value.copy(spotifyToken = token)
                loadSpotifyProfile()
            }
        }
    }

    // ─── Firebase Auth ────────────────────────────────────────────────────────────

    fun setAuthMode(mode: AuthMode) {
        _uiState.value = _uiState.value.copy(authMode = mode, error = null)
    }

    fun signInWithEmail(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            when (val result = authRepo.signInWithEmail(email, password)) {
                is AuthResult.Success -> _uiState.value = _uiState.value.copy(isLoading = false)
                is AuthResult.Error -> _uiState.value = _uiState.value.copy(isLoading = false, error = result.message)
            }
        }
    }

    fun signUpWithEmail(name: String, email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            when (val result = authRepo.signUpWithEmail(name, email, password)) {
                is AuthResult.Success -> _uiState.value = _uiState.value.copy(isLoading = false)
                is AuthResult.Error -> _uiState.value = _uiState.value.copy(isLoading = false, error = result.message)
            }
        }
    }

    fun signInWithGoogle(context: Context) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val credentialManager = CredentialManager.create(context)
                val googleIdOption = GetGoogleIdOption.Builder()
                    .setFilterByAuthorizedAccounts(false)
                    .setServerClientId(googleWebClientId)
                    .build()
                val request = GetCredentialRequest.Builder()
                    .addCredentialOption(googleIdOption)
                    .build()
                val result = credentialManager.getCredential(context, request)
                val credential = result.credential
                if (credential is CustomCredential &&
                    credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
                ) {
                    val googleCredential = GoogleIdTokenCredential.createFrom(credential.data)
                    when (val authResult = authRepo.signInWithGoogle(googleCredential.idToken)) {
                        is AuthResult.Success -> _uiState.value = _uiState.value.copy(isLoading = false)
                        is AuthResult.Error -> _uiState.value = _uiState.value.copy(isLoading = false, error = authResult.message)
                    }
                } else {
                    _uiState.value = _uiState.value.copy(isLoading = false, error = "Error con Google Sign-In")
                }
            } catch (e: Exception) {
                val msg = if (e.message?.contains("Cancel") == true) "Inicio cancelado" else "Error con Google Sign-In"
                _uiState.value = _uiState.value.copy(isLoading = false, error = msg)
            }
        }
    }

    // ─── Spotify Auth ─────────────────────────────────────────────────────────────

    suspend fun getSpotifyAuthUrl(): String = spotifyRepo.generatePkceAuthUrl()

    fun handleSpotifyCallback(code: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            when (val result = spotifyRepo.exchangeCodeForToken(code)) {
                is SpotifyResult.Success -> {
                    val token = prefs.getSpotifyAccessToken()
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        spotifyToken = token,
                        isAuthenticated = true
                    )
                    loadSpotifyProfile()
                }
                is SpotifyResult.Error -> _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Error de Spotify: ${result.message}"
                )
            }
        }
    }

    private fun loadSpotifyProfile() {
        viewModelScope.launch {
            when (val result = spotifyRepo.getProfile()) {
                is SpotifyResult.Success -> _uiState.value = _uiState.value.copy(spotifyProfile = result.data)
                is SpotifyResult.Error -> { /* Silent fail, profile is optional */ }
            }
        }
    }

    // ─── Sign Out ─────────────────────────────────────────────────────────────────

    fun signOut() {
        viewModelScope.launch {
            authRepo.signOut()
        }
    }

    fun disconnectSpotify() {
        viewModelScope.launch {
            spotifyRepo.clearTokens()
            _uiState.value = _uiState.value.copy(
                spotifyToken = null,
                spotifyProfile = null,
                isAuthenticated = _uiState.value.firebaseUser != null
            )
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
