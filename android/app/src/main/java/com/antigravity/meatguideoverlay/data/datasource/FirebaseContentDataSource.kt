package com.antigravity.meatguideoverlay.data.datasource

import android.content.Context
import android.util.Log
import com.antigravity.meatguideoverlay.data.model.ContentManifest
import com.antigravity.meatguideoverlay.data.model.DeviceStatus
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.SetOptions
import com.google.gson.Gson
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

class FirebaseContentDataSource(
    private val context: Context,
    private val gson: Gson = Gson()
) {
    companion object {
        private const val TAG = "FirebaseDataSource"
        private const val COLLECTION_PUBLISHED = "published"
        private const val DOC_CURRENT = "current"
        private const val COLLECTION_DEVICES = "devices"
    }

    private val isFirebaseAvailable: Boolean
        get() = try {
            FirebaseApp.getApps(context).isNotEmpty()
        } catch (e: Exception) {
            false
        }

    /**
     * Ensures the tablet is signed in anonymously to Firebase Auth.
     */
    suspend fun ensureAuthenticated(): String? {
        if (!isFirebaseAvailable) return null
        return try {
            val auth = FirebaseAuth.getInstance()
            val user = auth.currentUser ?: auth.signInAnonymously().await().user
            user?.uid
        } catch (e: Exception) {
            Log.w(TAG, "Firebase Anonymous Auth skipped or failed: ${e.message}")
            null
        }
    }

    /**
     * Fetches the latest published content document once.
     */
    suspend fun fetchPublishedContent(): ContentManifest? {
        if (!isFirebaseAvailable) return null
        return try {
            ensureAuthenticated()
            val firestore = FirebaseFirestore.getInstance()
            val snapshot = firestore.collection(COLLECTION_PUBLISHED).document(DOC_CURRENT).get().await()
            if (snapshot.exists()) {
                val data = snapshot.data
                if (data != null) {
                    val json = gson.toJson(data)
                    val manifest = gson.fromJson(json, ContentManifest::class.java)
                    if (manifest != null && manifest.isValid()) {
                        return manifest
                    }
                }
            }
            null
        } catch (e: Exception) {
            Log.w(TAG, "Fetch published content failed: ${e.message}")
            null
        }
    }

    /**
     * Listens to real-time changes of the published/current document.
     */
    fun listenToPublishedContent(): Flow<ContentManifest?> = callbackFlow {
        if (!isFirebaseAvailable) {
            trySend(null)
            awaitClose { }
            return@callbackFlow
        }

        var registration: ListenerRegistration? = null
        try {
            val firestore = FirebaseFirestore.getInstance()
            val docRef = firestore.collection(COLLECTION_PUBLISHED).document(DOC_CURRENT)
            registration = docRef.addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.w(TAG, "Listen failed: ${error.message}")
                    return@addSnapshotListener
                }
                if (snapshot != null && snapshot.exists()) {
                    try {
                        val json = gson.toJson(snapshot.data)
                        val manifest = gson.fromJson(json, ContentManifest::class.java)
                        if (manifest != null && manifest.isValid()) {
                            trySend(manifest)
                        } else {
                            Log.w(TAG, "Received invalid or incomplete manifest from Firestore")
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing Firestore snapshot: ${e.message}")
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed setting up Firestore listener: ${e.message}")
        }

        awaitClose {
            registration?.remove()
        }
    }

    /**
     * Reports device health & status document to Firestore.
     */
    suspend fun reportDeviceStatus(status: DeviceStatus) {
        if (!isFirebaseAvailable) return
        try {
            val uid = ensureAuthenticated() ?: return
            val firestore = FirebaseFirestore.getInstance()
            val payload = mapOf(
                "deviceUid" to uid,
                "deviceName" to status.deviceName,
                "deviceModel" to status.deviceModel,
                "androidVersion" to status.androidVersion,
                "appVersion" to status.appVersion,
                "contentVersion" to status.contentVersion,
                "lastSeenAt" to status.lastSeenAt,
                "lastSyncSuccessAt" to status.lastSyncSuccessAt,
                "lastSyncError" to status.lastSyncError,
                "selectedKioskPackage" to status.selectedKioskPackage
            )
            firestore.collection(COLLECTION_DEVICES).document(uid)
                .set(payload, SetOptions.merge())
                .await()
            Log.d(TAG, "Device status reported for UID: $uid")
        } catch (e: Exception) {
            Log.w(TAG, "Failed reporting device status: ${e.message}")
        }
    }
}
