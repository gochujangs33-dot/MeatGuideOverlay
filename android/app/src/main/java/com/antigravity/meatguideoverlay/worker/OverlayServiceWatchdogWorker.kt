package com.antigravity.meatguideoverlay.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.antigravity.meatguideoverlay.service.OverlayForegroundService
import com.antigravity.meatguideoverlay.util.PreferencesManager

/** Restarts the customer-facing overlay when Android has removed its process. */
class OverlayServiceWatchdogWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    companion object {
        private const val TAG = "OverlayWatchdog"
    }

    override suspend fun doWork(): Result {
        if (!PreferencesManager(applicationContext).isSetupCompleted()) {
            return Result.success()
        }

        if (OverlayForegroundService.isRunning()) {
            return Result.success()
        }

        return try {
            OverlayForegroundService.startService(applicationContext)
            Log.i(TAG, "Overlay service recovery requested")
            Result.success()
        } catch (error: Exception) {
            Log.w(TAG, "Android temporarily blocked overlay recovery: ${error.message}")
            Result.retry()
        }
    }
}
