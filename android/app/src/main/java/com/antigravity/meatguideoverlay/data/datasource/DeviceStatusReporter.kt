package com.antigravity.meatguideoverlay.data.datasource

import android.content.Context
import android.os.Build
import android.util.Log
import com.antigravity.meatguideoverlay.BuildConfig
import com.antigravity.meatguideoverlay.util.PreferencesManager
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.tasks.await

/** Reports the tablet identity and installed app version for the admin console. */
class DeviceStatusReporter(context: Context) {
    companion object {
        private const val TAG = "DeviceStatusReporter"
        private const val COLLECTION_DEVICES = "devices"
    }

    private val appContext = context.applicationContext
    private val preferencesManager = PreferencesManager(appContext)

    suspend fun report(contentVersion: Long) {
        try {
            val auth = FirebaseAuth.getInstance()
            val user = auth.currentUser ?: auth.signInAnonymously().await().user
            val deviceUid = user?.uid ?: return
            val deviceName = preferencesManager.deviceNameFlow.first().ifBlank { "미지정 태블릿" }
            val deviceData = mapOf(
                "deviceUid" to deviceUid,
                "deviceName" to deviceName,
                "appVersionCode" to BuildConfig.VERSION_CODE,
                "appVersionName" to BuildConfig.VERSION_NAME,
                "contentVersion" to contentVersion,
                "model" to "${Build.MANUFACTURER} ${Build.MODEL}".trim(),
                "androidVersion" to Build.VERSION.RELEASE,
                "serviceState" to "RUNNING",
                "lastSeen" to FieldValue.serverTimestamp()
            )
            FirebaseFirestore.getInstance()
                .collection(COLLECTION_DEVICES)
                .document(deviceUid)
                .set(deviceData, SetOptions.merge())
                .await()
        } catch (error: Exception) {
            // Status reporting must never interrupt the overlay service.
            Log.w(TAG, "Failed reporting device status: ${error.message}")
        }
    }
}
