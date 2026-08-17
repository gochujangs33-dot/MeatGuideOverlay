package com.antigravity.meatguideoverlay

import com.antigravity.meatguideoverlay.data.model.BeefRibItem
import com.antigravity.meatguideoverlay.data.model.ContentManifest
import com.antigravity.meatguideoverlay.data.model.PorkCategory
import com.antigravity.meatguideoverlay.data.model.PorkItem
import com.google.gson.Gson
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ContentManifestTest {

    private val gson = Gson()

    @Test
    fun testValidDefaultManifest() {
        val manifest = ContentManifest(
            schemaVersion = "1.0.0",
            contentVersion = 1L,
            bubbleText = "이 고기가 어떤 부위인지 궁금하신가요?",
            porkCategory = PorkCategory(
                title = "돼지고기 특수부위",
                items = listOf(PorkItem(id = "p1", name = "꼬들목살", order = 1))
            ),
            beefRibItem = BeefRibItem(name = "소생갈비살")
        )
        assertTrue("Valid manifest should pass validation", manifest.isValid())
    }

    @Test
    fun testInvalidSchemaVersionRejected() {
        val manifest = ContentManifest(
            schemaVersion = "2.0.0",
            contentVersion = 1L,
            porkCategory = PorkCategory(
                title = "돼지고기",
                items = listOf(PorkItem(id = "p1", name = "삼겹살"))
            )
        )
        assertFalse("Incompatible schema version must be rejected", manifest.isValid())
    }

    @Test
    fun testProhibitedBeefItemsStrictlyRejected() {
        // 1. Prohibited beef name in beefRibItem
        val yukhoeBeef = ContentManifest(
            schemaVersion = "1.0.0",
            contentVersion = 1L,
            porkCategory = PorkCategory(
                title = "돼지고기",
                items = listOf(PorkItem(id = "p1", name = "삼겹살"))
            ),
            beefRibItem = BeefRibItem(name = "한우 육회")
        )
        assertFalse("Yukhoe in beef item must be strictly rejected", yukhoeBeef.isValid())

        val bbooriBeef = ContentManifest(
            schemaVersion = "1.0.0",
            contentVersion = 1L,
            porkCategory = PorkCategory(
                title = "돼지고기",
                items = listOf(PorkItem(id = "p1", name = "삼겹살"))
            ),
            beefRibItem = BeefRibItem(name = "뿌리살")
        )
        assertFalse("Bboorisal in beef item must be strictly rejected", bbooriBeef.isValid())

        // 2. Prohibited beef items infiltrated in pork category
        val infiltratedPork = ContentManifest(
            schemaVersion = "1.0.0",
            contentVersion = 1L,
            porkCategory = PorkCategory(
                title = "돼지고기",
                items = listOf(PorkItem(id = "p1", name = "신선 육회"))
            ),
            beefRibItem = BeefRibItem(name = "소생갈비살")
        )
        assertFalse("Prohibited meat in pork items must be rejected", infiltratedPork.isValid())
    }

    @Test
    fun testJsonSerializationAndDeserialization() {
        val original = ContentManifest(
            schemaVersion = "1.0.0",
            contentVersion = 42L,
            bubbleText = "부위 안내입니다",
            porkCategory = PorkCategory(
                title = "돼지고기 특수부위",
                items = listOf(
                    PorkItem(id = "p1", name = "꼬들목살", order = 1),
                    PorkItem(id = "p2", name = "항정살", order = 2)
                )
            ),
            beefRibItem = BeefRibItem(name = "소생갈비살")
        )

        val json = gson.toJson(original)
        val deserialized = gson.fromJson(json, ContentManifest::class.java)

        assertEquals(original.contentVersion, deserialized.contentVersion)
        assertEquals(original.bubbleText, deserialized.bubbleText)
        assertEquals(2, deserialized.porkCategory.items.size)
        assertTrue(deserialized.isValid())
    }
}
