package com.antigravity.meatguideoverlay.data.repository

import android.content.Context
import android.util.Log
import com.antigravity.meatguideoverlay.data.datasource.FirebasePopupDataSource
import com.antigravity.meatguideoverlay.data.datasource.LocalPopupDataSource
import com.antigravity.meatguideoverlay.data.datasource.PopupLocalStore
import com.antigravity.meatguideoverlay.data.datasource.PopupRemoteSource
import com.antigravity.meatguideoverlay.data.model.ActivePopupInfo
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File

/**
 * Repository orchestrating local caching and remote real-time updates for multi-language active popup images.
 */
class PopupImageRepository(
    private val localDataSource: PopupLocalStore,
    private val firebaseDataSource: PopupRemoteSource = FirebasePopupDataSource(),
    private val externalScope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
) {
    companion object {
        private const val TAG = "PopupImageRepository"
        private const val INITIAL_RETRY_DELAY_MS = 30_000L
        private const val MAX_RETRY_DELAY_MS = 10 * 60_000L

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
            // 1. Ensure local fallback images for all 3 languages are ready
            localDataSource.ensureAllLocalImagesAvailable()
            val initialImageFile = localDataSource.getCachedImageFile("ko")
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
            // collectLatest: a newer snapshot cancels the retry loop of an older one.
            firebaseDataSource.observeActivePopup().collectLatest { remoteInfo ->
                if (remoteInfo == null) return@collectLatest
                applyWhenImagesReady(remoteInfo)
            }
        }
    }

    /**
     * Applies [remoteInfo] only after every poster it references is cached. A failed
     * download is retried with backoff instead of being skipped, so the tablet never
     * reports a content version whose posters it does not actually have.
     */
    private suspend fun applyWhenImagesReady(remoteInfo: ActivePopupInfo) {
        var attempt = 0
        while (!downloadMissingImages(remoteInfo)) {
            val waitMs = retryDelayMs(attempt++)
            Log.w(TAG, "Popup images for v${remoteInfo.version} incomplete; retrying in ${waitMs / 1000}s")
            delay(waitMs)
        }

        if (remoteInfo != _activePopupState.value) {
            localDataSource.saveActivePopupInfo(remoteInfo)
            _activePopupState.value = remoteInfo
            Log.d(TAG, "Applied remote popup v${remoteInfo.version}")
        }
        _imageFileState.value = localDataSource.getCachedImageFile("ko")
    }

    /** Downloads each poster whose URL differs from the cached one; true when none failed. */
    private suspend fun downloadMissingImages(remoteInfo: ActivePopupInfo): Boolean {
        val imageUrls = listOf(
            "ko" to remoteInfo.getEffectiveKoreanUrl(),
            "en" to remoteInfo.imageUrlEn,
            "ja" to remoteInfo.imageUrlJa
        )
        var allCached = true
        for ((lang, url) in imageUrls) {
            // Bundled asset names and relative paths have nothing to download.
            if (!isDownloadableImageUrl(url) || localDataSource.hasImageFrom(lang, url)) continue

            val saved = try {
                val stream = firebaseDataSource.downloadImageStream(url)
                stream != null && localDataSource.saveDownloadedImage(stream, lang, url)
            } catch (e: Exception) {
                Log.w(TAG, "Failed downloading ${lang.uppercase()} image: ${e.message}")
                false
            }
            if (!saved) allCached = false
        }
        return allCached
    }

    private fun isDownloadableImageUrl(url: String): Boolean =
        url.startsWith("https://", ignoreCase = true) || url.startsWith("data:image/", ignoreCase = true)

    private fun retryDelayMs(attempt: Int): Long =
        (INITIAL_RETRY_DELAY_MS shl attempt.coerceAtMost(5)).coerceAtMost(MAX_RETRY_DELAY_MS)

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
