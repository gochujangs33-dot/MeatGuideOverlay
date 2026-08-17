package com.antigravity.meatguideoverlay.ui.view

import android.content.Context
import android.graphics.Matrix
import android.graphics.PointF
import android.graphics.RectF
import android.util.AttributeSet
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.ScaleGestureDetector
import android.view.ViewConfiguration
import androidx.appcompat.widget.AppCompatImageView
import kotlin.math.abs
import kotlin.math.sqrt

/**
 * High-performance, touch-conflict-free Zoomable ImageView for MeatGuideOverlay.
 *
 * Features:
 * - 1.0x to 5.0x Pinch-to-zoom (ScaleGestureDetector)
 * - Panning when zoomed in with strict boundary constraints
 * - Single-finger stationary tap detection to trigger close callback
 * - ZERO touch conflict: Multi-finger gestures, zoom in/out, or panning drags
 *   are NEVER misinterpreted as a close tap.
 */
class ZoomableTouchImageView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : AppCompatImageView(context, attrs, defStyleAttr) {

    companion object {
        private const val MIN_SCALE = 1.0f
        private const val MAX_SCALE = 5.0f
    }

    private val imageMatrix = Matrix()
    private val matrixValues = FloatArray(9)

    private var currentScale = 1.0f
    private var isMultiTouchDetected = false
    private var hasMovedSignificantly = false

    private val touchSlop: Float = ViewConfiguration.get(context).scaledTouchSlop.toFloat()
    private val startTouchPoint = PointF()
    private val lastTouchPoint = PointF()

    private var onSingleTapListener: (() -> Unit)? = null

    private val scaleDetector: ScaleGestureDetector
    private val gestureDetector: GestureDetector

    init {
        scaleType = ScaleType.MATRIX
        imageMatrix.reset()
        setImageMatrix(imageMatrix)

        scaleDetector = ScaleGestureDetector(context, object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
            override fun onScale(detector: ScaleGestureDetector): Boolean {
                isMultiTouchDetected = true
                hasMovedSignificantly = true

                val scaleFactor = detector.scaleFactor
                val targetScale = currentScale * scaleFactor
                val clampedScaleFactor = when {
                    targetScale < MIN_SCALE -> MIN_SCALE / currentScale
                    targetScale > MAX_SCALE -> MAX_SCALE / currentScale
                    else -> scaleFactor
                }

                currentScale *= clampedScaleFactor
                imageMatrix.postScale(clampedScaleFactor, clampedScaleFactor, detector.focusX, detector.focusY)
                checkMatrixBounds()
                setImageMatrix(imageMatrix)
                return true
            }
        })

        gestureDetector = GestureDetector(context, object : GestureDetector.SimpleOnGestureListener() {
            override fun onSingleTapConfirmed(e: MotionEvent): Boolean {
                if (!isMultiTouchDetected && !hasMovedSignificantly) {
                    onSingleTapListener?.invoke()
                    return true
                }
                return false
            }
        })
    }

    fun setOnSingleTapListener(listener: () -> Unit) {
        this.onSingleTapListener = listener
    }

    fun resetScaleAndPosition() {
        currentScale = 1.0f
        isMultiTouchDetected = false
        hasMovedSignificantly = false
        imageMatrix.reset()
        fitCenterImage()
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        fitCenterImage()
    }

    fun fitCenterImage() {
        val d = drawable ?: return
        val viewWidth = width.toFloat()
        val viewHeight = height.toFloat()
        if (viewWidth <= 0 || viewHeight <= 0) return

        val drawableWidth = d.intrinsicWidth.toFloat()
        val drawableHeight = d.intrinsicHeight.toFloat()
        if (drawableWidth <= 0 || drawableHeight <= 0) return

        imageMatrix.reset()

        val scaleX = viewWidth / drawableWidth
        val scaleY = viewHeight / drawableHeight
        val scale = scaleX.coerceAtMost(scaleY)

        val dx = (viewWidth - drawableWidth * scale) / 2f
        val dy = (viewHeight - drawableHeight * scale) / 2f

        imageMatrix.postScale(scale, scale)
        imageMatrix.postTranslate(dx, dy)

        currentScale = 1.0f
        setImageMatrix(imageMatrix)
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        scaleDetector.onTouchEvent(event)
        gestureDetector.onTouchEvent(event)

        if (event.pointerCount > 1) {
            isMultiTouchDetected = true
            hasMovedSignificantly = true
        }

        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                isMultiTouchDetected = false
                hasMovedSignificantly = false
                startTouchPoint.set(event.x, event.y)
                lastTouchPoint.set(event.x, event.y)
            }

            MotionEvent.ACTION_MOVE -> {
                val dx = event.x - lastTouchPoint.x
                val dy = event.y - lastTouchPoint.y

                val totalMoveDistance = sqrt(
                    (event.x - startTouchPoint.x) * (event.x - startTouchPoint.x) +
                            (event.y - startTouchPoint.y) * (event.y - startTouchPoint.y)
                )

                if (totalMoveDistance > touchSlop) {
                    hasMovedSignificantly = true
                }

                // If scaled in, allow 1-finger panning
                if (currentScale > MIN_SCALE && event.pointerCount == 1 && !isMultiTouchDetected) {
                    imageMatrix.postTranslate(dx, dy)
                    checkMatrixBounds()
                    setImageMatrix(imageMatrix)
                }

                lastTouchPoint.set(event.x, event.y)
            }

            MotionEvent.ACTION_UP -> {
                val totalDist = sqrt(
                    (event.x - startTouchPoint.x) * (event.x - startTouchPoint.x) +
                            (event.y - startTouchPoint.y) * (event.y - startTouchPoint.y)
                )

                if (!isMultiTouchDetected && !hasMovedSignificantly && totalDist <= touchSlop) {
                    onSingleTapListener?.invoke()
                }

                // If zoomed out past minimum, smoothly animate back or clamp
                if (currentScale <= MIN_SCALE) {
                    fitCenterImage()
                }
            }

            MotionEvent.ACTION_CANCEL -> {
                isMultiTouchDetected = false
                hasMovedSignificantly = false
            }
        }

        return true
    }

    private fun checkMatrixBounds() {
        val d = drawable ?: return
        val viewWidth = width.toFloat()
        val viewHeight = height.toFloat()
        if (viewWidth <= 0 || viewHeight <= 0) return

        val rect = RectF(0f, 0f, d.intrinsicWidth.toFloat(), d.intrinsicHeight.toFloat())
        imageMatrix.mapRect(rect)

        var deltaX = 0f
        var deltaY = 0f

        if (rect.width() <= viewWidth) {
            deltaX = (viewWidth - rect.width()) / 2f - rect.left
        } else {
            if (rect.left > 0) {
                deltaX = -rect.left
            } else if (rect.right < viewWidth) {
                deltaX = viewWidth - rect.right
            }
        }

        if (rect.height() <= viewHeight) {
            deltaY = (viewHeight - rect.height()) / 2f - rect.top
        } else {
            if (rect.top > 0) {
                deltaY = -rect.top
            } else if (rect.bottom < viewHeight) {
                deltaY = viewHeight - rect.bottom
            }
        }

        imageMatrix.postTranslate(deltaX, deltaY)
    }
}
