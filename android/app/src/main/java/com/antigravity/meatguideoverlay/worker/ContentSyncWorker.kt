package com.antigravity.meatguideoverlay.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.antigravity.meatguideoverlay.data.repository.PopupImageRepository

class ContentSyncWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    companion object {
        private const val TAG = "ContentSyncWorker"
        const val WORK_NAME = "periodic_content_sync_work"
    }

    override suspend fun doWork(): Result {
        Log.d(TAG, "ContentSyncWorker running periodic background check")
        return try {
            val repository = com.antigravity.meatguideoverlay.data.repository.PopupImageRepository.getInstance(applicationContext)
            val success = repository.refreshSync()
            if (success) {
                Result.success()
            } else {
                Result.retry()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Sync work failed: ${e.message}", e)
            Result.retry()
        }
    }
}
