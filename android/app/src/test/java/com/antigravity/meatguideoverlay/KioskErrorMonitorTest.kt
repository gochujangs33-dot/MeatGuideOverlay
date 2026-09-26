package com.antigravity.meatguideoverlay

import com.antigravity.meatguideoverlay.service.KioskErrorMonitor
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.cancel
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.withTimeout
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Test
import java.util.concurrent.Executors

@OptIn(ExperimentalCoroutinesApi::class)
class KioskErrorMonitorTest {

    private val errorPatterns = listOf("서버에 접속이 끊겼습니다")

    // Virtual test time starts at 0; offset it so it behaves like a wall clock.
    private val wallClockStart = 1_790_000_000_000L

    @Test
    fun staffDialogIsShownOnUiThreadWhenInspectionRunsInBackground() = runBlocking {
        lateinit var uiThread: Thread
        val uiExecutor = Executors.newSingleThreadExecutor { runnable ->
            Thread(runnable, "overlay-ui").also { uiThread = it }
        }
        val inspectionScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
        val dialogThread = CompletableDeferred<Thread>()
        try {
            val monitor = KioskErrorMonitor(
                scope = inspectionScope,
                uiDispatcher = uiExecutor.asCoroutineDispatcher(),
                errorPatterns = errorPatterns,
                readScreenText = { "알림: 서버에 접속이 끊겼습니다" },
                onErrorDetected = { dialogThread.complete(Thread.currentThread()) }
            )

            monitor.onScreenChanged()

            val threadThatShowedDialog = withTimeout(5_000) { dialogThread.await() }
            assertSame(uiThread, threadThatShowedDialog)
        } finally {
            inspectionScope.cancel()
            uiExecutor.shutdownNow()
        }
    }

    @Test
    fun errorAppearingInsideThrottleWindowIsStillInspected() = runTest {
        var screenText = "메뉴를 선택해 주세요"
        var dialogCount = 0
        val monitor = monitorForTest(readScreenText = { screenText }, onErrorDetected = { dialogCount++ })

        monitor.onScreenChanged() // t=0: ordinary menu screen
        runCurrent()
        advanceTimeBy(150)
        screenText = "서버에 접속이 끊겼습니다" // t=150ms: error popup opens
        monitor.onScreenChanged()
        advanceTimeBy(1_000) // the popup stays static, so no further events arrive
        runCurrent()

        assertEquals(1, dialogCount)
    }

    @Test
    fun errorLeftOnScreenShowsDialogOncePerCooldown() = runTest {
        var dialogCount = 0
        val monitor = monitorForTest(
            readScreenText = { "서버에 접속이 끊겼습니다" },
            onErrorDetected = { dialogCount++ }
        )

        repeat(5) { // events every minute for five minutes
            monitor.onScreenChanged()
            runCurrent()
            advanceTimeBy(60_000)
        }
        assertEquals(1, dialogCount)

        advanceTimeBy(1_000) // past the five-minute cooldown
        monitor.onScreenChanged()
        runCurrent()
        assertEquals(2, dialogCount)
    }

    private fun TestScope.monitorForTest(
        readScreenText: () -> String?,
        onErrorDetected: () -> Unit
    ) = KioskErrorMonitor(
        scope = backgroundScope,
        uiDispatcher = StandardTestDispatcher(testScheduler),
        errorPatterns = errorPatterns,
        readScreenText = readScreenText,
        onErrorDetected = onErrorDetected,
        throttleMs = 400L,
        cooldownMinutes = 5,
        now = { wallClockStart + testScheduler.currentTime }
    )
}
