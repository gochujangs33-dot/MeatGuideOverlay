package com.antigravity.meatguideoverlay.ui.wizard

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.antigravity.meatguideoverlay.R
import com.antigravity.meatguideoverlay.databinding.ActivitySetupWizardBinding
import com.antigravity.meatguideoverlay.service.OverlayForegroundService
import com.antigravity.meatguideoverlay.ui.dashboard.StaffDashboardActivity
import com.antigravity.meatguideoverlay.util.PreferencesManager
import kotlinx.coroutines.launch

class SetupWizardActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySetupWizardBinding
    private lateinit var preferencesManager: PreferencesManager
    private val installedAppPackages = mutableListOf<String>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySetupWizardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        preferencesManager = PreferencesManager(this)

        setupAppSpinner()
        setupListeners()
    }

    override fun onResume() {
        super.onResume()
        updatePermissionStatusUI()
    }

    private fun updatePermissionStatusUI() {
        // Overlay permission
        val hasOverlay = Settings.canDrawOverlays(this)
        binding.tvOverlayPermStatus.text = if (hasOverlay) {
            getString(R.string.status_granted)
        } else {
            getString(R.string.status_not_granted)
        }
        binding.tvOverlayPermStatus.setTextColor(
            getColor(if (hasOverlay) R.color.status_success else R.color.status_error)
        )

        // Accessibility guide check
        binding.tvAccessibilityPermStatus.text = "설정 상태 확인 필요"
        binding.tvAccessibilityPermStatus.setTextColor(getColor(R.color.status_warning))
    }

    private fun setupAppSpinner() {
        installedAppPackages.clear()
        val appDisplayNames = mutableListOf<String>()

        // Default test kiosk option
        installedAppPackages.add("com.antigravity.testkiosk")
        appDisplayNames.add("가상 테스트 키오스크 (com.antigravity.testkiosk)")

        // Query device for launchable packages
        val mainIntent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }
        val resolveInfos = packageManager.queryIntentActivities(mainIntent, 0)
        for (info in resolveInfos) {
            val pkg = info.activityInfo.packageName
            if (pkg != packageName && pkg != "com.antigravity.testkiosk") {
                val appName = info.loadLabel(packageManager).toString()
                installedAppPackages.add(pkg)
                appDisplayNames.add("$appName ($pkg)")
            }
        }

        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, appDisplayNames)
        binding.spinnerKioskApps.adapter = adapter
    }

    private fun setupListeners() {
        binding.btnGrantOverlayPerm.setOnClickListener {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            startActivity(intent)
        }

        binding.btnGrantAccessibilityPerm.setOnClickListener {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
        }

        binding.btnCompleteWizard.setOnClickListener {
            if (!Settings.canDrawOverlays(this)) {
                Toast.makeText(this, "먼저 '다른 앱 위에 표시' 권한을 허용해 주세요.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val selectedIndex = binding.spinnerKioskApps.selectedItemPosition
            val selectedPkg = if (selectedIndex in installedAppPackages.indices) {
                installedAppPackages[selectedIndex]
            } else {
                "com.antigravity.testkiosk"
            }

            val deviceName = binding.etDeviceName.text?.toString()?.ifBlank { "테이블-01" } ?: "테이블-01"
            val autoLaunch = binding.cbAutoLaunchKiosk.isChecked

            lifecycleScope.launch {
                preferencesManager.setSelectedKioskPackage(selectedPkg)
                preferencesManager.setDeviceName(deviceName)
                preferencesManager.setAutoLaunchKiosk(autoLaunch)
                preferencesManager.setSetupCompleted(true)

                // Start Foreground Overlay Service
                OverlayForegroundService.startService(this@SetupWizardActivity)

                Toast.makeText(this@SetupWizardActivity, "설정이 완료되었습니다!", Toast.LENGTH_SHORT).show()

                // Navigate to Staff Dashboard
                startActivity(Intent(this@SetupWizardActivity, StaffDashboardActivity::class.java))
                finish()
            }
        }
    }
}
