package com.antigravity.meatguideoverlay.update

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import com.antigravity.meatguideoverlay.BuildConfig
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

/**
 * Checks the signed release manifest hosted on Firebase Hosting, downloads a
 * newer APK only when the version is higher, verifies its SHA-256 digest, then
 * opens Android's standard package installer.
 */
class AppUpdateManager(private val context: Context) {

    companion object {
        private const val RELEASE_MANIFEST_URL =
            "https://meatguideoverlay.web.app/updates/release.json"
        private val ALLOWED_APK_URL_PREFIXES = listOf(
            "https://meatguideoverlay.web.app/updates/",
            "https://firebasestorage.googleapis.com/v0/b/meatguideoverlay.firebasestorage.app/o/"
        )
        private const val APK_MIME_TYPE = "application/vnd.android.package-archive"
    }

    data class ReleaseManifest(
        val versionCode: Int,
        val versionName: String,
        val downloadUrl: String,
        val sha256: String,
        val notes: String = ""
    )

    suspend fun findAvailableUpdate(): ReleaseManifest? = withContext(Dispatchers.IO) {
        val connection = (URL(RELEASE_MANIFEST_URL).openConnection() as HttpURLConnection).apply {
            connectTimeout = 10_000
            readTimeout = 15_000
            requestMethod = "GET"
            useCaches = false
        }

        try {
            require(connection.responseCode == HttpURLConnection.HTTP_OK) {
                "업데이트 정보를 불러오지 못했습니다. (HTTP ${connection.responseCode})"
            }

            val release = connection.inputStream.use { input ->
                InputStreamReader(input, Charsets.UTF_8).use { reader ->
                    Gson().fromJson(reader, ReleaseManifest::class.java)
                }
            }

            validateRelease(release)
            if (release.versionCode > BuildConfig.VERSION_CODE) release else null
        } finally {
            connection.disconnect()
        }
    }

    suspend fun downloadAndVerify(release: ReleaseManifest): File = withContext(Dispatchers.IO) {
        validateRelease(release)

        val updateDir = File(context.cacheDir, "updates").apply { mkdirs() }
        val targetFile = File(updateDir, "meatguide-overlay-${release.versionCode}.apk")
        val temporaryFile = File(updateDir, "meatguide-overlay-${release.versionCode}.part")
        temporaryFile.delete()

        val connection = (URL(release.downloadUrl).openConnection() as HttpURLConnection).apply {
            connectTimeout = 15_000
            readTimeout = 60_000
            requestMethod = "GET"
            useCaches = false
        }

        try {
            require(connection.responseCode == HttpURLConnection.HTTP_OK) {
                "업데이트 파일을 내려받지 못했습니다. (HTTP ${connection.responseCode})"
            }
            connection.inputStream.use { input ->
                temporaryFile.outputStream().use { output ->
                    input.copyTo(output)
                }
            }

            val downloadedChecksum = sha256(temporaryFile)
            require(downloadedChecksum.equals(release.sha256, ignoreCase = true)) {
                "업데이트 파일 검증에 실패했습니다. 다시 시도해 주세요."
            }

            if (targetFile.exists()) targetFile.delete()
            require(temporaryFile.renameTo(targetFile)) {
                "업데이트 파일을 준비하지 못했습니다."
            }
            targetFile
        } finally {
            connection.disconnect()
            if (temporaryFile.exists()) temporaryFile.delete()
        }
    }

    fun canRequestPackageInstalls(): Boolean {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.O ||
            context.packageManager.canRequestPackageInstalls()
    }

    fun openUnknownSourcesSettings() {
        val intent = Intent(
            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
            Uri.parse("package:${context.packageName}")
        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }

    fun launchInstaller(apkFile: File) {
        val apkUri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            apkFile
        )
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(apkUri, APK_MIME_TYPE)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    private fun validateRelease(release: ReleaseManifest) {
        require(release.versionCode > 0) { "업데이트 버전 정보가 올바르지 않습니다." }
        require(release.versionName.isNotBlank()) { "업데이트 이름이 올바르지 않습니다." }
        require(ALLOWED_APK_URL_PREFIXES.any { prefix -> release.downloadUrl.startsWith(prefix) }) {
            "허용되지 않은 업데이트 주소입니다."
        }
        require(release.sha256.matches(Regex("^[A-Fa-f0-9]{64}$"))) {
            "업데이트 파일 검증 정보가 올바르지 않습니다."
        }
    }

    private fun sha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { input ->
            val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
            while (true) {
                val count = input.read(buffer)
                if (count <= 0) break
                digest.update(buffer, 0, count)
            }
        }
        return digest.digest().joinToString("") { byte -> "%02x".format(byte) }
    }
}
