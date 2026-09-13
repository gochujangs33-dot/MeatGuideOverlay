package com.antigravity.meatguideoverlay.util

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.antigravity.meatguideoverlay.worker.OverlayServiceWatchdogWorker
import java.util.concurrent.TimeUnit

/** OS-managed recovery jobs for restoring the overlay after an unexpected process stop. */
object OverlayServiceWatchdog {
    private const val PERIODIC_WORK_NAME = "overlay_service_periodic_watchdog"
    private const val IMMEDIATE_WORK_NAME = "overlay_service_immediate_recovery"

    fun schedulePeriodic(context: Context) {
        val request = PeriodicWorkRequestBuilder<OverlayServiceWatchdogWorker>(
            15,
            TimeUnit.MINUTES
        )
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .build()

        WorkManager.getInstance(context.applicationContext).enqueueUniquePeriodicWork(
            PERIODIC_WORK_NAME,
            ExistingPeriodicWorkPolicy.UPDATE,
            request
        )
    }

    fun requestImmediateCheck(context: Context) {
        val request = OneTimeWorkRequestBuilder<OverlayServiceWatchdogWorker>()
            .setInitialDelay(5, TimeUnit.SECONDS)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .build()

        WorkManager.getInstance(context.applicationContext).enqueueUniqueWork(
            IMMEDIATE_WORK_NAME,
            ExistingWorkPolicy.REPLACE,
            request
        )
    }
}
