package com.antigravity.meatguideoverlay.data.datasource

import android.content.Context
import android.graphics.BitmapFactory
import android.util.Log
import com.antigravity.meatguideoverlay.data.model.ActivePopupInfo
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

/**
 * Local Data Source for managing multi-language Active Popup Images and metadata.
 * Handles atomic file writes, offline caching for KO, EN, JA, and asset fallback.
 */
class LocalPopupDataSource(
    private val context: Context,
    private val gson: Gson = Gson()
) {
    companion object {
        private const val TAG = "LocalPopupDataSource"
        private const val METADATA_FILE_NAME = "active_popup.json"
        private const val BUNDLED_DEFAULT_JSON = "default_active_popup.json"
        private const val BUNDLED_DEFAULT_IMAGE = "pork_guide_poster.jpg"
    }

    private val metadataFile: File
        get() = File(context.filesDir, METADATA_FILE_NAME)

    val cachedImageFile: File
        get() = getCachedImageFile("ko")

    fun getCachedImageFile(lang: String): File {
        val sanitizedLang = when (lang.lowercase()) {
            "en" -> "en"
            "ja" -> "ja"
            else -> "ko"
        }
        return File(context.filesDir, "active_popup_image_$sanitizedLang.jpg")
    }

    suspend fun getActivePopupInfo(): ActivePopupInfo = withContext(Dispatchers.IO) {
        try {
            if (metadataFile.exists()) {
                val json = metadataFile.readText(Charsets.UTF_8)
                val info = gson.fromJson(json, ActivePopupInfo::class.java)
                if (info != null && info.isValid()) {
                    return@withContext info
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed reading cached metadata, falling back to assets: ${e.message}")
        }

        loadBundledDefaultInfo()
    }

    suspend fun saveActivePopupInfo(info: ActivePopupInfo): Boolean = withContext(Dispatchers.IO) {
        try {
            val json = gson.toJson(info)
            val tempFile = File(context.filesDir, "$METADATA_FILE_NAME.tmp")
            tempFile.writeText(json, Charsets.UTF_8)
            if (tempFile.renameTo(metadataFile) || (metadataFile.delete() && tempFile.renameTo(metadataFile))) {
                Log.d(TAG, "Active popup info updated to version: ${info.version}")
                return@withContext true
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed writing active popup info: ${e.message}", e)
        }
        false
    }

    /**
     * Ensures offline images are available for all supported languages (KO, EN, JA).
     */
    suspend fun ensureAllLocalImagesAvailable() = withContext(Dispatchers.IO) {
        listOf("ko", "en", "ja").forEach { lang ->
            ensureLocalImageAvailable(lang)
        }
    }

    /**
     * Ensures an offline image is available for the given language.
     * Extracts language-specific bundled asset (KO, EN, JA).
     */
    suspend fun ensureLocalImageAvailable(lang: String = "ko"): File? = withContext(Dispatchers.IO) {
        val targetFile = getCachedImageFile(lang)
        if (targetFile.exists() && targetFile.length() > 0) {
            return@withContext targetFile
        }

        // Try extracting language-specific asset
        val assetName = when (lang.lowercase()) {
            "en" -> "pork_guide_poster_en.jpg"
            "ja" -> "pork_guide_poster_ja.jpg"
            else -> "pork_guide_poster_ko.jpg"
        }

        try {
            val stream = try {
                context.assets.open(assetName)
            } catch (e: Exception) {
                context.assets.open(BUNDLED_DEFAULT_IMAGE)
            }

            stream.use { input ->
                FileOutputStream(targetFile).use { output ->
                    input.copyTo(output)
                }
            }
            Log.d(TAG, "Bundled poster image for $lang copied to cache (${targetFile.length()} bytes).")
            return@withContext targetFile
        } catch (e: Exception) {
            Log.e(TAG, "Failed extracting bundled image for $lang: ${e.message}", e)
        }

        null
    }

    /**
     * Atomically saves newly downloaded image bytes to cache for a language.
     */
    suspend fun saveDownloadedImage(inputStream: InputStream, lang: String = "ko"): Boolean = withContext(Dispatchers.IO) {
        val targetFile = getCachedImageFile(lang)
        val tempFile = File(context.filesDir, "temp_popup_image_$lang.tmp")
        try {
            FileOutputStream(tempFile).use { output ->
                inputStream.copyTo(output)
            }

            if (tempFile.length() <= 0) {
                tempFile.delete()
                return@withContext false
            }

            val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeFile(tempFile.absolutePath, options)
            if (options.outWidth <= 0 || options.outHeight <= 0) {
                Log.e(TAG, "Downloaded file for $lang is not a valid image. Aborting replacement.")
                tempFile.delete()
                return@withContext false
            }

            if (targetFile.exists()) {
                targetFile.delete()
            }
            val success = tempFile.renameTo(targetFile)
            if (success) {
                Log.d(TAG, "Successfully replaced cached active popup image for $lang.")
            }
            return@withContext success
        } catch (e: Exception) {
            Log.e(TAG, "Failed saving downloaded image for $lang: ${e.message}", e)
            if (tempFile.exists()) tempFile.delete()
            false
        }
    }

    private fun loadBundledDefaultInfo(): ActivePopupInfo {
        return try {
            val json = context.assets.open(BUNDLED_DEFAULT_JSON).bufferedReader().use { it.readText() }
            gson.fromJson(json, ActivePopupInfo::class.java) ?: ActivePopupInfo()
        } catch (e: Exception) {
            Log.e(TAG, "Failed reading bundled asset json: ${e.message}")
            ActivePopupInfo()
        }
    }
}
