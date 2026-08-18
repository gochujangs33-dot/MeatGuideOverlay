package com.antigravity.meatguideoverlay

import android.app.Application
import android.util.Log
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
    }

    private fun initFirebaseSafely() {
        try {
            if (FirebaseApp.getApps(this).isEmpty()) {
                val options = FirebaseOptions.Builder()
                    .setApplicationId("1:100000000000:android:meatguideoverlay")
                    .setApiKey("AIzaSyMeatGuideOverlayDummyKey1234567890")
                    .setProjectId("meat-guide-overlay")
                    .setStorageBucket("meat-guide-overlay.appspot.com")
                    .build()
                FirebaseApp.initializeApp(this, options)
                Log.i(TAG, "FirebaseApp initialized with offline fallback options successfully.")
            }
        } catch (e: Exception) {
            Log.w(TAG, "Firebase initialization warning: ${e.message}")
        }
    }
}
