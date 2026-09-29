package com.toust.spotis.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.userProfileChangeRequest
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

sealed class AuthResult {
    data class Success(val user: FirebaseUser) : AuthResult()
    data class Error(val message: String) : AuthResult()
}

class AuthRepository {
    private val auth = FirebaseAuth.getInstance()

    val currentUser: FirebaseUser? get() = auth.currentUser

    fun observeAuthState(): Flow<FirebaseUser?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { trySend(it.currentUser) }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    suspend fun signInWithEmail(email: String, password: String): AuthResult {
        return try {
            val result = auth.signInWithEmailAndPassword(email, password).await()
            result.user?.let { AuthResult.Success(it) }
                ?: AuthResult.Error("Error desconocido al iniciar sesión")
        } catch (e: Exception) {
            AuthResult.Error(mapFirebaseError(e))
        }
    }

    suspend fun signUpWithEmail(name: String, email: String, password: String): AuthResult {
        return try {
            val result = auth.createUserWithEmailAndPassword(email, password).await()
            result.user?.let { user ->
                user.updateProfile(userProfileChangeRequest { displayName = name }).await()
                AuthResult.Success(user)
            } ?: AuthResult.Error("Error desconocido al registrarse")
        } catch (e: Exception) {
            AuthResult.Error(mapFirebaseError(e))
        }
    }

    suspend fun signInWithGoogle(idToken: String): AuthResult {
        return try {
            val credential = GoogleAuthProvider.getCredential(idToken, null)
            val result = auth.signInWithCredential(credential).await()
            result.user?.let { AuthResult.Success(it) }
                ?: AuthResult.Error("Error al iniciar sesión con Google")
        } catch (e: Exception) {
            AuthResult.Error(mapFirebaseError(e))
        }
    }

    suspend fun signOut() {
        auth.signOut()
    }

    private fun mapFirebaseError(e: Exception): String {
        val code = e.message ?: ""
        return when {
            code.contains("email-already-in-use") -> "Este correo ya tiene una cuenta. Inicia sesión."
            code.contains("wrong-password") || code.contains("invalid-credential") -> "Credenciales incorrectas"
            code.contains("user-not-found") -> "No existe una cuenta con este correo"
            code.contains("weak-password") -> "La contraseña debe tener al menos 6 caracteres"
            code.contains("invalid-email") -> "El correo electrónico no es válido"
            code.contains("network") -> "Error de red. Comprueba tu conexión"
            code.contains("too-many-requests") -> "Demasiados intentos. Inténtalo más tarde"
            else -> "Error de autenticación. Inténtalo de nuevo"
        }
    }
}
