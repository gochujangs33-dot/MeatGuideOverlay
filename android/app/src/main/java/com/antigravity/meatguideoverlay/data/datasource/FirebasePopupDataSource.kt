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
class FirebasePopupDataSource {
    companion object {
        private const val TAG = "FirebasePopupDataSource"
        private const val COLLECTION_ACTIVE_POPUP = "active_popup"
        private const val DOC_CURRENT = "current"
    }

    private val firestore: FirebaseFirestore? by lazy {
        try {
            FirebaseFirestore.getInstance()
        } catch (e: Exception) {
            Log.w(TAG, "Firestore instance not available: ${e.message}")
            null
        }
    }

    private val auth: FirebaseAuth? by lazy {
        try {
            FirebaseAuth.getInstance()
        } catch (e: Exception) {
            Log.w(TAG, "FirebaseAuth instance not available: ${e.message}")
            null
        }
    }

    init {
        ensureAuth()
    }

    private fun ensureAuth() {
        try {
            val a = auth ?: return
            if (a.currentUser == null) {
                a.signInAnonymously()
                    .addOnSuccessListener { Log.d(TAG, "Firebase Anonymous Auth success: ${it.user?.uid}") }
                    .addOnFailureListener { Log.w(TAG, "Firebase Anonymous Auth failed: ${it.message}") }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed ensuring anonymous auth: ${e.message}")
        }
    }

    /**
     * Real-time Flow observing changes to the active popup image in Firestore.
     */
    fun observeActivePopup(): Flow<ActivePopupInfo?> = callbackFlow {
        ensureAuth()

        val db = firestore
        if (db == null) {
            Log.i(TAG, "Firestore not connected. Running in offline/local asset mode.")
            awaitClose { }
            return@callbackFlow
        }

        val docRef = db.collection(COLLECTION_ACTIVE_POPUP).document(DOC_CURRENT)

        val listener: ListenerRegistration? = try {
            docRef.addSnapshotListener { snapshot: DocumentSnapshot?, error: FirebaseFirestoreException? ->
                if (error != null) {
                    Log.w(TAG, "Error listening to active popup: ${error.message}")
                    return@addSnapshotListener
                }

                if (snapshot != null && snapshot.exists()) {
                    try {
                        val imageUrl = snapshot.getString("imageUrl") ?: ""
                        val imageUrlKo = snapshot.getString("imageUrlKo") ?: imageUrl
                        val imageUrlEn = snapshot.getString("imageUrlEn") ?: imageUrl
                        val imageUrlJa = snapshot.getString("imageUrlJa") ?: imageUrl
                        val version = snapshot.getLong("version") ?: 1L
                        val updatedAt = snapshot.getString("updatedAt") ?: ""
                        val fileName = snapshot.getString("fileName") ?: "active_image.jpg"
                        val fileSize = snapshot.getLong("fileSize") ?: 0L
                        val checksum = snapshot.getString("checksum") ?: ""
                        val bubbleText = snapshot.getString("bubbleText") ?: "이 고기가 어떤 부위인지 궁금하신가요?"
                        val bubbleTextKo = snapshot.getString("bubbleTextKo") ?: bubbleText
                        val bubbleTextEn = snapshot.getString("bubbleTextEn") ?: "Wondering which cut of meat this is?"
                        val bubbleTextJa = snapshot.getString("bubbleTextJa") ?: "このお肉がどの部位か気になりますか？"
                        val autoRebootEnabled = snapshot.getBoolean("autoRebootEnabled") ?: true
                        val autoRebootTime = snapshot.getString("autoRebootTime") ?: "10:00"
                        val screenTimeoutMinutes = snapshot.getLong("screenTimeoutMinutes")?.toInt() ?: 60

                        val popupInfo = ActivePopupInfo(
                            imageUrl = imageUrl,
                            imageUrlKo = imageUrlKo,
                            imageUrlEn = imageUrlEn,
                            imageUrlJa = imageUrlJa,
                            version = version,
                            updatedAt = updatedAt,
                            fileName = fileName,
                            fileSize = fileSize,
                            checksum = checksum,
                            bubbleText = bubbleText,
                            bubbleTextKo = bubbleTextKo,
                            bubbleTextEn = bubbleTextEn,
                            bubbleTextJa = bubbleTextJa,
                            autoRebootEnabled = autoRebootEnabled,
                            autoRebootTime = autoRebootTime,
                            screenTimeoutMinutes = screenTimeoutMinutes
                        )
                        trySend(popupInfo)
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed parsing active popup snapshot: ${e.message}", e)
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed attaching snapshot listener: ${e.message}")
            null
        }

        awaitClose {
            listener?.remove()
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
