package com.antigravity.meatguideoverlay

import com.antigravity.meatguideoverlay.data.datasource.ImageSourceRecord
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class ImageSourceRecordTest {

    @get:Rule
    val tempFolder = TemporaryFolder()

    private val posterA = "https://firebasestorage.googleapis.com/v0/b/app/o/popups%2F1_ko_a.png?alt=media"
    private val posterB = "https://firebasestorage.googleapis.com/v0/b/app/o/popups%2F2_ko_b.png?alt=media"

    @Test
    fun recordMatchesOnlyTheUrlSavedForThatLanguage() {
        val record = ImageSourceRecord(tempFolder.root)

        record.write("ko", posterA)

        assertTrue(record.matches("ko", posterA))
        assertFalse(record.matches("ko", posterB))
        assertFalse(record.matches("en", posterA))
    }

    @Test
    fun recordSurvivesAppRestart() {
        ImageSourceRecord(tempFolder.root).write("ja", posterA)

        assertTrue(ImageSourceRecord(tempFolder.root).matches("ja", posterA))
    }

    @Test
    fun clearedRecordNoLongerMatches() {
        val record = ImageSourceRecord(tempFolder.root)
        record.write("en", posterA)

        record.clear("en")

        assertFalse(record.matches("en", posterA))
    }
}
