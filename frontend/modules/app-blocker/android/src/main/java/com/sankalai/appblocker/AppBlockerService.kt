package com.sankalai.appblocker

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent

/**
 * Accessibility Service that monitors foreground app changes
 * and shows blocking overlay when user tries to open a blocked app
 */
class AppBlockerService : AccessibilityService() {

  companion object {
    private const val TAG = "AppBlockerService"
  }

  override fun onServiceConnected() {
    super.onServiceConnected()
    Log.d(TAG, "AppBlocker Service Connected")
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) return

    // Only monitor window state changes (app switches)
    if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
      return
    }

    val packageName = event.packageName?.toString() ?: return

    // Ignore our own package and system UI components that should always be accessible
    if (packageName == application.packageName || 
        packageName == "com.android.systemui" || 
        packageName == "com.android.settings" ||
        packageName == "com.google.android.packageinstaller") {
      return
    }

    // Check if there's an active blocking session
    if (!BlockingSessionManager.isSessionActive(this)) {
      return
    }

    // Check if this package is blocked
    if (BlockingSessionManager.isAppBlocked(this, packageName)) {
      Log.d(TAG, "Blocked app detected: $packageName")
      
      // Get app name
      val appName = BlockingSessionManager.getAppName(this, packageName)
      
      // Show blocker overlay
      showBlockerOverlay(packageName, appName)
      
      // Send event to React Native
      BlockingSessionManager.notifyAppBlocked(this, packageName, appName)
    }
  }

  private fun showBlockerOverlay(packageName: String, appName: String) {
    try {
      val intent = Intent(this, BlockerActivity::class.java)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
      intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
      intent.addFlags(Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS) // Hide from recent apps
      intent.putExtra("packageName", packageName)
      intent.putExtra("appName", appName)
      startActivity(intent)
    } catch (e: Exception) {
      Log.e(TAG, "Error showing blocker overlay", e)
    }
  }

  override fun onInterrupt() {
    Log.d(TAG, "AppBlocker Service Interrupted")
  }

  override fun onDestroy() {
    super.onDestroy()
    Log.d(TAG, "AppBlocker Service Destroyed")
  }
}
