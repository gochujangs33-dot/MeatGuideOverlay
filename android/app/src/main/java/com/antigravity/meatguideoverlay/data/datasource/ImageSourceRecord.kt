package com.antigravity.meatguideoverlay.data.datasource

import java.io.File
import java.security.MessageDigest

/**
 * Remembers which URL each cached poster image was downloaded from, so a poster is
 * fetched again only when its URL changes (or when an earlier download never landed).
 * Stores a SHA-256 of the URL because Base64 data URLs can be several megabytes.
 */
class ImageSourceRecord(private val directory: File) {

    fun write(lang: String, sourceUrl: String) {
        recordFile(lang).writeText(fingerprint(sourceUrl), Charsets.UTF_8)
    }

    fun matches(lang: String, sourceUrl: String): Boolean {
        val file = recordFile(lang)
        return file.exists() && file.readText(Charsets.UTF_8) == fingerprint(sourceUrl)
    }

    fun clear(lang: String) {
        recordFile(lang).delete()
    }

    private fun recordFile(lang: String) = File(directory, "active_popup_image_source_$lang.txt")

    private fun fingerprint(sourceUrl: String): String =
        MessageDigest.getInstance("SHA-256")
            .digest(sourceUrl.toByteArray(Charsets.UTF_8))
            .joinToString("") { byte -> "%02x".format(byte) }
}
