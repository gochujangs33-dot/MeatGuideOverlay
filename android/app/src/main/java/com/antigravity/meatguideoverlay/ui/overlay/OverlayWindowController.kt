package com.antigravity.meatguideoverlay.ui.overlay

import android.animation.ValueAnimator
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
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
import androidx.recyclerview.widget.GridLayoutManager
import com.antigravity.meatguideoverlay.R
import com.antigravity.meatguideoverlay.data.model.BeefRibItem
import com.antigravity.meatguideoverlay.data.model.ContentManifest
import com.antigravity.meatguideoverlay.data.model.PorkItem
import com.antigravity.meatguideoverlay.databinding.DialogKioskErrorBinding
import com.antigravity.meatguideoverlay.databinding.DialogMeatGuideBinding
import com.antigravity.meatguideoverlay.databinding.OverlayFloatingCharacterBinding
import com.antigravity.meatguideoverlay.util.PreferencesManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class OverlayWindowController(
    private val context: Context,
    private val preferencesManager: PreferencesManager = PreferencesManager(context)
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

    // Modal Meat Guide Dialog Elements
    private var dialogBinding: DialogMeatGuideBinding? = null
    private var dialogLayoutParams: WindowManager.LayoutParams? = null
    private var isDialogAttached = false
    private var autoCloseTimer: CountDownTimer? = null

    // Error Dialog Elements
    private var errorBinding: DialogKioskErrorBinding? = null
    private var isErrorDialogAttached = false

    // Current Content Manifest
    private var currentManifest: ContentManifest = ContentManifest()

    // Screen Dimensions
    private var screenWidth = 1280
    private var screenHeight = 800

    init {
        updateScreenDimensions()
    }

    private fun updateScreenDimensions() {
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        windowManager.defaultDisplay.getMetrics(metrics)
        screenWidth = metrics.widthPixels
        screenHeight = metrics.heightPixels
    }

    private fun getOverlayWindowType(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }
    }

    fun updateContent(manifest: ContentManifest) {
        this.currentManifest = manifest
        mainHandler.post {
            floatingBinding?.let { binding ->
                binding.tvSpeechBubble.text = manifest.bubbleText
            }
            if (isDialogAttached) {
                refreshDialogContent()
            }
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

        if (isCharacterAttached) return

        updateScreenDimensions()
        floatingBinding = OverlayFloatingCharacterBinding.inflate(LayoutInflater.from(context))
        floatingBinding?.tvSpeechBubble?.text = currentManifest.bubbleText

        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            getOverlayWindowType(),
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = screenWidth - 160
            y = screenHeight / 3
        }
        floatingLayoutParams = layoutParams

        // Load saved position
        scope.launch {
            val (savedX, savedY, savedSide) = preferencesManager.charPositionFlow.first()
            mainHandler.post {
                if (savedX >= 0) {
                    layoutParams.x = savedX
                    layoutParams.y = savedY
                } else {
                    layoutParams.x = if (savedSide == "LEFT") 20 else (screenWidth - 160)
                }
                if (isCharacterAttached) {
                    try {
                        windowManager.updateViewLayout(floatingBinding?.root, layoutParams)
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed updating initial position: ${e.message}")
                    }
                }
            }
        }

        setupDragAndClickListener(floatingBinding!!, layoutParams)

        try {
            windowManager.addView(floatingBinding?.root, layoutParams)
            isCharacterAttached = true
            scheduleSpeechBubbleTimeout()
            Log.d(TAG, "Floating character overlay attached successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed adding floating view: ${e.message}", e)
        }
    }

    private fun scheduleSpeechBubbleTimeout() {
        mainHandler.removeCallbacksAndMessages(null)
        val timeoutSeconds = currentManifest.uiSettings.speechBubbleTimeoutSeconds.coerceAtLeast(3)
        val mode = currentManifest.uiSettings.speechBubbleMode

        if (mode == "ALWAYS") {
            floatingBinding?.cardSpeechBubble?.visibility = View.VISIBLE
            return
        }
        if (mode == "CHAR_ONLY") {
            floatingBinding?.cardSpeechBubble?.visibility = View.GONE
            return
        }

        // TIMEOUT_THEN_CHAR_ONLY mode
        floatingBinding?.cardSpeechBubble?.visibility = View.VISIBLE
        mainHandler.postDelayed({
            floatingBinding?.cardSpeechBubble?.animate()
                ?.alpha(0f)
                ?.setDuration(300)
                ?.withEndAction {
                    floatingBinding?.cardSpeechBubble?.visibility = View.GONE
                    floatingBinding?.cardSpeechBubble?.alpha = 1f
                }
                ?.start()
        }, timeoutSeconds * 1000L)
    }

    private fun setupDragAndClickListener(
        binding: OverlayFloatingCharacterBinding,
        params: WindowManager.LayoutParams
    ) {
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f
        var isDragging = false
        val touchSlop = 16f

        binding.btnCharacter.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isDragging = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (event.rawX - initialTouchX).toInt()
                    val dy = (event.rawY - initialTouchY).toInt()

                    if (Math.abs(dx) > touchSlop || Math.abs(dy) > touchSlop) {
                        isDragging = true
                    }

                    if (isDragging) {
                        params.x = (initialX + dx).coerceIn(0, screenWidth - 100)
                        params.y = (initialY + dy).coerceIn(40, screenHeight - 160)
                        try {
                            windowManager.updateViewLayout(binding.root, params)
                        } catch (e: Exception) {
                            Log.e(TAG, "Error moving character: ${e.message}")
                        }
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (!isDragging) {
                        // Click event!
                        openMeatGuideDialog()
                    } else {
                        // Snap to left or right edge
                        snapToNearestEdge(params, binding.root)
                    }
                    true
                }
                else -> false
            }
        }

        binding.cardSpeechBubble.setOnClickListener {
            openMeatGuideDialog()
        }
    }

    private fun snapToNearestEdge(params: WindowManager.LayoutParams, view: View) {
        val currentX = params.x
        val midX = screenWidth / 2
        val targetX = if (currentX < midX) 20 else (screenWidth - view.width - 20)
        val side = if (targetX <= midX) "LEFT" else "RIGHT"

        val animator = ValueAnimator.ofInt(currentX, targetX).apply {
            duration = 200
            interpolator = DecelerateInterpolator()
            addUpdateListener { va ->
                params.x = va.animatedValue as Int
                try {
                    windowManager.updateViewLayout(view, params)
                } catch (e: Exception) {
                    // Ignore
                }
            }
        }
        animator.start()

        // Save position to DataStore
        scope.launch {
            preferencesManager.saveCharacterPosition(targetX, params.y, side)
        }
    }

    fun hideFloatingCharacter() {
        if (isCharacterAttached && floatingBinding != null) {
            try {
                windowManager.removeView(floatingBinding?.root)
            } catch (e: Exception) {
                Log.e(TAG, "Error removing floating view: ${e.message}")
            }
            floatingBinding = null
            isCharacterAttached = false
        }
    }

    // ==========================================
    // 2. MEAT GUIDE MODAL POPUP
    // ==========================================

    fun openMeatGuideDialog() {
        if (!Settings.canDrawOverlays(context)) return
        if (isDialogAttached) return

        updateScreenDimensions()
        val binding = DialogMeatGuideBinding.inflate(LayoutInflater.from(context))
        dialogBinding = binding

        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            getOverlayWindowType(),
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT
        )
        dialogLayoutParams = layoutParams

        setupDialogViews(binding)

        try {
            windowManager.addView(binding.root, layoutParams)
            isDialogAttached = true
            resetAutoCloseTimer()

            // Subtle 150ms fade-in animation
            binding.root.alpha = 0f
            binding.root.animate().alpha(1f).setDuration(160).start()
            Log.d(TAG, "Meat guide dialog opened")
        } catch (e: Exception) {
            Log.e(TAG, "Failed showing meat guide dialog: ${e.message}", e)
        }
    }

    private fun setupDialogViews(binding: DialogMeatGuideBinding) {
        // Close button
        binding.btnClose.setOnClickListener {
            closeMeatGuideDialog()
        }

        // Backdrop click to dismiss
        binding.dialogBackdrop.setOnClickListener {
            if (currentManifest.uiSettings.touchOutsideDismiss) {
                closeMeatGuideDialog()
            }
        }
        binding.cardDialogContainer.setOnClickListener {
            // Reset auto-close timer when interacting inside
            resetAutoCloseTimer()
        }

        // Back button
        binding.btnBack.setOnClickListener {
            showCategorySelector()
        }

        // Stage 1: Category Selector
        binding.cardCategoryPork.setOnClickListener {
            resetAutoCloseTimer()
            showPorkList()
        }

        binding.cardCategoryBeef.setOnClickListener {
            resetAutoCloseTimer()
            showBeefRibDetail()
        }

        // Setup Pork RecyclerView
        val adapter = PorkCutsAdapter(currentManifest.porkCategory.items) { porkItem ->
            resetAutoCloseTimer()
            showPorkDetail(porkItem)
        }
        binding.rvPorkCuts.layoutManager = GridLayoutManager(context, 3)
        binding.rvPorkCuts.adapter = adapter

        // Initial state is Category Selector
        showCategorySelector()
    }

    private fun showCategorySelector() {
        dialogBinding?.let { b ->
            b.tvDialogTitle.text = context.getString(R.string.dialog_title_guide)
            b.btnBack.visibility = View.GONE
            b.viewCategorySelector.visibility = View.VISIBLE
            b.viewPorkList.visibility = View.GONE
            b.viewMeatDetail.visibility = View.GONE

            b.tvPorkCategoryTitle.text = currentManifest.porkCategory.title
            b.tvPorkCategoryDesc.text = currentManifest.porkCategory.description
            b.tvBeefCategoryTitle.text = currentManifest.beefRibItem.name
            b.tvBeefCategoryDesc.text = currentManifest.beefRibItem.cutPosition
        }
    }

    private fun showPorkList() {
        dialogBinding?.let { b ->
            b.tvDialogTitle.text = currentManifest.porkCategory.title
            b.btnBack.visibility = View.VISIBLE
            b.viewCategorySelector.visibility = View.GONE
            b.viewPorkList.visibility = View.VISIBLE
            b.viewMeatDetail.visibility = View.GONE

            (b.rvPorkCuts.adapter as? PorkCutsAdapter)?.updateItems(currentManifest.porkCategory.items)
        }
    }

    private fun showPorkDetail(item: PorkItem) {
        dialogBinding?.let { b ->
            b.tvDialogTitle.text = item.name
            b.btnBack.visibility = View.VISIBLE
            b.viewCategorySelector.visibility = View.GONE
            b.viewPorkList.visibility = View.GONE
            b.viewMeatDetail.visibility = View.VISIBLE

            b.tvDetailMeatName.text = item.name
            b.tvDetailCutPosition.text = item.cutPosition
            b.tvDetailDescription.text = item.description
            b.tvDetailTaste.text = item.taste
            b.tvDetailTexture.text = item.texture
            b.tvDetailRecommendation.text = item.recommendation

            val diagramRes = when {
                item.name.contains("목살") || item.id.contains("neck") -> R.drawable.pig_diagram_neck
                item.name.contains("항정") || item.id.contains("hangjeong") -> R.drawable.pig_diagram_hangjeong
                item.name.contains("갈매기") || item.id.contains("galmaegi") -> R.drawable.pig_diagram_galmaegi
                item.name.contains("가브리") || item.id.contains("gabri") -> R.drawable.pig_diagram_gabri
                item.name.contains("삼겹") || item.id.contains("belly") -> R.drawable.pig_diagram_belly
                item.name.contains("송이") || item.id.contains("songi") -> R.drawable.pig_diagram_songi
                else -> R.drawable.pig_diagram_neck
            }
            b.ivDetailDiagram.setImageResource(diagramRes)
        }
    }

    private fun showBeefRibDetail() {
        val item = currentManifest.beefRibItem
        dialogBinding?.let { b ->
            b.tvDialogTitle.text = item.name
            b.btnBack.visibility = View.VISIBLE
            b.viewCategorySelector.visibility = View.GONE
            b.viewPorkList.visibility = View.GONE
            b.viewMeatDetail.visibility = View.VISIBLE

            b.tvDetailMeatName.text = item.name
            b.tvDetailCutPosition.text = item.cutPosition
            b.tvDetailDescription.text = item.description
            b.tvDetailTaste.text = item.taste
            b.tvDetailTexture.text = item.texture
            b.tvDetailRecommendation.text = item.recommendation
            b.ivDetailDiagram.setImageResource(R.drawable.cow_diagram_rib)
        }
    }

    private fun refreshDialogContent() {
        dialogBinding?.let { b ->
            b.tvPorkCategoryTitle.text = currentManifest.porkCategory.title
            b.tvPorkCategoryDesc.text = currentManifest.porkCategory.description
            (b.rvPorkCuts.adapter as? PorkCutsAdapter)?.updateItems(currentManifest.porkCategory.items)
        }
    }

    private fun resetAutoCloseTimer() {
        autoCloseTimer?.cancel()
        val timeoutSeconds = currentManifest.uiSettings.autoCloseSeconds.coerceAtLeast(10)
        autoCloseTimer = object : CountDownTimer(timeoutSeconds * 1000L, 1000L) {
            override fun onTick(millisUntilFinished: Long) {
                val secondsLeft = millisUntilFinished / 1000
                dialogBinding?.tvAutoCloseTimer?.text = "${secondsLeft}s"
            }

            override fun onFinish() {
                closeMeatGuideDialog()
            }
        }.start()
    }

    fun closeMeatGuideDialog() {
        autoCloseTimer?.cancel()
        autoCloseTimer = null

        if (isDialogAttached && dialogBinding != null) {
            dialogBinding?.root?.animate()
                ?.alpha(0f)
                ?.setDuration(150)
                ?.withEndAction {
                    try {
                        if (isDialogAttached && dialogBinding != null) {
                            windowManager.removeView(dialogBinding?.root)
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error removing dialog view: ${e.message}")
                    } finally {
                        dialogBinding = null
                        isDialogAttached = false
                    }
                }
                ?.start()
        }
    }

    // ==========================================
    // 3. KIOSK SERVER ERROR DIALOG
    // ==========================================

    fun showKioskErrorDialog(title: String? = null, message: String? = null) {
        if (!Settings.canDrawOverlays(context)) return
        if (isErrorDialogAttached) return

        mainHandler.post {
            val binding = DialogKioskErrorBinding.inflate(LayoutInflater.from(context))
            errorBinding = binding

            val layoutParams = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                getOverlayWindowType(),
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                        WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
                PixelFormat.TRANSLUCENT
            )

            binding.tvErrorTitle.text = title ?: currentManifest.restartGuide.title
            binding.tvErrorMessage.text = message ?: currentManifest.restartGuide.message

            binding.btnConfirmError.setOnClickListener {
                dismissKioskErrorDialog()
            }

            binding.btnOpenPowerMenu.setOnClickListener {
                dismissKioskErrorDialog()
                // Prompt user to long press tablet power button
                try {
                    val intent = Intent(Intent.ACTION_POWER_USAGE_SUMMARY).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    context.startActivity(intent)
                } catch (e: Exception) {
                    Log.w(TAG, "Could not launch power settings: ${e.message}")
                }
            }

            try {
                windowManager.addView(binding.root, layoutParams)
                isErrorDialogAttached = true
                Log.d(TAG, "Kiosk error dialog shown to staff")
            } catch (e: Exception) {
                Log.e(TAG, "Failed showing error dialog: ${e.message}", e)
            }
        }
    }

    fun dismissKioskErrorDialog() {
        if (isErrorDialogAttached && errorBinding != null) {
            try {
                windowManager.removeView(errorBinding?.root)
            } catch (e: Exception) {
                Log.e(TAG, "Error removing error dialog view: ${e.message}")
            } finally {
                errorBinding = null
                isErrorDialogAttached = false
            }
        }
    }

    fun releaseAll() {
        hideFloatingCharacter()
        closeMeatGuideDialog()
        dismissKioskErrorDialog()
    }
}
