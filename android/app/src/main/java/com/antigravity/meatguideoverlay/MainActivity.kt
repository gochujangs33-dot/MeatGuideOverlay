package com.antigravity.meatguideoverlay

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.antigravity.meatguideoverlay.service.OverlayForegroundService
import com.antigravity.meatguideoverlay.ui.dashboard.StaffDashboardActivity
import com.antigravity.meatguideoverlay.ui.wizard.SetupWizardActivity
import com.antigravity.meatguideoverlay.util.PreferencesManager
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val preferencesManager = PreferencesManager(this)

        lifecycleScope.launch {
            val isSetupDone = preferencesManager.isSetupCompleted()
            if (isSetupDone) {
                // Ensure overlay service is active
                OverlayForegroundService.startService(this@MainActivity)
                startActivity(Intent(this@MainActivity, StaffDashboardActivity::class.java))
            } else {
                startActivity(Intent(this@MainActivity, SetupWizardActivity::class.java))
            }
            finish()
        }
    }
}
