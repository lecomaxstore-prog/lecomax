package com.lecomax.learning

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.app.KeyguardManager
import android.graphics.Path
import android.os.Build
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import org.json.JSONObject

class PhoneRemoteInput : AccessibilityService() {
    companion object { @Volatile var instance: PhoneRemoteInput? = null }
    override fun onServiceConnected() { instance = this }
    override fun onDestroy() { instance = null; super.onDestroy() }
    override fun onInterrupt() {}
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
    fun control(m: JSONObject) {
        if (!PhoneRemoteService.controlling || PhoneRemoteService.viewOnly || getSystemService(KeyguardManager::class.java).isKeyguardLocked) return
        when (m.optString("action")) {
            "back" -> performGlobalAction(GLOBAL_ACTION_BACK)
            "home" -> performGlobalAction(GLOBAL_ACTION_HOME)
            "recents" -> performGlobalAction(GLOBAL_ACTION_RECENTS)
            "gesture" -> {
                val points = listOf("x", "y", "toX", "toY").map { m.optDouble(it, Double.NaN) }
                if (points.any { !it.isFinite() || it < 0 || it > 1 }) return
                val duration = m.optLong("duration", 0)
                if (duration !in 40L..1500L) return
                val wm = getSystemService(WindowManager::class.java)
                val width: Int; val height: Int
                if (Build.VERSION.SDK_INT >= 30) { val bounds = wm.maximumWindowMetrics.bounds; width = bounds.width(); height = bounds.height() }
                else { val metrics = android.util.DisplayMetrics(); @Suppress("DEPRECATION") wm.defaultDisplay.getRealMetrics(metrics); width = metrics.widthPixels; height = metrics.heightPixels }
                // Reject a gesture made on a frame from before the host rotated.
                val frameWidth = m.optInt("frameWidth", 0)
                val frameHeight = m.optInt("frameHeight", 0)
                if (frameWidth > 0 && frameHeight > 0 && kotlin.math.abs(frameWidth.toDouble() / frameHeight - width.toDouble() / height) > 0.02) return
                val path = Path().apply {
                    moveTo((points[0] * (width - 1)).toFloat(), (points[1] * (height - 1)).toFloat())
                    lineTo((points[2] * (width - 1)).toFloat(), (points[3] * (height - 1)).toFloat())
                }
                dispatchGesture(GestureDescription.Builder().addStroke(GestureDescription.StrokeDescription(path, 0, duration)).build(), null, null)
            }
        }
    }
}
