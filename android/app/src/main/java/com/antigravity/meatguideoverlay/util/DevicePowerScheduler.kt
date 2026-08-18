package com.antigravity.meatguideoverlay.util

import android.app.AlarmManager
import android.app.PendingIntent
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.antigravity.meatguideoverlay.receiver.DailyRebootReceiver
import com.antigravity.meatguideoverlay.service.OverlayForegroundService
import java.util.Calendar

/**
 * Utility orchestrating daily scheduled reboot and device memory optimization.
 * 
 * Supports 3 execution tiers:
 * 1. Device Owner Mode (MDM / Kiosk tablets): Triggers hardware reboot via DevicePolicyManager.reboot()
 * 2. Root Mode: Triggers hardware reboot via "su -c reboot"
 * 3. Standard App Mode: Performs comprehensive memory cleanup, service restart, and cache refresh.
 */
object DevicePowerScheduler {
    private const val TAG = "DevicePowerScheduler"
    const val ACTION_DAILY_REBOOT = "com.antigravity.meatguideoverlay.ACTION_DAILY_REBOOT"
    private const val REBOOT_ALARM_REQ_CODE = 9921

    /**
     * Schedules or cancels daily reboot based on configuration.
     * @param timeString 24-hour time format, e.g., "10:00"
     */
    fun scheduleDailyReboot(context: Context, enabled: Boolean, timeString: String = "10:00") {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
        if (alarmManager == null) {
            Log.e(TAG, "AlarmManager not available")
            return
        }

        val intent = Intent(context, DailyRebootReceiver::class.java).apply {
            action = ACTION_DAILY_REBOOT
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            REBOOT_ALARM_REQ_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        if (!enabled) {
            alarmManager.cancel(pendingIntent)
            Log.d(TAG, "Daily auto-reboot scheduler CANCELLED by configuration")
            return
        }

        // Parse hour & minute (e.g. "10:00")
        val parts = timeString.split(":")
        val targetHour = parts.getOrNull(0)?.toIntOrNull() ?: 10
        val targetMinute = parts.getOrNull(1)?.toIntOrNull() ?: 0

        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, targetHour)
            set(Calendar.MINUTE, targetMinute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)

            // If target time already passed today, schedule for tomorrow
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }

        val triggerAtMillis = calendar.timeInMillis
        Log.i(TAG, "Scheduling next daily auto-reboot for: ${calendar.time} (in ${(triggerAtMillis - System.currentTimeMillis()) / 1000 / 60} minutes)")

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis,
                    pendingIntent
                )
            }
        } catch (e: Exception) {
            Log.w(TAG, "Exact alarm permission or setting failed, fallback to standard alarm: ${e.message}")
            try {
                alarmManager.set(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis,
                    pendingIntent
                )
            } catch (ex: Exception) {
                Log.e(TAG, "Failed setting fallback alarm: ${ex.message}")
            }
        }
    }

    /**
     * Executes the daily reboot or memory refresh action.
     */
    fun executeRebootOrRefresh(context: Context) {
        Log.i(TAG, "=== Executing Scheduled Daily Device Reboot / Refresh ===")

        // 1. Check Device Owner
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager
        if (dpm != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            try {
                if (dpm.isDeviceOwnerApp(context.packageName)) {
                    Log.i(TAG, "Device Owner active -> executing DevicePolicyManager.reboot()")
                    val adminComponent = ComponentName(context, DailyRebootReceiver::class.java)
                    dpm.reboot(adminComponent)
                    return
                }
            } catch (e: Exception) {
                Log.w(TAG, "DevicePolicyManager.reboot failed: ${e.message}")
            }
        }

        // 2. Check Root Access
        try {
            val process = Runtime.getRuntime().exec(arrayOf("su", "-c", "reboot"))
            val exitCode = process.waitFor()
            if (exitCode == 0) {
                Log.i(TAG, "Root reboot command executed successfully")
                return
            }
        } catch (e: Exception) {
            Log.d(TAG, "Root reboot not available on this device: ${e.message}")
        }

        // 3. Fallback: Clean Service & Memory Refresh
        Log.i(TAG, "Performing Clean Soft Refresh (Service restart & memory optimization)")
        try {
            System.gc()
            val serviceIntent = Intent(context, OverlayForegroundService::class.java).apply {
                action = OverlayForegroundService.ACTION_REFRESH
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Soft refresh failed: ${e.message}", e)
        }
    }
}
