package com.antigravity.meatguideoverlay

import com.antigravity.meatguideoverlay.util.BubbleText
import org.junit.Assert.assertEquals
import org.junit.Test

class BubbleTextTest {

    private val joiner = "\u2060"

    @Test
    fun lettersInsideAWordAreJoinedSoLinesBreakOnlyAtSpaces() {
        assertEquals("고${joiner}기 부${joiner}위", BubbleText.keepWordsTogether("고기 부위"))
    }

    @Test
    fun singleLetterWordsAndSpacesAreUnchanged() {
        assertEquals("이 고", BubbleText.keepWordsTogether("이 고"))
    }
}
