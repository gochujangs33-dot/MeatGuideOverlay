package com.antigravity.meatguideoverlay

import com.antigravity.meatguideoverlay.util.PosterSampling
import org.junit.Assert.assertEquals
import org.junit.Test

class PosterSamplingTest {

    @Test
    fun bundledPosterIsDecodedAtFullResolution() {
        // 3072x2046 = 6.3 MP, within budget: keep full detail for pinch-zoom.
        assertEquals(1, PosterSampling.inSampleSize(3072, 2046, reqWidth = 3840, reqHeight = 2400))
    }

    @Test
    fun hugePhotoIsDownsampledUnderPixelBudgetEvenOnLargeScreens() {
        // 8000x6000 = 48 MP (~192 MB ARGB). On a 1920x1200 tablet the 3x target is
        // 5760x3600, which never triggers sampling; the pixel budget must.
        // /2 -> 4000x3000 = 12 MP (over the 10 MP budget), /4 -> 2000x1500 = 3 MP.
        assertEquals(4, PosterSampling.inSampleSize(8000, 6000, reqWidth = 5760, reqHeight = 3600))
    }

    @Test
    fun largeImageIsDownsampledTowardsTheRequestedSize() {
        // 7680x4800 for a 1280x800 screen at 3x (3840x2400): /2 fits exactly.
        assertEquals(2, PosterSampling.inSampleSize(7680, 4800, reqWidth = 3840, reqHeight = 2400))
    }
}
