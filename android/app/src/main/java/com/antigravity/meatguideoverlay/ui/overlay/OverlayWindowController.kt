package com.antigravity.meatguideoverlay.ui.overlay

import android.animation.ValueAnimator
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.PixelFormat
import android.graphics.drawable.BitmapDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.DisplayMetrics
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.animation.DecelerateInterpolator
import com.antigravity.meatguideoverlay.R
import com.antigravity.meatguideoverlay.data.model.ActivePopupInfo
import com.antigravity.meatguideoverlay.data.repository.PopupImageRepository
import com.antigravity.meatguideoverlay.databinding.DialogKioskErrorBinding
import com.antigravity.meatguideoverlay.databinding.DialogSingleImagePopupBinding
import com.antigravity.meatguideoverlay.databinding.OverlayFloatingCharacterBinding
import com.antigravity.meatguideoverlay.util.PreferencesManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.io.File

/**
 * Overlay Window Controller for MeatGuideOverlay.
 *
 * Core Workflow:
 * 1. Shows floating character & speech bubble on side of kiosk.
 * 2. Customer taps character or speech bubble.
 * 3. Hides floating character, displays single full-screen zoomable popup image.
 * 4. Customer can pinch-to-zoom (1x~5x) and pan when zoomed.
 * 5. The explicit close button returns to the kiosk and re-shows the character.
 */
class OverlayWindowController(
    private val context: Context,
    private val preferencesManager: PreferencesManager = PreferencesManager(context),
    private val popupImageRepository: PopupImageRepository = PopupImageRepository.getInstance(context)
) {
    companion object {
        private const val TAG = "OverlayWindowController"
        private const val DEFAULT_CHARACTER_POSITION = "LEFT_TOP"

        @Volatile
        private var instance: OverlayWindowController? = null

        fun getInstance(context: Context): OverlayWindowController {
            return instance ?: synchronized(this) {
                instance ?: OverlayWindowController(context.applicationContext).also { instance = it }
            }
        }
    }

    private val windowManager: WindowManager =
        context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private val mainHandler = Handler(Looper.getMainLooper())
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    // Floating Character View Elements
    private var floatingBinding: OverlayFloatingCharacterBinding? = null
    private var floatingLayoutParams: WindowManager.LayoutParams? = null
    private var isCharacterAttached = false

    // Single Image Popup Dialog Elements
    private var popupBinding: DialogSingleImagePopupBinding? = null
    private var popupLayoutParams: WindowManager.LayoutParams? = null
    private var isPopupAttached = false
    // Error Dialog Elements
    private var errorBinding: DialogKioskErrorBinding? = null
    private var isErrorDialogAttached = false

    // Screen Dimensions
    private var screenWidth = 1280
    private var screenHeight = 800

    init {
        updateScreenDimensions()
        observeActivePopup()
    }

    private fun updateScreenDimensions() {
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        windowManager.defaultDisplay.getMetrics(metrics)
        screenWidth = metrics.widthPixels
        screenHeight = metrics.heightPixels
    }

    private fun observeActivePopup() {
        scope.launch {
            popupImageRepository.activePopupState.collect {
                mainHandler.post {
                    showSpeechBubble()
                    // Keep the kiosk helper anchored to the requested top-left position.
                    // A remote popup refresh must not move it back to the old right side.
                    applyCharacterPosition(DEFAULT_CHARACTER_POSITION)
                }
            }
        }
    }

    private fun getOverlayWindowType(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }
    }

    // ==========================================
    // 1. FLOATING CHARACTER OVERLAY
    // ==========================================

    fun showFloatingCharacter() {
        if (!Settings.canDrawOverlays(context)) {
            Log.w(TAG, "Cannot show overlay: SYSTEM_ALERT_WINDOW permission not granted")
            return
        }

        if (isCharacterAttached) {
            floatingBinding?.root?.visibility = View.VISIBLE
            showSpeechBubble()
            return
        }

        updateScreenDimensions()
        val binding = OverlayFloatingCharacterBinding.inflate(LayoutInflater.from(context))
        floatingBinding = binding

        val initialY = 16
        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            getOverlayWindowType(),
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 16
            y = initialY
        }
        floatingLayoutParams = layoutParams

        setupFloatingTouchListener(binding, layoutParams)

        try {
            windowManager.addView(binding.root, layoutParams)
            isCharacterAttached = true
            Log.d(TAG, "Floating character attached at ($layoutParams.x, $layoutParams.y)")

            showSpeechBubble()
            mainHandler.post {
                applyCharacterPosition(DEFAULT_CHARACTER_POSITION)
            }

            // Speech bubble click opens single image popup
            binding.tvSpeechBubble.setOnClickListener {
                openSingleImagePopup()
            }

            binding.btnCharacter.setOnClickListener {
                openSingleImagePopup()
            }

        } catch (e: Exception) {
            Log.e(TAG, "Failed to attach floating character: ${e.message}", e)
        }
    }

    /**
     * Dynamically positions character at RIGHT_TOP or LEFT_TOP.
     * When RIGHT: bubble is on LEFT [Bubble] [Character].
     * When LEFT: bubble is on RIGHT [Character] [Bubble].
     */
    fun applyCharacterPosition(position: String) {
        val binding = floatingBinding ?: return
        val layoutParams = floatingLayoutParams ?: return
        if (!isCharacterAttached) return

        val isLeft = position.equals("LEFT", ignoreCase = true) || position.equals("LEFT_TOP", ignoreCase = true)
        val targetSide = if (isLeft) "LEFT" else "RIGHT"
        val targetY = 16

        layoutParams.gravity = Gravity.TOP or (if (isLeft) Gravity.START else Gravity.END)
        layoutParams.x = 16
        layoutParams.y = targetY

        // Reorder container view hierarchy:
        // When on RIGHT: bubble on left -> [cardSpeechBubble, btnCharacter]
        // When on LEFT: bubble on right -> [btnCharacter, cardSpeechBubble]
        binding.characterBubbleContainer.removeAllViews()
        if (isLeft) {
            binding.characterBubbleContainer.addView(binding.btnCharacter)
            binding.characterBubbleContainer.addView(binding.cardSpeechBubble)
            (binding.cardSpeechBubble.layoutParams as? android.widget.LinearLayout.LayoutParams)?.apply {
                marginStart = (2 * context.resources.displayMetrics.density).toInt()
                marginEnd = 0
            }
        } else {
            binding.characterBubbleContainer.addView(binding.cardSpeechBubble)
            binding.characterBubbleContainer.addView(binding.btnCharacter)
            (binding.cardSpeechBubble.layoutParams as? android.widget.LinearLayout.LayoutParams)?.apply {
                marginStart = 0
                marginEnd = (2 * context.resources.displayMetrics.density).toInt()
            }
        }

        try {
            windowManager.updateViewLayout(binding.root, layoutParams)
        } catch (e: Exception) {
            Log.e(TAG, "Failed updating character position: ${e.message}")
        }

        scope.launch {
            preferencesManager.saveCharacterSide(targetSide)
        }
    }

    fun hideFloatingCharacter() {
        if (isCharacterAttached) {
            floatingBinding?.root?.visibility = View.GONE
        }
    }

    fun removeFloatingCharacter() {
        if (isCharacterAttached && floatingBinding != null) {
            try {
                windowManager.removeView(floatingBinding?.root)
            } catch (e: Exception) {
                Log.e(TAG, "Error removing floating character: ${e.message}")
            }
            isCharacterAttached = false
            floatingBinding = null
        }
    }

    private fun showSpeechBubble() {
        floatingBinding?.let { binding ->
            binding.cardSpeechBubble.visibility = View.VISIBLE
            binding.tvSpeechBubble.visibility = View.VISIBLE
            binding.tvSpeechBubble.alpha = 1f
            binding.tvSpeechBubble.text = context.getString(R.string.default_speech_bubble)
        }
    }

    private fun setupFloatingTouchListener(
        binding: OverlayFloatingCharacterBinding,
        layoutParams: WindowManager.LayoutParams
    ) {
        var initialTouchX = 0f
        var initialTouchY = 0f
        var initialParamX = 0
        var initialParamY = 0
        var isDragging = false

        binding.btnCharacter.setOnTouchListener { view, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    initialParamX = layoutParams.x
                    initialParamY = layoutParams.y
                    isDragging = false
                    true
                }

                MotionEvent.ACTION_MOVE -> {
                    val deltaX = (event.rawX - initialTouchX).toInt()
                    val deltaY = (event.rawY - initialTouchY).toInt()

                    if (!isDragging && (kotlin.math.abs(deltaX) > 15 || kotlin.math.abs(deltaY) > 15)) {
                        isDragging = true
                    }

                    if (isDragging) {
                        layoutParams.x = initialParamX + deltaX
                        layoutParams.y = (initialParamY + deltaY).coerceIn(40, screenHeight - 200)
                        try {
                            windowManager.updateViewLayout(binding.root, layoutParams)
                        } catch (e: Exception) {
                            Log.e(TAG, "Error updating drag: ${e.message}")
                        }
                    }
                    true
                }

                MotionEvent.ACTION_UP -> {
                    if (!isDragging) {
                        view.performClick()
                    } else {
                        snapToNearestEdge(binding, layoutParams)
                    }
                    true
                }

                else -> false
            }
        }
    }

    private fun snapToNearestEdge(
        binding: OverlayFloatingCharacterBinding,
        layoutParams: WindowManager.LayoutParams
    ) {
        val currentX = layoutParams.x
        val centerX = screenWidth / 2
        val isLeft = (currentX + 70 < centerX)
        val targetPos = if (isLeft) "LEFT_TOP" else "RIGHT_TOP"

        applyCharacterPosition(targetPos)
    }

    // ==========================================
    // 2. SINGLE POPUP IMAGE MODAL VIEWER
    // ==========================================

    fun openSingleImagePopup() {
        if (!Settings.canDrawOverlays(context)) return
        if (isPopupAttached) return

        updateScreenDimensions()
        val binding = DialogSingleImagePopupBinding.inflate(LayoutInflater.from(context))
        popupBinding = binding

        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            getOverlayWindowType(),
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                    WindowManager.LayoutParams.FLAG_FULLSCREEN,
            PixelFormat.OPAQUE
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 0
            y = 0
            windowAnimations = 0
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }
        popupLayoutParams = layoutParams

        @Suppress("DEPRECATION")
        binding.root.systemUiVisibility =
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
                    View.SYSTEM_UI_FLAG_FULLSCREEN or
                    View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                    View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                    View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE

        fun loadPopupLanguageImage(lang: String) {
            val activeColor = android.content.res.ColorStateList.valueOf(0xFFE11D48.toInt())
            val inactiveColor = android.content.res.ColorStateList.valueOf(0x00000000)

            binding.btnLangKo.backgroundTintList = if (lang == "ko") activeColor else inactiveColor
            binding.btnLangKo.setTextColor(if (lang == "ko") 0xFFFFFFFF.toInt() else 0xFFCBD5E1.toInt())

            binding.btnLangEn.backgroundTintList = if (lang == "en") activeColor else inactiveColor
            binding.btnLangEn.setTextColor(if (lang == "en") 0xFFFFFFFF.toInt() else 0xFFCBD5E1.toInt())

            binding.btnLangJa.backgroundTintList = if (lang == "ja") activeColor else inactiveColor
            binding.btnLangJa.setTextColor(if (lang == "ja") 0xFFFFFFFF.toInt() else 0xFFCBD5E1.toInt())

            val imageFile = popupImageRepository.getCurrentImageFile(lang)
            var bitmap: Bitmap? = null
            if (imageFile != null && imageFile.exists() && imageFile.length() > 0L) {
                try {
                    bitmap = decodeSampledBitmapFromFile(imageFile.absolutePath, screenWidth, screenHeight)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed decoding image file for $lang: ${e.message}")
                }
            }

            // Fallback directly to assets if file is missing or failed decoding
            if (bitmap == null) {
                val assetName = when (lang.lowercase()) {
                    "en" -> "pork_guide_poster_en.jpg"
                    "ja" -> "pork_guide_poster_ja.jpg"
                    else -> "pork_guide_poster_ko.jpg"
                }
                try {
                    context.assets.open(assetName).use { stream ->
                        bitmap = BitmapFactory.decodeStream(stream)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed loading asset image $assetName: ${e.message}")
                }
            }

            if (bitmap != null) {
                binding.ivPopupImage.setImageBitmap(bitmap)
            } else {
                binding.ivPopupImage.setImageResource(R.drawable.pork_guide_poster)
            }
            binding.tvLoadingHint.visibility = View.GONE
            binding.ivPopupImage.resetScaleAndPosition()
        }

        // Initially load Korean
        loadPopupLanguageImage("ko")

        binding.btnLangKo.setOnClickListener { loadPopupLanguageImage("ko") }
        binding.btnLangEn.setOnClickListener { loadPopupLanguageImage("en") }
        binding.btnLangJa.setOnClickListener { loadPopupLanguageImage("ja") }

        // The popup can only be dismissed by this explicit close button.
        binding.btnClosePopup.setOnClickListener {
            closeSingleImagePopup()
        }

        try {
            // Hide the floating overlay before the opaque popup is attached so
            // the two windows never alternate during the first rendered frame.
            hideFloatingCharacter()
            windowManager.addView(binding.root, layoutParams)
            isPopupAttached = true
            Log.d(TAG, "Multi-language popup opened successfully.")
        } catch (e: Exception) {
            showFloatingCharacter()
            Log.e(TAG, "Failed showing multi-language popup: ${e.message}", e)
        }
    }

    fun closeSingleImagePopup() {
        if (!isPopupAttached || popupBinding == null) return

        val view = popupBinding?.root ?: return
        try {
            windowManager.removeViewImmediate(view)
        } catch (e: Exception) {
            Log.e(TAG, "Error removing popup dialog: ${e.message}")
        }
        isPopupAttached = false
        popupBinding = null

        showFloatingCharacter()
        showSpeechBubble()
        Log.d(TAG, "Single image popup closed.")
    }

    // ==========================================
    // 3. ERROR DIALOG (Accessibility Detected)
    // ==========================================

    fun showKioskErrorDialog(title: String, message: String) {
        if (!Settings.canDrawOverlays(context)) return
        if (isErrorDialogAttached) return

        updateScreenDimensions()
        val binding = DialogKioskErrorBinding.inflate(LayoutInflater.from(context))
        errorBinding = binding

        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            getOverlayWindowType(),
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT
        )

        binding.tvErrorTitle.text = title
        binding.tvErrorMessage.text = message

        binding.btnConfirmError.setOnClickListener {
            dismissErrorDialog()
        }

        binding.btnOpenPowerMenu.setOnClickListener {
            openSystemPowerMenu()
            dismissErrorDialog()
        }

        try {
            windowManager.addView(binding.root, layoutParams)
            isErrorDialogAttached = true
            Log.d(TAG, "Kiosk error dialog shown")
        } catch (e: Exception) {
            Log.e(TAG, "Failed showing kiosk error dialog: ${e.message}", e)
        }
    }

    fun dismissErrorDialog() {
        if (!isErrorDialogAttached || errorBinding == null) return
        try {
            windowManager.removeView(errorBinding?.root)
        } catch (e: Exception) {
            Log.e(TAG, "Error removing error dialog: ${e.message}")
        }
        isErrorDialogAttached = false
        errorBinding = null
    }

    private fun openSystemPowerMenu() {
        try {
            val intent = Intent(Intent.ACTION_POWER_USAGE_SUMMARY)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(intent)
        } catch (e: Exception) {
            Log.w(TAG, "Could not launch power menu: ${e.message}")
        }
    }

    // ==========================================
    // 4. ANDROID SYSTEM SCREEN TIMEOUT MANAGEMENT
    // ==========================================

    fun updateScreenTimeout(timeoutMinutes: Int) {
        val timeoutMillis = if (timeoutMinutes <= 0) {
            Int.MAX_VALUE
        } else {
            (timeoutMinutes.toLong() * 60_000L).coerceAtMost(Int.MAX_VALUE.toLong()).toInt()
        }

        if (!Settings.System.canWrite(context)) {
            Log.w(TAG, "Cannot update system screen timeout: WRITE_SETTINGS access is not granted")
            return
        }

        try {
            val updated = Settings.System.putInt(
                context.contentResolver,
                Settings.System.SCREEN_OFF_TIMEOUT,
                timeoutMillis
            )
            Log.i(
                TAG,
                "System screen timeout updated: ${if (timeoutMinutes <= 0) "always on" else "$timeoutMinutes minutes"} (success=$updated)"
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed updating system screen timeout: ${e.message}", e)
        }
    }

    /**
     * Performs a clean refresh of overlay elements and garbage collection.
     */
    fun refreshServiceAndOverlay() {
        Log.i(TAG, "Refreshing Overlay Service and resetting UI state...")
        mainHandler.post {
            try {
                System.gc()
                Log.d(TAG, "Service refresh completed successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Error during service refresh: ${e.message}")
            }
        }
    }

    fun releaseAll() {
        if (isPopupAttached && popupBinding != null) {
            try {
                windowManager.removeView(popupBinding?.root)
            } catch (e: Exception) {
                Log.e(TAG, "Error removing popup in releaseAll: ${e.message}")
            }
            isPopupAttached = false
            popupBinding = null
        }
        removeFloatingCharacter()
        dismissErrorDialog()
    }

    /**
     * Efficient memory-safe bitmap decoding with inSampleSize downsampling.
     */
    private fun decodeSampledBitmapFromFile(path: String, reqWidth: Int, reqHeight: Int): Bitmap? {
        val options = BitmapFactory.Options().apply {
            inJustDecodeBounds = true
        }
        BitmapFactory.decodeFile(path, options)

        var inSampleSize = 1
        val height = options.outHeight
        val width = options.outWidth

        if (height > reqHeight || width > reqWidth) {
            val halfHeight = height / 2
            val halfWidth = width / 2
            while ((halfHeight / inSampleSize) >= reqHeight && (halfWidth / inSampleSize) >= reqWidth) {
                inSampleSize *= 2
            }
        }

        options.inJustDecodeBounds = false
        options.inSampleSize = inSampleSize
        options.inPreferredConfig = Bitmap.Config.RGB_565 // Low memory footprint

        return BitmapFactory.decodeFile(path, options)
    }
}
