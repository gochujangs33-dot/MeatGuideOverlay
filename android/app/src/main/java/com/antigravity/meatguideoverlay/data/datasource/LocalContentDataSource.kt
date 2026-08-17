package com.antigravity.meatguideoverlay.data.datasource

import android.content.Context
import android.util.Log
import com.antigravity.meatguideoverlay.data.model.ContentManifest
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.InputStreamReader

class LocalContentDataSource(
    private val context: Context,
    private val gson: Gson = Gson()
) {
    companion object {
        private const val TAG = "LocalContentDataSource"
        private const val CACHE_DIR_NAME = "content_cache"
        private const val CONTENT_FILE_NAME = "content.json"
        private const val DEFAULT_ASSET_NAME = "default_content.json"
    }

    private val cacheDir: File by lazy {
        File(context.filesDir, CACHE_DIR_NAME).apply {
            if (!exists()) mkdirs()
        }
    }

    private val contentFile: File by lazy {
        File(cacheDir, CONTENT_FILE_NAME)
    }

    /**
     * Loads the latest valid local content:
     * 1. From persistent disk cache (content.json) if valid.
     * 2. Otherwise falls back to bundled default_content.json from assets.
     */
    suspend fun loadLocalContent(): ContentManifest = withContext(Dispatchers.IO) {
        try {
            if (contentFile.exists() && contentFile.length() > 0) {
                val json = contentFile.readText(Charsets.UTF_8)
                val manifest = gson.fromJson(json, ContentManifest::class.java)
                if (manifest != null && manifest.isValid()) {
                    Log.d(TAG, "Loaded content from disk cache (v${manifest.contentVersion})")
                    return@withContext manifest
                }
                Log.w(TAG, "Cached content.json was invalid or corrupt. Falling back to asset.")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed reading cached content file: ${e.message}", e)
        }

        // Fallback to bundled asset
        return@withContext loadBundledAsset()
    }

    /**
     * Loads default content from app assets.
     */
    fun loadBundledAsset(): ContentManifest {
        return try {
            context.assets.open(DEFAULT_ASSET_NAME).use { inputStream ->
                InputStreamReader(inputStream, Charsets.UTF_8).use { reader ->
                    val manifest = gson.fromJson(reader, ContentManifest::class.java)
                    if (manifest != null && manifest.isValid()) {
                        manifest
                    } else {
                        ContentManifest()
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed reading asset $DEFAULT_ASSET_NAME: ${e.message}", e)
            ContentManifest()
        }
    }

    /**
     * Atomically saves new content manifest to disk cache.
     * Writes to a temporary file first, then atomically renames it.
     */
    suspend fun saveContentAtomically(manifest: ContentManifest): Boolean = withContext(Dispatchers.IO) {
        if (!manifest.isValid()) {
            Log.e(TAG, "Cannot save invalid manifest (v${manifest.contentVersion})")
            return@withContext false
        }

        val tempFile = File(cacheDir, "${CONTENT_FILE_NAME}.tmp")
        try {
            val json = gson.toJson(manifest)
            FileOutputStream(tempFile).use { fos ->
                fos.write(json.toByteArray(Charsets.UTF_8))
                fos.flush()
            }

            // Atomic rename
            if (tempFile.exists()) {
                if (contentFile.exists()) {
                    contentFile.delete()
                }
                val renamed = tempFile.renameTo(contentFile)
                Log.d(TAG, "Content successfully saved atomically: $renamed (v${manifest.contentVersion})")
                return@withContext renamed
            }
            return@withContext false
        } catch (e: Exception) {
            Log.e(TAG, "Atomic save failed: ${e.message}", e)
            if (tempFile.exists()) tempFile.delete()
            return@withContext false
        }
    }
}
