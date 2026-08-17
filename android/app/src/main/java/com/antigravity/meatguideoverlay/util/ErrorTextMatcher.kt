package com.antigravity.meatguideoverlay.util

import java.util.concurrent.ConcurrentHashMap

/**
 * Normalizes and matches screen error text against registered kiosk error phrases.
 * Enforces cooldowns to prevent repeated popup loops on low-end tablets.
 */
class ErrorTextMatcher {

    private val lastTriggeredTimes = ConcurrentHashMap<String, Long>()

    companion object {
        private val WHITESPACE_REGEX = "\\s+".toRegex()
    }

    /**
     * Normalizes text by trimming, collapsing multiple spaces/newlines/tabs to a single space.
     */
    fun normalize(text: String?): String {
        if (text.isNullOrBlank()) return ""
        return text
            .replace("\r\n", " ")
            .replace('\r', ' ')
            .replace('\n', ' ')
            .replace('\t', ' ')
            .trim()
            .replace(WHITESPACE_REGEX, " ")
    }

    /**
     * Checks if the normalized screen text contains any of the normalized target error phrases.
     */
    fun matches(screenText: String?, targetPatterns: List<String>): Boolean {
        if (screenText.isNullOrBlank() || targetPatterns.isEmpty()) return false
        val normalizedScreen = normalize(screenText)
        if (normalizedScreen.isBlank()) return false

        for (pattern in targetPatterns) {
            val normalizedPattern = normalize(pattern)
            if (normalizedPattern.isNotBlank() && normalizedScreen.contains(normalizedPattern, ignoreCase = true)) {
                return true
            }
        }
        return false
    }

    /**
     * Checks if enough cooldown time has passed since the last trigger.
     */
    fun canTrigger(errorKey: String, cooldownMinutes: Int, currentTimeMillis: Long = System.currentTimeMillis()): Boolean {
        val lastTime = lastTriggeredTimes[errorKey] ?: 0L
        val cooldownMillis = cooldownMinutes * 60 * 1000L
        return (currentTimeMillis - lastTime) >= cooldownMillis
    }

    /**
     * Records the timestamp when an error was triggered.
     */
    fun recordTriggered(errorKey: String, currentTimeMillis: Long = System.currentTimeMillis()) {
        lastTriggeredTimes[errorKey] = currentTimeMillis
    }

    /**
     * Clears all recorded cooldown timestamps (useful for testing or manual reset).
     */
    fun resetCooldowns() {
        lastTriggeredTimes.clear()
    }
}
