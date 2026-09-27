package com.antigravity.meatguideoverlay.util

/** Chooses BitmapFactory sampling for popup posters. */
object PosterSampling {

    /**
     * Upper bound on decoded pixels (10 MP ≈ 40 MB in ARGB_8888, enough for 3x a
     * 1280x800 screen). The bundled 3072x2046 posters fit at full resolution;
     * oversized uploads are halved until they fit so low-memory tablets do not run
     * out of memory.
     */
    const val MAX_DECODED_PIXELS = 10_000_000L

    fun inSampleSize(width: Int, height: Int, reqWidth: Int, reqHeight: Int): Int {
        var inSampleSize = 1
        if (height > reqHeight || width > reqWidth) {
            val halfHeight = height / 2
            val halfWidth = width / 2
            while ((halfHeight / inSampleSize) >= reqHeight && (halfWidth / inSampleSize) >= reqWidth) {
                inSampleSize *= 2
            }
        }
        while ((width.toLong() / inSampleSize) * (height.toLong() / inSampleSize) > MAX_DECODED_PIXELS) {
            inSampleSize *= 2
        }
        return inSampleSize
    }
}
