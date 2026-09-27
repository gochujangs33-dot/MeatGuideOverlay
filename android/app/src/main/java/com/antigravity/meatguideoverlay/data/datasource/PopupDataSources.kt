package com.antigravity.meatguideoverlay.data.datasource

import com.antigravity.meatguideoverlay.data.model.ActivePopupInfo
import kotlinx.coroutines.flow.Flow
import java.io.File
import java.io.InputStream

/** On-device cache of the popup metadata and the per-language poster images. */
interface PopupLocalStore {
    suspend fun ensureAllLocalImagesAvailable()
    suspend fun ensureLocalImageAvailable(lang: String = "ko"): File?
    fun getCachedImageFile(lang: String): File
    suspend fun getActivePopupInfo(): ActivePopupInfo
    suspend fun saveActivePopupInfo(info: ActivePopupInfo): Boolean

    /** Replaces the cached poster for [lang]; returns false if the bytes are not a valid image. */
    suspend fun saveDownloadedImage(inputStream: InputStream, lang: String, sourceUrl: String): Boolean

    /** True when the cached poster for [lang] was downloaded from [sourceUrl]. */
    suspend fun hasImageFrom(lang: String, sourceUrl: String): Boolean
}

/** Server-side source of the active popup configuration and its poster images. */
interface PopupRemoteSource {
    fun observeActivePopup(): Flow<ActivePopupInfo?>

    /** Reads the current configuration directly from the server; null when unreachable. */
    suspend fun fetchActivePopup(): ActivePopupInfo?

    /** Opens the poster at [imageUrl], or returns null when it cannot be downloaded. */
    fun downloadImageStream(imageUrl: String): InputStream?
}
