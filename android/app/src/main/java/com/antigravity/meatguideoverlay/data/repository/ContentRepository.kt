package com.antigravity.meatguideoverlay.data.repository

import android.content.Context
import android.os.Build
import android.util.Log
import com.antigravity.meatguideoverlay.BuildConfig
import com.antigravity.meatguideoverlay.data.datasource.FirebaseContentDataSource
import com.antigravity.meatguideoverlay.data.datasource.LocalContentDataSource
import com.antigravity.meatguideoverlay.data.model.ContentManifest
import com.antigravity.meatguideoverlay.data.model.DeviceStatus
import com.antigravity.meatguideoverlay.util.PreferencesManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class ContentRepository(
    private val context: Context,
    private val localDataSource: LocalContentDataSource = LocalContentDataSource(context),
    private val remoteDataSource: FirebaseContentDataSource = FirebaseContentDataSource(context),
    private val preferencesManager: PreferencesManager = PreferencesManager(context),
    private val scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
) {
    companion object {
        private const val TAG = "ContentRepository"

        @Volatile
        private var instance: ContentRepository? = null

        fun getInstance(context: Context): ContentRepository {
            return instance ?: synchronized(this) {
                instance ?: ContentRepository(context.applicationContext).also { instance = it }
            }
        }
    }

    private val _contentFlow = MutableStateFlow(localDataSource.loadBundledAsset())
    val contentFlow: StateFlow<ContentManifest> = _contentFlow.asStateFlow()

    init {
        scope.launch {
            // 1. Immediately load local cached content
            val local = localDataSource.loadLocalContent()
            _contentFlow.value = local

            // 2. Start listening to live Firebase updates
            startLiveUpdates()
        }
    }

    private fun startLiveUpdates() {
        scope.launch {
            try {
                remoteDataSource.listenToPublishedContent().collect { remoteManifest ->
                    if (remoteManifest != null && remoteManifest.isValid()) {
                        val current = _contentFlow.value
                        if (remoteManifest.contentVersion > current.contentVersion) {
                            Log.i(TAG, "New content version detected: v${remoteManifest.contentVersion} (current: v${current.contentVersion})")
                            applyNewContent(remoteManifest)
                        }
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Live update stream error: ${e.message}")
            }
        }
    }

    /**
     * Manual sync trigger.
     */
    suspend fun syncNow(): Result<ContentManifest> {
        return try {
            val remote = remoteDataSource.fetchPublishedContent()
            if (remote != null && remote.isValid()) {
                val current = _contentFlow.value
                if (remote.contentVersion >= current.contentVersion) {
                    applyNewContent(remote)
                    preferencesManager.recordSyncResult(true, version = remote.contentVersion)
                    reportStatus(remote.contentVersion)
                    return Result.success(remote)
                }
                Result.success(current)
            } else {
                // Fallback to local
                val local = localDataSource.loadLocalContent()
                _contentFlow.value = local
                preferencesManager.recordSyncResult(true, version = local.contentVersion)
                Result.success(local)
            }
        } catch (e: Exception) {
            val errMsg = e.message ?: "Unknown sync error"
            Log.e(TAG, "Sync failed: $errMsg", e)
            preferencesManager.recordSyncResult(false, errorMsg = errMsg)
            Result.failure(e)
        }
    }

    private suspend fun applyNewContent(manifest: ContentManifest) {
        val saved = localDataSource.saveContentAtomically(manifest)
        if (saved) {
            _contentFlow.value = manifest
            Log.d(TAG, "Applied and cached new content v${manifest.contentVersion}")
        }
    }

    suspend fun reportStatus(currentVersion: Long = _contentFlow.value.contentVersion) {
        try {
            val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            val nowStr = isoFormat.format(Date())
            val kioskPkg = preferencesManager.getSelectedKioskPackage()
            val status = DeviceStatus(
                deviceName = "태블릿-1",
                deviceModel = "${Build.MANUFACTURER} ${Build.MODEL}",
                androidVersion = "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})",
                appVersion = "${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})",
                contentVersion = currentVersion,
                lastSeenAt = nowStr,
                lastSyncSuccessAt = nowStr,
                selectedKioskPackage = kioskPkg
            )
            remoteDataSource.reportDeviceStatus(status)
        } catch (e: Exception) {
            Log.w(TAG, "Status reporting failed: ${e.message}")
        }
    }
}
