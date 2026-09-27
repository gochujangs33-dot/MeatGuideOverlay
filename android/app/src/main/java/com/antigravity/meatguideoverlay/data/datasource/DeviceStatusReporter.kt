package com.antigravity.meatguideoverlay.data.datasource

import android.content.Context
import android.os.Build
import android.provider.Settings
import android.util.Log
import com.antigravity.meatguideoverlay.BuildConfig
import com.antigravity.meatguideoverlay.data.model.ActivePopupInfo
import com.antigravity.meatguideoverlay.service.KioskErrorAccessibilityService
import com.antigravity.meatguideoverlay.util.PreferencesManager
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.tasks.await
import java.util.Date

/** Reports the tablet identity and installed app version for the admin console. */
class DeviceStatusReporter(context: Context) {
    companion object {
        private const val TAG = "DeviceStatusReporter"
        private const val COLLECTION_DEVICES = "devices"
    }

    private val appContext = context.applicationContext
    private val preferencesManager = PreferencesManager(appContext)

    suspend fun report(popupInfo: ActivePopupInfo) {
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
                "contentVersion" to popupInfo.version,
                "contentUpdatedAt" to popupInfo.updatedAt,
                "appUpdatedAt" to Date(appLastUpdateTime()),
                "kioskPackage" to preferencesManager.getSelectedKioskPackage(),
                "autoLaunchKiosk" to preferencesManager.autoLaunchKioskFlow.first(),
                "overlayPermission" to Settings.canDrawOverlays(appContext),
                "accessibilityEnabled" to KioskErrorAccessibilityService.isServiceRunning,
                "writeSettingsPermission" to Settings.System.canWrite(appContext),
                "popupAutoCloseMinutes" to popupInfo.popupAutoCloseMinutes,
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

    /** When this APK was installed or last updated on the tablet. */
    private fun appLastUpdateTime(): Long =
        appContext.packageManager.getPackageInfo(appContext.packageName, 0).lastUpdateTime
}
