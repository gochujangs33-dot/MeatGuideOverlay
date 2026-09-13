package com.antigravity.meatguideoverlay.receiver

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.antigravity.meatguideoverlay.util.DevicePowerScheduler

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

        // Automatic reboot has been retired. Receiving a legacy alarm, a boot,
        // or an app-update broadcast only removes any previously stored alarm.
        Log.i(TAG, "Automatic reboot disabled; cancelling legacy reboot alarm for action: $action")
        DevicePowerScheduler.cancelDailyReboot(context)
    }
}
