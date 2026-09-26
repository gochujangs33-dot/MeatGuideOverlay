package com.antigravity.meatguideoverlay.service

import android.accessibilityservice.AccessibilityService
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.antigravity.meatguideoverlay.ui.overlay.OverlayWindowController
import com.antigravity.meatguideoverlay.util.PreferencesManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference

class KioskErrorAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "KioskAccessibilitySvc"
        private const val MAX_NODE_DEPTH = 12
        private const val MAX_NODE_COUNT = 60

        var isServiceRunning = false
            private set

        @Volatile
        private var connectedService: WeakReference<KioskErrorAccessibilityService>? = null

        /**
         * Opens the system power dialog (restart / power off) through the connected
         * accessibility service. Returns false when the service is not enabled.
         */
        fun openPowerDialog(): Boolean {
            val service = connectedService?.get() ?: return false
            return service.performGlobalAction(GLOBAL_ACTION_POWER_DIALOG)
        }
    }

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private lateinit var preferencesManager: PreferencesManager
    private lateinit var overlayController: OverlayWindowController
    private var errorMonitor: KioskErrorMonitor? = null

    private val defaultErrorPatterns = listOf(
        "서버에 접속이 끊겼습니다",
        "서버 접속이 원활하지 않습니다",
        "네트워크 연결을 확인해주세요",
        "통신 연결 오류"
    )

    @Volatile
    private var targetKioskPackage: String = ""

    override fun onServiceConnected() {
        super.onServiceConnected()
        isServiceRunning = true
        connectedService = WeakReference(this)
        preferencesManager = PreferencesManager(this)
        overlayController = OverlayWindowController.getInstance(this)
        errorMonitor = KioskErrorMonitor(
            scope = serviceScope,
            uiDispatcher = Dispatchers.Main,
            errorPatterns = defaultErrorPatterns,
            readScreenText = ::readActiveWindowText,
            onErrorDetected = {
                overlayController.showKioskErrorDialog(
                    title = "키오스크 서버 연결 확인 필요 (직원 안내)",
                    message = "키오스크 화면에 서버 연결 끊김 알림이 감지되었습니다.\n1. 매장 Wi-Fi 공유기 및 랜선 연결 상태를 확인해주세요.\n2. 키오스크 태블릿 전원 버튼을 길게 눌러 [다시 시작]을 진행해주세요."
                )
            }
        )

        serviceScope.launch {
            preferencesManager.selectedKioskPackageFlow.collect { pkg ->
                targetKioskPackage = pkg
                Log.d(TAG, "Accessibility target package updated: $targetKioskPackage")
            }
        }

        Log.d(TAG, "KioskErrorAccessibilityService connected successfully")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        // Strict Package Name Filtering: Only inspect the selected kiosk package
        val eventPackage = event.packageName?.toString() ?: return
        if (targetKioskPackage.isNotBlank() && eventPackage != targetKioskPackage) {
            return
        }

        // Only process window state / content change
        val eventType = event.eventType
        if (eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
            eventType != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
        ) {
            return
        }

        errorMonitor?.onScreenChanged()
    }

    /** Reads the visible text of the active window within the node depth and count limits. */
    private fun readActiveWindowText(): String? {
        val rootNode = rootInActiveWindow ?: return null
        try {
            val extractedTexts = mutableListOf<String>()
            extractTextFromNodes(rootNode, extractedTexts, 0, intArrayOf(0))
            return if (extractedTexts.isEmpty()) null else extractedTexts.joinToString(" ")
        } finally {
            @Suppress("DEPRECATION")
            rootNode.recycle()
        }
    }

    /**
     * Efficient, bounded recursive text extraction to guarantee low CPU and memory footprint.
     */
    private fun extractTextFromNodes(
        node: AccessibilityNodeInfo?,
        result: MutableList<String>,
        depth: Int,
        count: IntArray
    ) {
        if (node == null || depth > MAX_NODE_DEPTH || count[0] >= MAX_NODE_COUNT) return

        val text = node.text
        if (!text.isNullOrBlank()) {
            result.add(text.toString())
            count[0]++
        }

        val childCount = node.childCount
        for (i in 0 until childCount) {
            if (count[0] >= MAX_NODE_COUNT) break
            val child = node.getChild(i)
            if (child != null) {
                extractTextFromNodes(child, result, depth + 1, count)
                @Suppress("DEPRECATION")
                child.recycle()
            }
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "KioskErrorAccessibilityService interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        isServiceRunning = false
        connectedService = null
        errorMonitor = null
        serviceScope.cancel()
        Log.d(TAG, "KioskErrorAccessibilityService destroyed")
    }
}
