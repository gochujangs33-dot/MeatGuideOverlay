package com.antigravity.meatguideoverlay.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.antigravity.meatguideoverlay.service.OverlayForegroundService
import com.antigravity.meatguideoverlay.util.PreferencesManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

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
            val preferencesManager = PreferencesManager(context)

            CoroutineScope(Dispatchers.Main).launch {
                val isSetupDone = preferencesManager.isSetupCompleted()
                if (isSetupDone) {
                    // Start overlay service
                    try {
                        OverlayForegroundService.startService(context)
                        Log.i(TAG, "OverlayForegroundService started successfully on boot")
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to start service on boot: ${e.message}", e)
                    }

                    // Optional Auto-launch of selected Kiosk app
                    val autoLaunch = preferencesManager.autoLaunchKioskFlow.first()
                    if (autoLaunch) {
                        val kioskPkg = preferencesManager.getSelectedKioskPackage()
                        if (kioskPkg.isNotBlank()) {
                            try {
                                val launchIntent = context.packageManager.getLaunchIntentForPackage(kioskPkg)
                                if (launchIntent != null) {
                                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    context.startActivity(launchIntent)
                                    Log.i(TAG, "Auto-launched kiosk package: $kioskPkg")
                                }
                            } catch (e: Exception) {
                                Log.w(TAG, "Could not auto-launch kiosk app: ${e.message}")
                            }
                        }
                    }
                } else {
                    Log.d(TAG, "Setup wizard has not been completed yet. Skipping auto-start.")
                }
            }
        }
    }
}
