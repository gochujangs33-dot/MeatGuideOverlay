package com.antigravity.meatguideoverlay.data.datasource

import android.util.Log
import com.antigravity.meatguideoverlay.data.model.ActivePopupInfo
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

/**
 * Firebase Data Source for single active popup image real-time synchronization.
 */
class FirebasePopupDataSource(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) {
    companion object {
        private const val TAG = "FirebasePopupDataSource"
        private const val COLLECTION_ACTIVE_POPUP = "active_popup"
        private const val DOC_CURRENT = "current"
    }

    init {
        ensureAuth()
    }

    private fun ensureAuth() {
        if (auth.currentUser == null) {
            auth.signInAnonymously()
                .addOnSuccessListener { Log.d(TAG, "Firebase Anonymous Auth success: ${it.user?.uid}") }
                .addOnFailureListener { Log.w(TAG, "Firebase Anonymous Auth failed: ${it.message}") }
        }
    }

    /**
     * Real-time Flow observing changes to the active popup image in Firestore.
     */
    fun observeActivePopup(): Flow<ActivePopupInfo?> = callbackFlow {
        ensureAuth()

        val docRef = firestore.collection(COLLECTION_ACTIVE_POPUP).document(DOC_CURRENT)

        val listener: ListenerRegistration = docRef.addSnapshotListener { snapshot: DocumentSnapshot?, error: FirebaseFirestoreException? ->
            if (error != null) {
                Log.w(TAG, "Error listening to active popup: ${error.message}")
                return@addSnapshotListener
            }

            if (snapshot != null && snapshot.exists()) {
                try {
                    val imageUrl = snapshot.getString("imageUrl") ?: ""
                    val version = snapshot.getLong("version") ?: 1L
                    val updatedAt = snapshot.getString("updatedAt") ?: ""
                    val fileName = snapshot.getString("fileName") ?: "active_image.jpg"
                    val fileSize = snapshot.getLong("fileSize") ?: 0L
                    val checksum = snapshot.getString("checksum") ?: ""
                    val bubbleText = snapshot.getString("bubbleText") ?: "이 고기가 어떤 부위인지 궁금하신가요?"

                    val popupInfo = ActivePopupInfo(
                        imageUrl = imageUrl,
                        version = version,
                        updatedAt = updatedAt,
                        fileName = fileName,
                        fileSize = fileSize,
                        checksum = checksum,
                        bubbleText = bubbleText
                    )
                    trySend(popupInfo)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed parsing active popup snapshot: ${e.message}", e)
                }
            }
        }

        awaitClose {
            listener.remove()
        }
    }

    /**
     * Downloads image stream from URL.
     */
    fun downloadImageStream(imageUrl: String): InputStream? {
        return try {
            val url = URL(imageUrl)
            val connection = url.openConnection() as HttpURLConnection
            connection.connectTimeout = 10000
            connection.readTimeout = 15000
            connection.requestMethod = "GET"
            connection.doInput = true
            connection.connect()

            if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                connection.inputStream
            } else {
                Log.e(TAG, "Image download failed with HTTP code: ${connection.responseCode}")
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed opening image stream from URL: ${e.message}", e)
            null
        }
    }
}
