package com.antigravity.meatguideoverlay.ui.dashboard

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.antigravity.meatguideoverlay.R
import com.antigravity.meatguideoverlay.data.repository.PopupImageRepository
import com.antigravity.meatguideoverlay.databinding.ActivityStaffDashboardBinding
import com.antigravity.meatguideoverlay.service.KioskErrorAccessibilityService
import com.antigravity.meatguideoverlay.service.OverlayForegroundService
import com.antigravity.meatguideoverlay.ui.overlay.OverlayWindowController
import com.antigravity.meatguideoverlay.ui.wizard.SetupWizardActivity
import com.antigravity.meatguideoverlay.util.PreferencesManager
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class StaffDashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityStaffDashboardBinding
    private lateinit var preferencesManager: PreferencesManager
    private lateinit var repository: PopupImageRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityStaffDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        preferencesManager = PreferencesManager(this)
        repository = PopupImageRepository.getInstance(this)

        setupListeners()
        observeData()
    }

    override fun onResume() {
        super.onResume()
        updateStatusCards()
    }

    private fun updateStatusCards() {
        // Overlay permission
        val hasOverlay = Settings.canDrawOverlays(this)
        binding.tvDashOverlayStatus.text = if (hasOverlay) {
            getString(R.string.status_granted)
        } else {
            getString(R.string.status_not_granted)
        }
        binding.tvDashOverlayStatus.setTextColor(
            getColor(if (hasOverlay) R.color.status_success else R.color.status_error)
        )

        // Accessibility service status
        val isA11yRunning = KioskErrorAccessibilityService.isServiceRunning
        binding.tvDashAccessibilityStatus.text = if (isA11yRunning) {
            getString(R.string.status_granted)
        } else {
            "대기 중 (접근성 서비스 활성화 필요)"
        }
        binding.tvDashAccessibilityStatus.setTextColor(
            getColor(if (isA11yRunning) R.color.status_success else R.color.status_warning)
        )
    }

    private fun observeData() {
        lifecycleScope.launch {
            preferencesManager.selectedKioskPackageFlow.collect { pkg ->
                binding.tvDashKioskPackage.text = pkg.ifBlank { "미지정 (기본 테스트 키오스크)" }
            }
        }

        lifecycleScope.launch {
            repository.activePopupState.collect { info ->
                binding.tvDashContentVersion.text = "v${info.version} (${info.fileName})"
            }
        }
    }

    private fun setupListeners() {
        binding.btnDashSyncNow.setOnClickListener {
            binding.btnDashSyncNow.isEnabled = false
            binding.tvDashLastSync.text = "동기화 진행 중..."
            lifecycleScope.launch {
                val success = repository.refreshSync()
                binding.btnDashSyncNow.isEnabled = true
                if (success) {
                    val timeStr = SimpleDateFormat("HH:mm:ss", Locale.KOREA).format(Date())
                    binding.tvDashLastSync.text = "$timeStr (동기화 완료)"
                    Toast.makeText(this@StaffDashboardActivity, "이미지 동기화 완료!", Toast.LENGTH_SHORT).show()
                } else {
                    binding.tvDashLastSync.text = "동기화 실패 (오프라인 캐시 사용)"
                    Toast.makeText(this@StaffDashboardActivity, "동기화 실패 (오프라인 캐시 사용)", Toast.LENGTH_SHORT).show()
                }
            }
        }

        binding.btnDashShowCharacter.setOnClickListener {
            OverlayForegroundService.startService(this)
            OverlayWindowController.getInstance(this).showFloatingCharacter()
            Toast.makeText(this, "화면에 캐릭터를 표시했습니다.", Toast.LENGTH_SHORT).show()
        }

        binding.btnDashTestError.setOnClickListener {
            OverlayWindowController.getInstance(this).showKioskErrorDialog(
                title = "테스트: 키오스크 서버 연결 오류",
                message = "키오스크 서버 연결 오류가 발생했습니다. 태블릿의 전원을 완전히 껐다가 다시 켜 주세요. (테스트 화면)"
            )
        }

        binding.btnDashReRunWizard.setOnClickListener {
            startActivity(Intent(this, SetupWizardActivity::class.java))
        }
    }
}
