package com.womensafety.ai

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.KeyEvent
import android.view.accessibility.AccessibilityEvent

/**
 * SOSAccessibilityService
 *
 * This service runs in the background at all times (once the user enables it
 * once in Settings > Accessibility), even when the app is closed or the phone
 * is locked. It listens for hardware volume key presses system-wide.
 *
 * Logic: 3 volume key presses (up or down) within a 2 second window trigger SOS.
 * Each press gives a short vibration for feedback; the 3rd press gives a longer
 * distinct pattern and starts SOSForegroundService.
 */
class SOSAccessibilityService : AccessibilityService() {

    private var pressCount = 0
    private var firstPressTime = 0L
    private val windowMs = 2000L

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Not used for key detection, required override for AccessibilityService
    }

    override fun onInterrupt() {
        // Required override, no-op
    }

    override fun onKeyEvent(event: KeyEvent?): Boolean {
        if (event == null) return super.onKeyEvent(event)

        val isVolumeKey = event.keyCode == KeyEvent.KEYCODE_VOLUME_UP ||
                event.keyCode == KeyEvent.KEYCODE_VOLUME_DOWN

        if (isVolumeKey && event.action == KeyEvent.ACTION_DOWN) {
            val now = System.currentTimeMillis()

            if (pressCount == 0 || now - firstPressTime > windowMs) {
                // Start a fresh counting window
                pressCount = 1
                firstPressTime = now
            } else {
                pressCount++
            }

            if (pressCount < 3) {
                shortVibrate()
            } else {
                longVibrate()
                pressCount = 0
                triggerSOS()
            }

            // Returning false lets the volume action (raise/lower volume) still
            // happen normally, so the user doesn't lose normal volume control.
            return false
        }

        return super.onKeyEvent(event)
    }

    private fun shortVibrate() {
        val vibrator = getSystemService(VIBRATOR_SERVICE) as? Vibrator ?: return
        vibrator.vibrate(VibrationEffect.createOneShot(100, VibrationEffect.DEFAULT_AMPLITUDE))
    }

    private fun longVibrate() {
        val vibrator = getSystemService(VIBRATOR_SERVICE) as? Vibrator ?: return
        val pattern = longArrayOf(0, 200, 100, 200, 100, 400)
        vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
    }

    private fun triggerSOS() {
        val intent = Intent(this, SOSForegroundService::class.java)
        intent.action = SOSForegroundService.ACTION_TRIGGER_SOS
        startForegroundService(intent)
    }
}
