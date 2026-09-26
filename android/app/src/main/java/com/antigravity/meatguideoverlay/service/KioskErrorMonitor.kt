package com.antigravity.meatguideoverlay.service

import android.util.Log
import com.antigravity.meatguideoverlay.util.ErrorTextMatcher
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Inspects the kiosk screen after accessibility events and raises the staff dialog.
 *
 * Events are coalesced instead of dropped: an event that arrives within [throttleMs]
 * of the last inspection schedules one more inspection at the end of that window, so
 * an error popup that opens right after another screen change is still read even
 * though the popup itself emits no further events.
 *
 * [onErrorDetected] always runs on [uiDispatcher] because it attaches overlay windows,
 * which Android only allows from a thread with a Looper.
 */
class KioskErrorMonitor(
    private val scope: CoroutineScope,
    private val uiDispatcher: CoroutineDispatcher,
    private val errorPatterns: List<String>,
    private val readScreenText: () -> String?,
    private val onErrorDetected: () -> Unit,
    private val throttleMs: Long = 400L,
    private val cooldownMinutes: Int = 5,
    private val now: () -> Long = System::currentTimeMillis,
    private val matcher: ErrorTextMatcher = ErrorTextMatcher()
) {
    companion object {
        private const val TAG = "KioskErrorMonitor"
        private const val ERROR_KEY = "kiosk_server_disconnect"
    }

    private val inspectionScheduled = AtomicBoolean(false)

    @Volatile
    private var lastInspectionAt: Long? = null

    fun onScreenChanged() {
        if (!inspectionScheduled.compareAndSet(false, true)) return

        scope.launch {
            val waitMs = lastInspectionAt?.let { it + throttleMs - now() } ?: 0L
            if (waitMs > 0) delay(waitMs)
            // Cleared before inspecting so an event during the inspection schedules another.
            inspectionScheduled.set(false)
            lastInspectionAt = now()
            inspect()
        }
    }

    private suspend fun inspect() {
        try {
            val screenText = readScreenText() ?: return
            if (!matcher.matches(screenText, errorPatterns)) return
            if (!matcher.canTrigger(ERROR_KEY, cooldownMinutes, now())) {
                Log.d(TAG, "Error matched but cooldown active ($cooldownMinutes min). Suppressed repeat dialog.")
                return
            }
            matcher.recordTriggered(ERROR_KEY, now())
            Log.w(TAG, "Kiosk server disconnect error detected on screen. Showing staff guidance dialog.")
            withContext(uiDispatcher) { onErrorDetected() }
        } catch (e: Exception) {
            Log.e(TAG, "Error inspecting kiosk screen: ${e.message}")
        }
    }
}
