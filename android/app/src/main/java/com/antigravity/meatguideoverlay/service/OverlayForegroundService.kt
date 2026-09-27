package com.antigravity.meatguideoverlay.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.antigravity.meatguideoverlay.MainActivity
import com.antigravity.meatguideoverlay.R
import com.antigravity.meatguideoverlay.data.repository.PopupImageRepository
import com.antigravity.meatguideoverlay.data.datasource.DeviceStatusReporter
import com.antigravity.meatguideoverlay.ui.overlay.OverlayWindowController
import com.antigravity.meatguideoverlay.util.OverlayServiceWatchdog
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class OverlayForegroundService : Service() {

    companion object {
        private const val TAG = "OverlayForegroundSvc"
        private const val NOTIFICATION_ID = 9182
        private const val CHANNEL_ID = "meat_guide_overlay_service_channel"
        private const val HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000L

        @Volatile
        private var isServiceRunning = false

        fun isRunning(): Boolean = isServiceRunning

        const val ACTION_START = "com.antigravity.meatguideoverlay.action.START"
        const val ACTION_STOP = "com.antigravity.meatguideoverlay.action.STOP"
        const val ACTION_SHOW_CHARACTER = "com.antigravity.meatguideoverlay.action.SHOW_CHAR"
        const val ACTION_HIDE_CHARACTER = "com.antigravity.meatguideoverlay.action.HIDE_CHAR"
        const val ACTION_REFRESH = "com.antigravity.meatguideoverlay.action.REFRESH"

        fun startService(context: Context) {
            val intent = Intent(context, OverlayForegroundService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, OverlayForegroundService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private lateinit var overlayController: OverlayWindowController
    private lateinit var repository: com.antigravity.meatguideoverlay.data.repository.PopupImageRepository
    private lateinit var deviceStatusReporter: DeviceStatusReporter
    private var stopRequested = false

    override fun onCreate() {
        super.onCreate()
        overlayController = OverlayWindowController.getInstance(this)
        repository = com.antigravity.meatguideoverlay.data.repository.PopupImageRepository.getInstance(this)
        deviceStatusReporter = DeviceStatusReporter(this)

        createNotificationChannel()
        val notification = createNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            androidx.core.app.ServiceCompat.startForeground(
                this,
                NOTIFICATION_ID,
                notification,
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
        isServiceRunning = true

        // Collect popup updates reactively and update power/sleep schedule
        serviceScope.launch {
            repository.activePopupState.collect { info ->
                Log.d(TAG, "Active popup config updated in service: v${info.version}, autoReboot=${info.autoRebootEnabled} (${info.autoRebootTime}), screenTimeout=${info.screenTimeoutMinutes}m, popupAutoClose=${info.popupAutoCloseMinutes}m")
                deviceStatusReporter.report(info.version)
                // Reboot scheduling is disabled in this release. This also clears
                // alarms persisted by an older installed version.
                com.antigravity.meatguideoverlay.util.DevicePowerScheduler.cancelDailyReboot(
                    applicationContext
                )
                // Store tablets are always plugged in and stay on during business hours;
                // staff turn the screen off manually after closing.
                overlayController.updateScreenTimeout(0)
            }
        }

        // Keep the admin status fresh and make service loss visible within minutes.
        serviceScope.launch(Dispatchers.IO) {
            while (isActive) {
                delay(HEARTBEAT_INTERVAL_MS)
                deviceStatusReporter.report(repository.activePopupState.value.version)
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_START
        Log.d(TAG, "onStartCommand received action: $action")

        when (action) {
            ACTION_START, ACTION_SHOW_CHARACTER -> {
                overlayController.showFloatingCharacter()
            }
            ACTION_HIDE_CHARACTER -> {
                overlayController.hideFloatingCharacter()
            }
            ACTION_REFRESH -> {
                Log.i(TAG, "Executing ACTION_REFRESH on OverlayForegroundService")
                overlayController.refreshServiceAndOverlay()
            }
            ACTION_STOP -> {
                stopRequested = true
                overlayController.releaseAll()
                androidx.core.app.ServiceCompat.stopForeground(this, androidx.core.app.ServiceCompat.STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
        }

        return START_STICKY
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        if (!stopRequested) {
            OverlayServiceWatchdog.requestImmediateCheck(applicationContext)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.notification_channel_desc)
                setShowBadge(false)
                setSound(null, null)
                enableVibration(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.notification_title))
            .setContentText(getString(R.string.notification_desc))
            .setSmallIcon(R.drawable.ic_mascot_character)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        isServiceRunning = false
        serviceScope.cancel()
        overlayController.releaseAll()
        Log.d(TAG, "OverlayForegroundService destroyed")
        if (!stopRequested) {
            OverlayServiceWatchdog.requestImmediateCheck(applicationContext)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
