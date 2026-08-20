package com.antigravity.meatguideoverlay.data.model

import com.google.gson.annotations.SerializedName

/**
 * Multi-Language Active Popup Image Manifest & Device Schedule Configuration.
 * Supports Korean (KO), English (EN), and Japanese (JA) popup posters, speech bubble texts,
 * and remote tablet power/sleep schedule (daily auto-reboot, screen timeout).
 */
data class ActivePopupInfo(
    @SerializedName("imageUrl")
    val imageUrl: String = "",

    @SerializedName("imageUrlKo")
    val imageUrlKo: String = "",

    @SerializedName("imageUrlEn")
    val imageUrlEn: String = "",

    @SerializedName("imageUrlJa")
    val imageUrlJa: String = "",

    @SerializedName("version")
    val version: Long = 1L,

    @SerializedName("updatedAt")
    val updatedAt: String = "",

    @SerializedName("fileName")
    val fileName: String = "pork_guide_poster_ko_hq.png",

    @SerializedName("fileSize")
    val fileSize: Long = 0L,

    @SerializedName("checksum")
    val checksum: String = "",

    @SerializedName("bubbleText")
    val bubbleText: String = "이 고기가 어떤 부위인지 궁금하신가요?",

    @SerializedName("bubbleTextKo")
    val bubbleTextKo: String = "이 고기가 어떤 부위인지 궁금하신가요?",

    @SerializedName("bubbleTextEn")
    val bubbleTextEn: String = "Wondering which cut of meat this is?",

    @SerializedName("bubbleTextJa")
    val bubbleTextJa: String = "このお肉がどの部位か気になりますか？",

    // Tablet Power & Sleep Schedule Settings
    @SerializedName("autoRebootEnabled")
    val autoRebootEnabled: Boolean = true,

    @SerializedName("autoRebootTime")
    val autoRebootTime: String = "10:00",

    @SerializedName("screenTimeoutMinutes")
    val screenTimeoutMinutes: Int = 60,

    // Character Placement Position ("RIGHT_TOP" or "LEFT_TOP")
    @SerializedName("characterPosition")
    val characterPosition: String = "RIGHT_TOP"
) {
    fun getImageUrlFor(lang: String): String {
        return when (lang.lowercase()) {
            "en" -> if (imageUrlEn.isNotBlank()) imageUrlEn else getEffectiveKoreanUrl()
            "ja" -> if (imageUrlJa.isNotBlank()) imageUrlJa else getEffectiveKoreanUrl()
            else -> getEffectiveKoreanUrl()
        }
    }

    fun getEffectiveKoreanUrl(): String {
        return if (imageUrlKo.isNotBlank()) imageUrlKo else imageUrl
    }

    fun getBubbleTextFor(lang: String): String {
        return when (lang.lowercase()) {
            "en" -> if (bubbleTextEn.isNotBlank()) bubbleTextEn else bubbleText
            "ja" -> if (bubbleTextJa.isNotBlank()) bubbleTextJa else bubbleText
            else -> if (bubbleTextKo.isNotBlank()) bubbleTextKo else bubbleText
        }
    }

    fun isValid(): Boolean {
        return version >= 1L
    }
}
