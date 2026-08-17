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
 * Repository orchestrating local caching and remote real-time updates for the single active popup image.
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
            val initialImageFile = localDataSource.ensureLocalImageAvailable()
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
                    Log.d(TAG, "New remote image detected (v${remoteInfo.version}). Starting download...")
                    downloadAndApplyRemoteImage(remoteInfo)
                } else if (remoteInfo.bubbleText != currentInfo.bubbleText) {
                    // Update bubble text if changed
                    localDataSource.saveActivePopupInfo(remoteInfo)
                    _activePopupState.value = remoteInfo
                }
            }
        }
    }

    private suspend fun downloadAndApplyRemoteImage(remoteInfo: ActivePopupInfo) {
        if (remoteInfo.imageUrl.isBlank() || remoteInfo.imageUrl.startsWith("assets/")) {
            localDataSource.saveActivePopupInfo(remoteInfo)
            _activePopupState.value = remoteInfo
            return
        }

        try {
            val stream = firebaseDataSource.downloadImageStream(remoteInfo.imageUrl)
            if (stream != null) {
                val saved = localDataSource.saveDownloadedImage(stream)
                if (saved) {
                    localDataSource.saveActivePopupInfo(remoteInfo)
                    _activePopupState.value = remoteInfo
                    _imageFileState.value = localDataSource.cachedImageFile
                    Log.d(TAG, "Successfully downloaded and applied remote popup image v${remoteInfo.version}")
                } else {
                    Log.w(TAG, "Failed verifying downloaded image. Keeping previous cache.")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception during remote image download: ${e.message}", e)
        }
    }

    suspend fun refreshSync(): Boolean {
        val file = localDataSource.ensureLocalImageAvailable()
        _imageFileState.value = file
        val info = localDataSource.getActivePopupInfo()
        _activePopupState.value = info
        return file != null
    }

    fun getCurrentImageFile(): File? {
        return _imageFileState.value ?: localDataSource.cachedImageFile.takeIf { it.exists() }
    }
}
