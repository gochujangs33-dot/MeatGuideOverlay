package com.antigravity.meatguideoverlay.data.model

import com.google.gson.annotations.SerializedName

/**
 * Top-level published content model.
 * Validates schema and ensures integrity of data received from Firestore/Local.
 */
data class ContentManifest(
    @SerializedName("schemaVersion")
    val schemaVersion: String = "1.0.0",

    @SerializedName("contentVersion")
    val contentVersion: Long = 1L,

    @SerializedName("updatedAt")
    val updatedAt: String = "",

    @SerializedName("publishedBy")
    val publishedBy: String = "",

    @SerializedName("bubbleText")
    val bubbleText: String = "이 고기가 어떤 부위인지 궁금하신가요?",

    @SerializedName("characterImage")
    val characterImage: CharacterImage = CharacterImage(),

    @SerializedName("porkCategory")
    val porkCategory: PorkCategory = PorkCategory(),

    @SerializedName("beefRibItem")
    val beefRibItem: BeefRibItem = BeefRibItem(),

    @SerializedName("kioskErrorTexts")
    val kioskErrorTexts: List<String> = listOf("서버에 접속이 끊겼습니다"),

    @SerializedName("restartGuide")
    val restartGuide: RestartGuide = RestartGuide(),

    @SerializedName("uiSettings")
    val uiSettings: UiSettings = UiSettings()
) {
    /**
     * Strict validation:
     * - Schema version must match supported version (1.x.x)
     * - Beef must strictly be 소생갈비살
     * - No prohibited beef items (e.g. 육회, 뿌리살, 업진살)
     */
    fun isValid(): Boolean {
        if (!schemaVersion.startsWith("1.")) return false
        if (contentVersion <= 0) return false
        if (bubbleText.isBlank()) return false
        if (porkCategory.title.isBlank() || porkCategory.items.isEmpty()) return false

        // Strict beef constraints check
        val beefName = beefRibItem.name.trim()
        if (beefName != "소생갈비살") return false
        if (beefName.contains("육회") || beefName.contains("뿌리살") || beefName.contains("업진살")) {
            return false
        }

        // Check if any prohibited beef items slipped into pork items
        for (item in porkCategory.items) {
            if (item.name.contains("육회") || item.name.contains("뿌리살") || item.name.contains("업진살")) {
                return false
            }
        }

        return true
    }
}

data class CharacterImage(
    @SerializedName("url")
    val url: String = "assets/char_mascot.png",

    @SerializedName("alt")
    val alt: String = "고기 부위 안내 캐릭터",

    @SerializedName("mimeType")
    val mimeType: String = "image/png",

    @SerializedName("fileSize")
    val fileSize: Long = 0L,

    @SerializedName("version")
    val version: String = "1.0.0"
)

data class PorkCategory(
    @SerializedName("title")
    val title: String = "돼지고기 특수부위",

    @SerializedName("description")
    val description: String = "엄선된 최고급 돼지고기 특수부위 안내",

    @SerializedName("items")
    val items: List<PorkItem> = emptyList()
)

data class PorkItem(
    @SerializedName("id")
    val id: String = "",

    @SerializedName("name")
    val name: String = "",

    @SerializedName("cutPosition")
    val cutPosition: String = "",

    @SerializedName("description")
    val description: String = "",

    @SerializedName("taste")
    val taste: String = "",

    @SerializedName("texture")
    val texture: String = "",

    @SerializedName("recommendation")
    val recommendation: String = "",

    @SerializedName("order")
    val order: Int = 0,

    @SerializedName("visible")
    val visible: Boolean = true,

    @SerializedName("imageUrl")
    val imageUrl: String = "",

    @SerializedName("silhouetteUrl")
    val silhouetteUrl: String = ""
)

data class BeefRibItem(
    @SerializedName("id")
    val id: String = "beef_rib_single",

    @SerializedName("name")
    val name: String = "소생갈비살",

    @SerializedName("cutPosition")
    val cutPosition: String = "갈비뼈 사이의 정선된 꽃갈비살 부위",

    @SerializedName("description")
    val description: String = "갈비뼈 사이에서 정성스럽게 발라낸 최상급 생갈비살로 육즙과 마블링의 조화가 뛰어납니다.",

    @SerializedName("taste")
    val taste: String = "풍부한 육즙과 진한 소고기 고유의 감칠맛",

    @SerializedName("texture")
    val texture: String = "부드러우면서도 씹을수록 터져 나오는 촉촉한 육즙의 식감",

    @SerializedName("characteristics")
    val characteristics: String = "마블링이 촘촘하여 숯불에 구웠을 때 최상의 풍미를 냅니다.",

    @SerializedName("recommendation")
    val recommendation: String = "미디엄 웰 정도로 겉면만 노릇하게 구워 와사비나 소금과 함께 드시면 가장 맛있습니다.",

    @SerializedName("imageUrl")
    val imageUrl: String = "assets/beef_galbi.png",

    @SerializedName("silhouetteUrl")
    val silhouetteUrl: String = "assets/cow_diagram_rib.png"
)

data class RestartGuide(
    @SerializedName("title")
    val title: String = "키오스크 서버 연결 오류",

    @SerializedName("message")
    val message: String = "키오스크 서버 연결 오류가 발생했습니다. 태블릿의 전원을 완전히 껐다가 다시 켜 주세요.",

    @SerializedName("cooldownMinutes")
    val cooldownMinutes: Int = 5,

    @SerializedName("allowPowerMenu")
    val allowPowerMenu: Boolean = true
)

data class UiSettings(
    @SerializedName("autoCloseSeconds")
    val autoCloseSeconds: Int = 60,

    @SerializedName("speechBubbleMode")
    val speechBubbleMode: String = "TIMEOUT_THEN_CHAR_ONLY", // ALWAYS, TIMEOUT_THEN_CHAR_ONLY, CHAR_ONLY, HIDDEN

    @SerializedName("speechBubbleTimeoutSeconds")
    val speechBubbleTimeoutSeconds: Int = 8,

    @SerializedName("characterDefaultSide")
    val characterDefaultSide: String = "RIGHT", // LEFT, RIGHT

    @SerializedName("touchOutsideDismiss")
    val touchOutsideDismiss: Boolean = true
)

data class DeviceStatus(
    val deviceUid: String = "",
    val deviceName: String = "태블릿-1",
    val deviceModel: String = "",
    val androidVersion: String = "",
    val appVersion: String = "",
    val contentVersion: Long = 1L,
    val lastSeenAt: String = "",
    val lastSyncSuccessAt: String = "",
    val lastSyncError: String = "",
    val selectedKioskPackage: String = ""
)
