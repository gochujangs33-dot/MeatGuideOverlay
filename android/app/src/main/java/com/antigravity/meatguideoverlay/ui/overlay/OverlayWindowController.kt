package com.antigravity.meatguideoverlay.ui.overlay

import android.animation.ValueAnimator
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.PixelFormat
import android.graphics.drawable.BitmapDrawable
import android.os.Build
import android.os.CountDownTimer
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
import kotlinx.coroutines.flow.first
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
 * 5. Single finger tap closes popup image, returns to kiosk, and re-shows character.
 */
class OverlayWindowController(
    private val context: Context,
    private val preferencesManager: PreferencesManager = PreferencesManager(context),
    private val popupImageRepository: PopupImageRepository = PopupImageRepository.getInstance(context)
) {
    companion object {
        private const val TAG = "OverlayWindowController"

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
    private var autoCloseTimer: CountDownTimer? = null

    // Error Dialog Elements
    private var errorBinding: DialogKioskErrorBinding? = null
    private var isErrorDialogAttached = false

    // Screen Dimensions
    private var screenWidth = 1280
    private var screenHeight = 800

    // Screen Sleep & Idle Timeout Management
    private var screenTimeoutMinutes: Int = 60
    private val idleHandler = Handler(Looper.getMainLooper())
    private var isScreenSleeping = false
    private var sleepOverlayView: View? = null
    private val idleRunnable = Runnable { enterScreenSleepMode() }

    init {
        updateScreenDimensions()
        observeActivePopup()
        resetIdleTimer()
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
            popupImageRepository.activePopupState.collect { popupInfo ->
                mainHandler.post {
                    floatingBinding?.tvSpeechBubble?.text = popupInfo.bubbleText
                    updateScreenTimeout(popupInfo.screenTimeoutMinutes)
                    applyCharacterPosition(popupInfo.characterPosition)
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
            gravity = Gravity.TOP or Gravity.END
            x = 16
            y = initialY
        }
        floatingLayoutParams = layoutParams

        setupFloatingTouchListener(binding, layoutParams)

        try {
            windowManager.addView(binding.root, layoutParams)
            isCharacterAttached = true
            Log.d(TAG, "Floating character attached at ($layoutParams.x, $layoutParams.y)")

            scope.launch {
                val currentInfo = popupImageRepository.activePopupState.value
                val pos = if (currentInfo.characterPosition.isNotBlank()) {
                    currentInfo.characterPosition
                } else {
                    preferencesManager.characterSideFlow.first()
                }
                mainHandler.post {
                    applyCharacterPosition(pos)
                }
            }

            // Speech bubble click opens single image popup
            binding.tvSpeechBubble.setOnClickListener {
                openSingleImagePopup()
            }

            binding.btnCharacter.setOnClickListener {
                openSingleImagePopup()
            }

            startSpeechBubbleLanguageCycle()
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

    private fun scheduleSpeechBubbleHide(binding: OverlayFloatingCharacterBinding) {
        mainHandler.postDelayed({
            if (isCharacterAttached) {
                binding.tvSpeechBubble.animate()
                    .alpha(0f)
                    .setDuration(400)
                    .withEndAction {
                        binding.tvSpeechBubble.visibility = View.GONE
                        binding.tvSpeechBubble.alpha = 1f
                    }.start()
            }
        }, 8000)
    }

    private fun showSpeechBubbleTemporarily() {
        floatingBinding?.let { binding ->
            binding.tvSpeechBubble.visibility = View.VISIBLE
            binding.tvSpeechBubble.alpha = 1f
            scheduleSpeechBubbleHide(binding)
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

    private var bubbleRotationJob: kotlinx.coroutines.Job? = null
    private var currentBubbleLangIndex = 0

    private fun startSpeechBubbleLanguageCycle() {
        bubbleRotationJob?.cancel()
        bubbleRotationJob = scope.launch {
            while (true) {
                kotlinx.coroutines.delay(3000L)
                if (isPopupAttached || floatingBinding == null) continue

                val popupInfo = popupImageRepository.activePopupState.value
                currentBubbleLangIndex = (currentBubbleLangIndex + 1) % 3
                val nextText = when (currentBubbleLangIndex) {
                    1 -> popupInfo.bubbleTextEn.ifBlank { popupInfo.bubbleText }
                    2 -> popupInfo.bubbleTextJa.ifBlank { popupInfo.bubbleText }
                    else -> popupInfo.bubbleTextKo.ifBlank { popupInfo.bubbleText }
                }

                mainHandler.post {
                    val tv = floatingBinding?.tvSpeechBubble ?: return@post
                    tv.animate().alpha(0f).setDuration(150).withEndAction {
                        tv.text = nextText
                        tv.animate().alpha(1f).setDuration(150).start()
                    }.start()
                }
            }
        }
    }

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
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT
        )
        popupLayoutParams = layoutParams

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

        // STRICT SINGLE TAP TO CLOSE
        binding.ivPopupImage.setOnSingleTapListener {
            Log.d(TAG, "Single tap confirmed on popup image -> Closing popup.")
            closeSingleImagePopup()
        }

        binding.dialogBackdrop.setOnClickListener {
            closeSingleImagePopup()
        }

        binding.btnClosePopup.setOnClickListener {
            closeSingleImagePopup()
        }

        try {
            windowManager.addView(binding.root, layoutParams)
            isPopupAttached = true

            // Temporarily hide character while popup is open
            hideFloatingCharacter()

            resetAutoCloseTimer()

            // Subtle 150ms fade-in animation
            binding.root.alpha = 0f
            binding.root.animate().alpha(1f).setDuration(150).start()
            Log.d(TAG, "Multi-language popup opened successfully.")
        } catch (e: Exception) {
            Log.e(TAG, "Failed showing multi-language popup: ${e.message}", e)
        }
    }

    fun closeSingleImagePopup() {
        if (!isPopupAttached || popupBinding == null) return

        cancelAutoCloseTimer()
        val view = popupBinding?.root ?: return

        view.animate()
            .alpha(0f)
            .setDuration(120)
            .withEndAction {
                try {
                    windowManager.removeView(view)
                } catch (e: Exception) {
                    Log.e(TAG, "Error removing popup dialog: ${e.message}")
                }
                isPopupAttached = false
                popupBinding = null

                // Re-show floating character
                showFloatingCharacter()
                showSpeechBubbleTemporarily()
                Log.d(TAG, "Single image popup closed.")
            }.start()
    }

    private fun resetAutoCloseTimer() {
        autoCloseTimer?.cancel()
        autoCloseTimer = object : CountDownTimer(60000L, 1000L) {
            override fun onTick(millisUntilFinished: Long) {}
            override fun onFinish() {
                if (isPopupAttached) {
                    Log.d(TAG, "Auto-close timer elapsed (60s idle). Closing popup.")
                    closeSingleImagePopup()
                }
            }
        }.start()
    }

    private fun cancelAutoCloseTimer() {
        autoCloseTimer?.cancel()
        autoCloseTimer = null
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
    // 4. SCREEN TIMEOUT & SLEEP MANAGEMENT
    // ==========================================

    fun updateScreenTimeout(timeoutMinutes: Int) {
        this.screenTimeoutMinutes = timeoutMinutes
        Log.d(TAG, "Updated screenTimeoutMinutes: $screenTimeoutMinutes")
        resetIdleTimer()
    }

    fun resetIdleTimer() {
        idleHandler.removeCallbacks(idleRunnable)
        if (isScreenSleeping) {
            wakeScreenFromSleep()
        }
        if (screenTimeoutMinutes > 0) {
            val timeoutMillis = screenTimeoutMinutes * 60 * 1000L
            idleHandler.postDelayed(idleRunnable, timeoutMillis)
        }
    }

    private fun enterScreenSleepMode() {
        if (isScreenSleeping || screenTimeoutMinutes <= 0) return
        isScreenSleeping = true
        Log.i(TAG, "Entering Screen Sleep Mode (No activity for $screenTimeoutMinutes minutes)")

        mainHandler.post {
            try {
                if (sleepOverlayView == null) {
                    val blackView = View(context).apply {
                        setBackgroundColor(0xFF000000.toInt())
                        isClickable = true
                        isFocusable = true
                        setOnClickListener {
                            wakeScreenFromSleep()
                        }
                    }
                    val params = WindowManager.LayoutParams(
                        WindowManager.LayoutParams.MATCH_PARENT,
                        WindowManager.LayoutParams.MATCH_PARENT,
                        getOverlayWindowType(),
                        WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                                WindowManager.LayoutParams.FLAG_FULLSCREEN or
                                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                        PixelFormat.OPAQUE
                    ).apply {
                        screenBrightness = 0.01f
                    }
                    sleepOverlayView = blackView
                    windowManager.addView(blackView, params)
                    Log.d(TAG, "Sleep overlay attached to dim/turn off display")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed creating sleep overlay: ${e.message}")
            }
        }
    }

    private fun wakeScreenFromSleep() {
        if (!isScreenSleeping) return
        isScreenSleeping = false
        Log.i(TAG, "Waking up Screen from Sleep Mode")

        mainHandler.post {
            sleepOverlayView?.let { view ->
                try {
                    windowManager.removeView(view)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed removing sleep overlay: ${e.message}")
                }
                sleepOverlayView = null
            }
        }
    }

    /**
     * Performs a clean refresh of overlay elements and garbage collection.
     */
    fun refreshServiceAndOverlay() {
        Log.i(TAG, "Refreshing Overlay Service and resetting UI state...")
        mainHandler.post {
            try {
                if (isPopupAttached) {
                    closeSingleImagePopup()
                }
                if (isScreenSleeping) {
                    wakeScreenFromSleep()
                }
                resetIdleTimer()
                System.gc()
                Log.d(TAG, "Service refresh completed successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Error during service refresh: ${e.message}")
            }
        }
    }

    fun releaseAll() {
        idleHandler.removeCallbacks(idleRunnable)
        wakeScreenFromSleep()
        cancelAutoCloseTimer()
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
