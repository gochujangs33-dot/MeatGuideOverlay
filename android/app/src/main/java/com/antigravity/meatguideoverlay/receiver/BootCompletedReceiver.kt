package com.antigravity.meatguideoverlay.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.antigravity.meatguideoverlay.service.OverlayForegroundService
import com.antigravity.meatguideoverlay.util.PreferencesManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import com.antigravity.meatguideoverlay.util.OverlayServiceWatchdog

class BootCompletedReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootCompletedReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_LOCKED_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED
        ) {
            Log.i(TAG, "Boot or package update event received: $action")
            OverlayServiceWatchdog.schedulePeriodic(context)
            val preferencesManager = PreferencesManager(context)
            val pendingResult = goAsync()

            CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
                try {
                    val isSetupDone = preferencesManager.isSetupCompleted()
                    if (isSetupDone) {
                        OverlayForegroundService.startService(context)
                        Log.i(TAG, "OverlayForegroundService started successfully on boot")

                        // Optional Auto-launch of selected Kiosk app
                        val autoLaunch = preferencesManager.autoLaunchKioskFlow.first()
                        if (autoLaunch) {
                            val kioskPkg = preferencesManager.getSelectedKioskPackage()
                            if (kioskPkg.isNotBlank()) {
                                val launchIntent = context.packageManager.getLaunchIntentForPackage(kioskPkg)
                                if (launchIntent != null) {
                                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    context.startActivity(launchIntent)
                                    Log.i(TAG, "Auto-launched kiosk package: $kioskPkg")
                                }
                            }
                        }
                    } else {
                        Log.d(TAG, "Setup wizard has not been completed yet. Skipping auto-start.")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed restoring app after boot/update: ${e.message}", e)
                    OverlayServiceWatchdog.requestImmediateCheck(context)
                } finally {
                    pendingResult.finish()
                }
            }
        }
    }
}
