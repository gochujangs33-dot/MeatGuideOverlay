package com.antigravity.meatguideoverlay.data.model

import com.google.gson.annotations.SerializedName

/**
 * Single Active Popup Image Manifest.
 * Replaces the complex multi-category menu models with a single clean popup image descriptor.
 */
data class ActivePopupInfo(
    @SerializedName("imageUrl")
    val imageUrl: String = "",

    @SerializedName("version")
    val version: Long = 1L,

    @SerializedName("updatedAt")
    val updatedAt: String = "",

    @SerializedName("fileName")
    val fileName: String = "pork_guide_poster.jpg",

    @SerializedName("fileSize")
    val fileSize: Long = 0L,

    @SerializedName("checksum")
    val checksum: String = "",

    @SerializedName("bubbleText")
    val bubbleText: String = "이 고기가 어떤 부위인지 궁금하신가요?"
) {
    fun isValid(): Boolean {
        return version >= 1L
    }
}
