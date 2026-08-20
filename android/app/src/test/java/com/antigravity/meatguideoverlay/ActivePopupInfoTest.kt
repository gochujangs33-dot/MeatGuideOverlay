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
            fileName = "pork_guide_poster_ko_hq.png",
            fileSize = 455717L,
            checksum = "abc123hash",
            bubbleText = "이 고기가 어떤 부위인지 궁금하신가요?",
            bubbleTextKo = "이 고기가 어떤 부위인지 궁금하신가요?",
            bubbleTextEn = "Wondering which cut of meat this is?",
            bubbleTextJa = "このお肉がどの部位か気になりますか？"
        )
        assertTrue(info.isValid())
        assertEquals(2L, info.version)
        assertEquals("pork_guide_poster_ko_hq.png", info.fileName)
        assertEquals("이 고기가 어떤 부위인지 궁금하신가요?", info.getBubbleTextFor("ko"))
        assertEquals("Wondering which cut of meat this is?", info.getBubbleTextFor("en"))
        assertEquals("このお肉がどの部位か気になりますか？", info.getBubbleTextFor("ja"))
    }

    @Test
    fun testMultiLanguageImageFallback() {
        val info = ActivePopupInfo(
            imageUrlKo = "https://example.com/ko.jpg",
            imageUrlEn = "https://example.com/en.jpg",
            imageUrlJa = ""
        )
        assertEquals("https://example.com/ko.jpg", info.getImageUrlFor("ko"))
        assertEquals("https://example.com/en.jpg", info.getImageUrlFor("en"))
        // Japanese fallback to Korean
        assertEquals("https://example.com/ko.jpg", info.getImageUrlFor("ja"))
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
            imageUrlKo = "https://storage.googleapis.com/popup_ko.jpg",
            imageUrlEn = "https://storage.googleapis.com/popup_en.jpg",
            imageUrlJa = "https://storage.googleapis.com/popup_ja.jpg",
            version = 5L,
            updatedAt = "2026-08-18T10:00:00.000Z",
            fileName = "custom_menu.png",
            fileSize = 102400L,
            checksum = "sha256_mock_hash",
            bubbleText = "부위 안내를 확인해보세요!",
            bubbleTextKo = "부위 안내를 확인해보세요!",
            bubbleTextEn = "Check meat cuts guide!",
            bubbleTextJa = "部位案内をご確認ください！"
        )

        val json = gson.toJson(original)
        val deserialized = gson.fromJson(json, ActivePopupInfo::class.java)

        assertEquals(original.version, deserialized.version)
        assertEquals(original.imageUrlKo, deserialized.imageUrlKo)
        assertEquals(original.imageUrlEn, deserialized.imageUrlEn)
        assertEquals(original.imageUrlJa, deserialized.imageUrlJa)
        assertEquals(original.bubbleTextKo, deserialized.bubbleTextKo)
        assertEquals(original.bubbleTextEn, deserialized.bubbleTextEn)
        assertEquals(original.bubbleTextJa, deserialized.bubbleTextJa)
        assertTrue(deserialized.isValid())
    }
}
