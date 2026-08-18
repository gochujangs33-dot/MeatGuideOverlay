package com.antigravity.meatguideoverlay.receiver

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.antigravity.meatguideoverlay.data.repository.PopupImageRepository
import com.antigravity.meatguideoverlay.util.DevicePowerScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Broadcast and Device Admin Receiver handling daily scheduled device reboots and system boot events.
 */
class DailyRebootReceiver : DeviceAdminReceiver() {

    companion object {
        private const val TAG = "DailyRebootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        val action = intent.action
        Log.d(TAG, "DailyRebootReceiver received action: $action")

        when (action) {
            DevicePowerScheduler.ACTION_DAILY_REBOOT -> {
                Log.i(TAG, "Triggering scheduled reboot / memory refresh...")
                DevicePowerScheduler.executeRebootOrRefresh(context)

                // Reschedule for next day
                CoroutineScope(Dispatchers.IO).launch {
                    try {
                        val repo = PopupImageRepository.getInstance(context)
                        val config = repo.activePopupState.value
                        DevicePowerScheduler.scheduleDailyReboot(
                            context = context,
                            enabled = config.autoRebootEnabled,
                            timeString = config.autoRebootTime
                        )
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed rescheduling next daily reboot: ${e.message}")
                    }
                }
            }

            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED -> {
                Log.i(TAG, "Device booted or app replaced -> initializing daily reboot scheduler")
                CoroutineScope(Dispatchers.IO).launch {
                    try {
                        val repo = PopupImageRepository.getInstance(context)
                        val config = repo.activePopupState.value
                        DevicePowerScheduler.scheduleDailyReboot(
                            context = context,
                            enabled = config.autoRebootEnabled,
                            timeString = config.autoRebootTime
                        )
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed scheduling reboot after boot: ${e.message}")
                    }
                }
            }
        }
    }
}
