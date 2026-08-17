package com.antigravity.meatguideoverlay

import com.antigravity.meatguideoverlay.data.model.ActivePopupInfo
import com.google.gson.Gson
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ActivePopupInfoTest {

    private val gson = Gson()

    @Test
    fun testValidActivePopupInfo() {
        val info = ActivePopupInfo(
            imageUrl = "https://firebasestorage.googleapis.com/v0/b/app/o/pork.jpg",
            version = 2L,
            updatedAt = "2026-08-18T00:00:00.000Z",
            fileName = "pork_guide_poster.jpg",
            fileSize = 455717L,
            checksum = "abc123hash",
            bubbleText = "이 고기가 어떤 부위인지 궁금하신가요?"
        )
        assertTrue(info.isValid())
        assertEquals(2L, info.version)
        assertEquals("pork_guide_poster.jpg", info.fileName)
    }

    @Test
    fun testInvalidVersionRejected() {
        val invalidInfo = ActivePopupInfo(
            imageUrl = "https://example.com/image.jpg",
            version = 0L
        )
        assertFalse(invalidInfo.isValid())
    }

    @Test
    fun testJsonSerialization() {
        val original = ActivePopupInfo(
            imageUrl = "https://storage.googleapis.com/popup.jpg",
            version = 5L,
            updatedAt = "2026-08-18T10:00:00.000Z",
            fileName = "custom_menu.png",
            fileSize = 102400L,
            checksum = "sha256_mock_hash",
            bubbleText = "부위 안내를 확인해보세요!"
        )

        val json = gson.toJson(original)
        val deserialized = gson.fromJson(json, ActivePopupInfo::class.java)

        assertEquals(original.version, deserialized.version)
        assertEquals(original.imageUrl, deserialized.imageUrl)
        assertEquals(original.fileName, deserialized.fileName)
        assertEquals(original.bubbleText, deserialized.bubbleText)
        assertTrue(deserialized.isValid())
    }
}
