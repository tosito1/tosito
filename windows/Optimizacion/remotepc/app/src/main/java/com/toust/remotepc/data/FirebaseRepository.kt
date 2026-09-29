package com.toust.remotepc.data

import android.content.Context
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

private const val TAG = "FirebaseRepository"

// Web Client ID (tipo 3) del google-services.json
private const val WEB_CLIENT_ID =
    "944852070557-nqamdsq1hbtflcj3ar2h8rhsgckj0qfo.apps.googleusercontent.com"

/**
 * Data class que representa la información de un PC registrado en Firestore.
 */
data class PcInfo(
    val pcId: String = "",
    val machineName: String = "",
    val tunnelUrl: String  = "",
    val updatedAt: String  = "",
    val ownerUid: String? = null,
    val pairingCode: String? = null
)

/**
 * Repositorio central: gestiona autenticación Firebase y acceso a Firestore.
 */
class FirebaseRepository {

    private val auth       = FirebaseAuth.getInstance()
    private val firestore  = FirebaseFirestore.getInstance()

    val currentUid: String? get() = auth.currentUser?.uid

    /** True si ya hay una sesión activa de Firebase. */
    val isSignedIn: Boolean get() = auth.currentUser != null

    /**
     * Lanza el flujo de Google Sign-In usando Credential Manager (API moderna).
     * Devuelve true si el login fue exitoso.
     */
    suspend fun signInWithGoogle(context: Context): Boolean {
        return try {
            val credentialManager = CredentialManager.create(context)

            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId(WEB_CLIENT_ID)
                .setAutoSelectEnabled(true)
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            val result = credentialManager.getCredential(context, request)
            val credential = result.credential

            if (credential is CustomCredential &&
                credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
            ) {
                val googleIdToken = GoogleIdTokenCredential.createFrom(credential.data).idToken
                val firebaseCredential = GoogleAuthProvider.getCredential(googleIdToken, null)
                auth.signInWithCredential(firebaseCredential).await()
                true
            } else {
                false
            }
        } catch (e: Exception) {
            false
        }
    }

    fun signOut() = auth.signOut()

    /**
     * Obtiene el Firebase ID Token fresco del usuario actual.
     */
    suspend fun getFreshIdToken(): String? {
        return try {
            auth.currentUser?.getIdToken(false)?.await()?.token
        } catch (e: Exception) {
            null
        }
    }

    // ── Firestore ─────────────────────────────────────────────────────────────

    /**
     * Obtiene solo los PCs vinculados al usuario actual.
     */
    suspend fun getAvailablePcs(): List<PcInfo> {
        val uid = currentUid ?: return emptyList()
        return try {
            val snapshot = firestore.collection("pcs")
                .whereEqualTo("ownerUid", uid)
                .get().await()
                
            snapshot.documents.mapNotNull { doc ->
                val url = doc.getString("tunnelUrl") ?: return@mapNotNull null
                PcInfo(
                    pcId = doc.id,
                    machineName = doc.getString("machineName") ?: doc.id,
                    tunnelUrl   = url,
                    updatedAt   = doc.getString("updatedAt") ?: "",
                    ownerUid    = doc.getString("ownerUid"),
                    pairingCode = doc.getString("pairingCode")
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error leyendo Firestore: ${e.message}")
            emptyList()
        }
    }

    /**
     * Vincula un PC usando el código de 6 dígitos.
     */
    suspend fun pairPc(pairingCode: String): Result<Boolean> {
        val uid = currentUid ?: return Result.failure(Exception("Usuario no autenticado"))
        return try {
            val snapshot = firestore.collection("pcs")
                .whereEqualTo("pairingCode", pairingCode)
                .limit(1)
                .get().await()

            if (snapshot.isEmpty) {
                return Result.failure(Exception("Código de vinculación inválido o expirado"))
            }

            val doc = snapshot.documents.first()
            doc.reference.update(mapOf(
                "ownerUid" to uid
            )).await()
            
            Result.success(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error vinculando PC: ${e.message}")
            Result.failure(e)
        }
    }

    /**
     * Desvincula un PC asignando ownerUid a null en Firestore.
     */
    suspend fun unlinkPc(pcId: String): Result<Boolean> {
        return try {
            firestore.collection("pcs").document(pcId)
                .update(mapOf("ownerUid" to null))
                .await()
            Result.success(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error desvinculando PC: ${e.message}")
            Result.failure(e)
        }
    }

    /**
     * Escucha cambios en tiempo real solo para los PCs del usuario.
     */
    fun listenForPcs(onUpdate: (List<PcInfo>) -> Unit) {
        val uid = currentUid ?: return
        firestore.collection("pcs")
            .whereEqualTo("ownerUid", uid)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e(TAG, "Firestore listener error: ${error.message}")
                    return@addSnapshotListener
                }
                val pcs = snapshot?.documents?.mapNotNull { doc ->
                    val url = doc.getString("tunnelUrl") ?: return@mapNotNull null
                    PcInfo(
                        pcId = doc.id,
                        machineName = doc.getString("machineName") ?: doc.id,
                        tunnelUrl   = url,
                        updatedAt   = doc.getString("updatedAt") ?: "",
                        ownerUid    = doc.getString("ownerUid"),
                        pairingCode = doc.getString("pairingCode")
                    )
                } ?: emptyList()
                onUpdate(pcs)
            }
    }
}
