package com.antigravity.meatguideoverlay.util

/** Formatting for the floating speech bubble. */
object BubbleText {
    private const val WORD_JOINER = '\u2060'

    /**
     * Joins the letters of each word with an invisible WORD JOINER so a long
     * bubble wraps only at spaces. Android breaks Korean between any two
     * syllables by default (phrase-based breaking needs Android 13+).
     */
    fun keepWordsTogether(text: String): String =
        text.split(' ').joinToString(" ") { word -> word.toList().joinToString(WORD_JOINER.toString()) }
}
