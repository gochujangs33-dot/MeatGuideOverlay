package com.antigravity.meatguideoverlay

import android.app.Application
import android.util.Log
import com.antigravity.meatguideoverlay.util.DevicePowerScheduler
import com.antigravity.meatguideoverlay.util.OverlayServiceWatchdog
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions

/**
 * Main application class ensuring safe Firebase initialization and error handling.
 */
class MeatGuideApplication : Application() {

    companion object {
        private const val TAG = "MeatGuideApplication"
    }

    override fun onCreate() {
        super.onCreate()
        initFirebaseSafely()
        // Automatic reboot is intentionally disabled. Remove alarms left by older APKs.
        DevicePowerScheduler.cancelDailyReboot(this)
        OverlayServiceWatchdog.schedulePeriodic(this)
    }

    private fun initFirebaseSafely() {
        try {
            if (FirebaseApp.getApps(this).isEmpty()) {
                val options = FirebaseOptions.Builder()
                    .setApplicationId("1:503888582753:android:3f40343294f6f58399b220")
                    .setApiKey("AIzaSyAapxBnikTGEflcsxtytNztuyyGBbTtq2M")
                    .setProjectId("meatguideoverlay")
                    .setStorageBucket("meatguideoverlay.firebasestorage.app")
                    .setGcmSenderId("503888582753")
                    .build()
                FirebaseApp.initializeApp(this, options)
                Log.i(TAG, "FirebaseApp initialized with meatguideoverlay project successfully.")
            }
        } catch (e: Exception) {
            Log.w(TAG, "Firebase initialization warning: ${e.message}")
        }
    }
}
