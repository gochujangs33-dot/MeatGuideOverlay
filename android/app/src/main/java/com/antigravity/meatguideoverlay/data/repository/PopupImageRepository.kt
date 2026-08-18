package com.antigravity.meatguideoverlay.data.repository

import android.content.Context
import android.util.Log
import com.antigravity.meatguideoverlay.data.datasource.FirebasePopupDataSource
import com.antigravity.meatguideoverlay.data.datasource.LocalPopupDataSource
import com.antigravity.meatguideoverlay.data.model.ActivePopupInfo
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File

/**
 * Repository orchestrating local caching and remote real-time updates for multi-language active popup images.
 */
class PopupImageRepository(
    private val localDataSource: LocalPopupDataSource,
    private val firebaseDataSource: FirebasePopupDataSource = FirebasePopupDataSource(),
    private val externalScope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
) {
    companion object {
        private const val TAG = "PopupImageRepository"

        @Volatile
        private var instance: PopupImageRepository? = null

        fun getInstance(context: Context): PopupImageRepository {
            return instance ?: synchronized(this) {
                instance ?: PopupImageRepository(
                    localDataSource = LocalPopupDataSource(context.applicationContext)
                ).also { instance = it }
            }
        }
    }

    private val _activePopupState = MutableStateFlow<ActivePopupInfo>(ActivePopupInfo())
    val activePopupState: StateFlow<ActivePopupInfo> = _activePopupState.asStateFlow()

    private val _imageFileState = MutableStateFlow<File?>(null)
    val imageFileState: StateFlow<File?> = _imageFileState.asStateFlow()

    init {
        initializeRepository()
    }

    private fun initializeRepository() {
        externalScope.launch {
            // 1. Ensure local fallback image is ready
            val initialImageFile = localDataSource.ensureLocalImageAvailable("ko")
            _imageFileState.value = initialImageFile

            // 2. Load local metadata
            val initialInfo = localDataSource.getActivePopupInfo()
            _activePopupState.value = initialInfo
            Log.d(TAG, "Loaded initial active popup info: version ${initialInfo.version}")

            // 3. Start observing remote updates
            observeRemoteUpdates()
        }
    }

    private fun observeRemoteUpdates() {
        externalScope.launch {
            firebaseDataSource.observeActivePopup().collect { remoteInfo ->
                if (remoteInfo == null) return@collect

                val currentInfo = _activePopupState.value
                if (remoteInfo.version > currentInfo.version) {
                    Log.d(TAG, "New remote image/config detected (v${remoteInfo.version}). Starting multi-language downloads...")
                    downloadAndApplyRemoteImages(remoteInfo)
                } else if (remoteInfo != currentInfo) {
                    Log.d(TAG, "Remote metadata/settings updated without version bump. Applying locally...")
                    localDataSource.saveActivePopupInfo(remoteInfo)
                    _activePopupState.value = remoteInfo
                }
            }
        }
    }

    private suspend fun downloadAndApplyRemoteImages(remoteInfo: ActivePopupInfo) {
        // Download KO
        val koUrl = remoteInfo.getEffectiveKoreanUrl()
        if (koUrl.isNotBlank() && !koUrl.startsWith("assets/")) {
            try {
                val stream = firebaseDataSource.downloadImageStream(koUrl)
                if (stream != null) {
                    localDataSource.saveDownloadedImage(stream, "ko")
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed downloading KO image: ${e.message}")
            }
        }

        // Download EN
        if (remoteInfo.imageUrlEn.isNotBlank() && !remoteInfo.imageUrlEn.startsWith("assets/")) {
            try {
                val stream = firebaseDataSource.downloadImageStream(remoteInfo.imageUrlEn)
                if (stream != null) {
                    localDataSource.saveDownloadedImage(stream, "en")
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed downloading EN image: ${e.message}")
            }
        }

        // Download JA
        if (remoteInfo.imageUrlJa.isNotBlank() && !remoteInfo.imageUrlJa.startsWith("assets/")) {
            try {
                val stream = firebaseDataSource.downloadImageStream(remoteInfo.imageUrlJa)
                if (stream != null) {
                    localDataSource.saveDownloadedImage(stream, "ja")
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed downloading JA image: ${e.message}")
            }
        }

        localDataSource.saveActivePopupInfo(remoteInfo)
        _activePopupState.value = remoteInfo
        _imageFileState.value = localDataSource.getCachedImageFile("ko")
        Log.d(TAG, "Successfully downloaded and applied remote popup images v${remoteInfo.version}")
    }

    suspend fun refreshSync(): Boolean {
        val file = localDataSource.ensureLocalImageAvailable("ko")
        _imageFileState.value = file
        val info = localDataSource.getActivePopupInfo()
        _activePopupState.value = info
        return file != null
    }

    fun getCurrentImageFile(lang: String = "ko"): File? {
        val target = localDataSource.getCachedImageFile(lang)
        if (target.exists() && target.length() > 0) return target
        val ko = localDataSource.getCachedImageFile("ko")
        if (ko.exists() && ko.length() > 0) return ko
        return _imageFileState.value
    }
}
