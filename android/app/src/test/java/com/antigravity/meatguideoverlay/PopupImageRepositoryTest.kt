package com.antigravity.meatguideoverlay

import com.antigravity.meatguideoverlay.data.datasource.PopupLocalStore
import com.antigravity.meatguideoverlay.data.datasource.PopupRemoteSource
import com.antigravity.meatguideoverlay.data.model.ActivePopupInfo
import com.antigravity.meatguideoverlay.data.repository.PopupImageRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.ByteArrayInputStream
import java.io.File
import java.io.InputStream

@OptIn(ExperimentalCoroutinesApi::class)
class PopupImageRepositoryTest {

    @get:Rule
    val tempFolder = TemporaryFolder()

    private val storage = "https://firebasestorage.googleapis.com/v0/b/meatguideoverlay.firebasestorage.app/o/popups%2F"
    private val koA = "${storage}1_ko_a.png?alt=media"
    private val koB = "${storage}2_ko_b.png?alt=media"
    private val koC = "${storage}3_ko_c.png?alt=media"
    private val en = "${storage}1_en.png?alt=media"
    private val ja = "${storage}1_ja.png?alt=media"

    private val tenMinutes = 10 * 60_000L

    @Test
    fun failedPosterDownloadIsRetriedAndNewVersionWaitsForIt() = runTest {
        val store = storeWith(popup(version = 7, ko = koA))
        val remote = FakeRemote().apply { failuresBeforeSuccess[koB] = 2 }
        val repository = repositoryFor(store, remote)

        remote.snapshots.value = popup(version = 8, ko = koB)
        runCurrent()

        assertEquals(7L, repository.activePopupState.value.version)
        assertEquals(koA, store.imageSources["ko"])

        advanceTimeBy(tenMinutes)
        runCurrent()

        assertEquals(8L, repository.activePopupState.value.version)
        assertEquals(8L, store.savedInfo.version)
        assertEquals(koB, store.imageSources["ko"])
        assertEquals(3, remote.downloadAttempts[koB])
    }

    @Test
    fun invalidDownloadedImageKeepsPreviousVersion() = runTest {
        val store = storeWith(popup(version = 7, ko = koA)).apply { rejectDownloadedImages = true }
        val remote = FakeRemote()
        val repository = repositoryFor(store, remote)

        remote.snapshots.value = popup(version = 8, ko = koB)
        runCurrent()
        advanceTimeBy(60_000)
        runCurrent()

        assertEquals(7L, repository.activePopupState.value.version)
        assertEquals(koA, store.imageSources["ko"])

        store.rejectDownloadedImages = false
        advanceTimeBy(tenMinutes)
        runCurrent()

        assertEquals(8L, repository.activePopupState.value.version)
        assertEquals(koB, store.imageSources["ko"])
    }

    @Test
    fun settingsOnlyChangeAppliesWithoutDownloadingPostersAgain() = runTest {
        val store = storeWith(popup(version = 7, ko = koA))
        val remote = FakeRemote()
        val repository = repositoryFor(store, remote)

        remote.snapshots.value = popup(version = 8, ko = koA, bubbleKo = "오늘의 추천 부위를 확인해 보세요!")
        runCurrent()

        assertEquals(8L, repository.activePopupState.value.version)
        assertEquals("오늘의 추천 부위를 확인해 보세요!", repository.activePopupState.value.bubbleTextKo)
        assertTrue(remote.downloadAttempts.isEmpty())
    }

    @Test
    fun newerSnapshotReplacesPendingRetry() = runTest {
        val store = storeWith(popup(version = 7, ko = koA))
        val remote = FakeRemote().apply { failuresBeforeSuccess[koB] = Int.MAX_VALUE }
        val repository = repositoryFor(store, remote)

        remote.snapshots.value = popup(version = 8, ko = koB)
        runCurrent()
        remote.snapshots.value = popup(version = 9, ko = koC)
        runCurrent()
        advanceTimeBy(3 * tenMinutes)
        runCurrent()

        assertEquals(9L, repository.activePopupState.value.version)
        assertEquals(koC, store.imageSources["ko"])
        assertEquals(1, remote.downloadAttempts[koB])
    }

    @Test
    fun bundledAssetPathsAreNotDownloaded() = runTest {
        val store = storeWith(popup(version = 7, ko = koA))
        val remote = FakeRemote()
        val repository = repositoryFor(store, remote)

        remote.snapshots.value = popup(
            version = 8,
            ko = koA,
            en = "/assets/pork_guide_poster_en_hq.png",
            ja = "pork_guide_poster_ja_hq.png"
        )
        runCurrent()

        assertEquals(8L, repository.activePopupState.value.version)
        assertTrue(remote.downloadAttempts.isEmpty())
    }

    @Test
    fun posterMissedByEarlierVersionIsDownloadedWithoutNewVersion() = runTest {
        // Metadata already says v8 / poster B, but the cached poster is still A.
        val store = storeWith(popup(version = 8, ko = koB), koImageSource = koA)
        val remote = FakeRemote()
        repositoryFor(store, remote)

        remote.snapshots.value = popup(version = 8, ko = koB)
        runCurrent()

        assertEquals(koB, store.imageSources["ko"])
        assertEquals(1, remote.downloadAttempts[koB])
    }

    @Test
    fun manualSyncFetchesServerStateAndAppliesNewPoster() = runTest {
        val store = storeWith(popup(version = 7, ko = koA))
        val remote = FakeRemote().apply { serverState = popup(version = 8, ko = koB) }
        val repository = repositoryFor(store, remote)

        val synced = repository.refreshSync()

        assertTrue(synced)
        assertEquals(8L, repository.activePopupState.value.version)
        assertEquals(koB, store.imageSources["ko"])
    }

    @Test
    fun manualSyncReportsFailureWhenServerIsUnreachable() = runTest {
        val store = storeWith(popup(version = 7, ko = koA))
        val remote = FakeRemote().apply { serverState = null }
        val repository = repositoryFor(store, remote)

        val synced = repository.refreshSync()

        assertFalse(synced)
        assertEquals(7L, repository.activePopupState.value.version)
    }

    @Test
    fun manualSyncReportsFailureWhenPosterDownloadFails() = runTest {
        val store = storeWith(popup(version = 7, ko = koA))
        val remote = FakeRemote().apply {
            serverState = popup(version = 8, ko = koB)
            failuresBeforeSuccess[koB] = 1
        }
        val repository = repositoryFor(store, remote)

        val synced = repository.refreshSync()

        assertFalse(synced)
        assertEquals(7L, repository.activePopupState.value.version)
    }

    private fun popup(
        version: Long,
        ko: String,
        en: String = this.en,
        ja: String = this.ja,
        bubbleKo: String = "이 고기가 어떤 부위인지 궁금하신가요?"
    ) = ActivePopupInfo(
        imageUrl = ko,
        imageUrlKo = ko,
        imageUrlEn = en,
        imageUrlJa = ja,
        version = version,
        bubbleText = bubbleKo,
        bubbleTextKo = bubbleKo
    )

    private fun storeWith(info: ActivePopupInfo, koImageSource: String = info.imageUrlKo) = FakeStore(
        initialInfo = info,
        imageSources = mapOf("ko" to koImageSource, "en" to info.imageUrlEn, "ja" to info.imageUrlJa),
        cacheDir = tempFolder.root
    )

    private fun TestScope.repositoryFor(store: FakeStore, remote: FakeRemote): PopupImageRepository {
        val repository = PopupImageRepository(
            localDataSource = store,
            firebaseDataSource = remote,
            externalScope = backgroundScope
        )
        runCurrent()
        return repository
    }

    private class FakeStore(
        initialInfo: ActivePopupInfo,
        imageSources: Map<String, String>,
        private val cacheDir: File
    ) : PopupLocalStore {
        var savedInfo: ActivePopupInfo = initialInfo
            private set
        val imageSources = imageSources.toMutableMap()
        var rejectDownloadedImages = false

        override suspend fun ensureAllLocalImagesAvailable() = Unit

        override suspend fun ensureLocalImageAvailable(lang: String): File? = getCachedImageFile(lang)

        override fun getCachedImageFile(lang: String): File = File(cacheDir, "$lang.png")

        override suspend fun getActivePopupInfo(): ActivePopupInfo = savedInfo

        override suspend fun saveActivePopupInfo(info: ActivePopupInfo): Boolean {
            savedInfo = info
            return true
        }

        override suspend fun saveDownloadedImage(inputStream: InputStream, lang: String, sourceUrl: String): Boolean {
            inputStream.use { it.readBytes() }
            if (rejectDownloadedImages) return false
            imageSources[lang] = sourceUrl
            return true
        }

        override suspend fun hasImageFrom(lang: String, sourceUrl: String): Boolean =
            imageSources[lang] == sourceUrl
    }

    private class FakeRemote : PopupRemoteSource {
        val snapshots = MutableStateFlow<ActivePopupInfo?>(null)
        val failuresBeforeSuccess = mutableMapOf<String, Int>()
        val downloadAttempts = mutableMapOf<String, Int>()
        var serverState: ActivePopupInfo? = null // null = server unreachable

        override fun observeActivePopup(): Flow<ActivePopupInfo?> = snapshots

        override suspend fun fetchActivePopup(): ActivePopupInfo? = serverState

        override fun downloadImageStream(imageUrl: String): InputStream? {
            downloadAttempts[imageUrl] = (downloadAttempts[imageUrl] ?: 0) + 1
            val remainingFailures = failuresBeforeSuccess[imageUrl] ?: 0
            if (remainingFailures > 0) {
                failuresBeforeSuccess[imageUrl] = remainingFailures - 1
                return null // same as an HTTP error or timeout in FirebasePopupDataSource
            }
            return ByteArrayInputStream(byteArrayOf(0x50, 0x4E, 0x47))
        }
    }
}
