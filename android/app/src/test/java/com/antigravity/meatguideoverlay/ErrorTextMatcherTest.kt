package com.antigravity.meatguideoverlay

import com.antigravity.meatguideoverlay.util.ErrorTextMatcher
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class ErrorTextMatcherTest {

    private lateinit var matcher: ErrorTextMatcher

    @Before
    fun setUp() {
        matcher = ErrorTextMatcher()
    }

    @Test
    fun testTextNormalization() {
        val raw1 = "  서버에   접속이\n끊겼습니다   "
        val raw2 = "서버에\r\n\t접속이     끊겼습니다"

        assertEquals("서버에 접속이 끊겼습니다", matcher.normalize(raw1))
        assertEquals("서버에 접속이 끊겼습니다", matcher.normalize(raw2))
    }

    @Test
    fun testExactAndNormalizedMatching() {
        val targetPatterns = listOf("서버에 접속이 끊겼습니다", "서버 접속 오류")

        // Exact match
        assertTrue(matcher.matches("경고: 서버에 접속이 끊겼습니다.", targetPatterns))

        // Newline & multiple space variations
        assertTrue(matcher.matches("알림: 서버에\n  접속이   끊겼습니다.", targetPatterns))

        // Carriage return variation
        assertTrue(matcher.matches("서버에\r\n접속이 끊겼습니다", targetPatterns))
    }

    @Test
    fun testFalsePositiveRejection() {
        val targetPatterns = listOf("서버에 접속이 끊겼습니다", "서버 접속 오류")

        // Normal unrelated kiosk text
        assertFalse(matcher.matches("삼겹살 2인분 주문이 완료되었습니다.", targetPatterns))
        assertFalse(matcher.matches("서버와 통신이 원활하게 연결되었습니다.", targetPatterns))
        assertFalse(matcher.matches("맛있는 고기를 굽는 중입니다.", targetPatterns))
    }

    @Test
    fun testCooldownBehavior() {
        val errorKey = "server_error"
        val cooldownMinutes = 5
        val baseTime = 1000000L

        // First trigger should be allowed
        assertTrue(matcher.canTrigger(errorKey, cooldownMinutes, currentTimeMillis = baseTime))

        // Record trigger
        matcher.recordTriggered(errorKey, currentTimeMillis = baseTime)

        // 1 minute later -> should NOT trigger
        assertFalse(matcher.canTrigger(errorKey, cooldownMinutes, currentTimeMillis = baseTime + 60 * 1000L))

        // 4 minutes 59 seconds later -> should NOT trigger
        assertFalse(matcher.canTrigger(errorKey, cooldownMinutes, currentTimeMillis = baseTime + (5 * 60 - 1) * 1000L))

        // 5 minutes later -> should trigger!
        assertTrue(matcher.canTrigger(errorKey, cooldownMinutes, currentTimeMillis = baseTime + (5 * 60) * 1000L))
    }
}
