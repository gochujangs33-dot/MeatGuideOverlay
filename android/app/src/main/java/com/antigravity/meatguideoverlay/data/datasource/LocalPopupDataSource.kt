package com.antigravity.meatguideoverlay.data.datasource

import android.content.Context
import android.graphics.Bitmap
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
 * Local Data Source for managing the single Active Popup Image and metadata.
 * Handles atomic file writes, offline caching, and asset fallback.
 */
class LocalPopupDataSource(
    private val context: Context,
    private val gson: Gson = Gson()
) {
    companion object {
        private const val TAG = "LocalPopupDataSource"
        private const val METADATA_FILE_NAME = "active_popup.json"
        private const val CACHED_IMAGE_FILE_NAME = "active_popup_image.jpg"
        private const val TEMP_IMAGE_FILE_NAME = "temp_popup_image.tmp"
        private const val BUNDLED_DEFAULT_JSON = "default_active_popup.json"
        private const val BUNDLED_DEFAULT_IMAGE = "pork_guide_poster.jpg"
    }

    private val metadataFile: File
        get() = File(context.filesDir, METADATA_FILE_NAME)

    val cachedImageFile: File
        get() = File(context.filesDir, CACHED_IMAGE_FILE_NAME)

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

        // Fallback to bundled asset default
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
     * Ensures an offline image is always available.
     * If cachedImageFile doesn't exist, copies the bundled default poster asset.
     */
    suspend fun ensureLocalImageAvailable(): File? = withContext(Dispatchers.IO) {
        if (cachedImageFile.exists() && cachedImageFile.length() > 0) {
            return@withContext cachedImageFile
        }

        // Copy default image from assets
        try {
            context.assets.open(BUNDLED_DEFAULT_IMAGE).use { input ->
                FileOutputStream(cachedImageFile).use { output ->
                    input.copyTo(output)
                }
            }
            Log.d(TAG, "Default bundled poster image copied to cache.")
            return@withContext cachedImageFile
        } catch (e: Exception) {
            Log.e(TAG, "Failed extracting bundled image: ${e.message}", e)
        }
        null
    }

    /**
     * Atomically saves newly downloaded image bytes to cache.
     */
    suspend fun saveDownloadedImage(inputStream: InputStream): Boolean = withContext(Dispatchers.IO) {
        val tempFile = File(context.filesDir, TEMP_IMAGE_FILE_NAME)
        try {
            FileOutputStream(tempFile).use { output ->
                inputStream.copyTo(output)
            }

            if (tempFile.length() <= 0) {
                tempFile.delete()
                return@withContext false
            }

            // Verify image integrity by decoding bounds
            val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeFile(tempFile.absolutePath, options)
            if (options.outWidth <= 0 || options.outHeight <= 0) {
                Log.e(TAG, "Downloaded file is not a valid image. Aborting replacement.")
                tempFile.delete()
                return@withContext false
            }

            // Atomic replace
            if (cachedImageFile.exists()) {
                cachedImageFile.delete()
            }
            val success = tempFile.renameTo(cachedImageFile)
            if (success) {
                Log.d(TAG, "Successfully replaced cached active popup image.")
            }
            return@withContext success
        } catch (e: Exception) {
            Log.e(TAG, "Failed saving downloaded image: ${e.message}", e)
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
