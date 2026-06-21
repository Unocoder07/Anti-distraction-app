package com.sankalai.appblocker

import android.accessibilityservice.AccessibilityService
import android.app.usage.UsageStatsManager
import android.app.usage.UsageEvents
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent

/**
 * Accessibility service that monitors foreground app changes and shows the
 * blocking screen when the user opens a blocked app.
 */
class AppBlockerService : AccessibilityService() {

  companion object {
    private const val TAG = "AppBlockerService"
    private const val BLOCK_DEBOUNCE_MS = 700L
    private const val ACTIVE_WATCHDOG_MS = 350L
    private const val IDLE_WATCHDOG_MS = 1_000L
    private const val SHOW_BLOCKER_DELAY_MS = 80L
  }

  private val handler = Handler(Looper.getMainLooper())
  private var lastBlockedPackage: String? = null
  private var lastBlockedAt = 0L
  private var watchdogStarted = false

  private val foregroundWatchdog = object : Runnable {
    override fun run() {
      val isActive = BlockingSessionManager.isSessionActive(this@AppBlockerService)
      if (isActive) {
        getForegroundAppPackageName()
          ?.takeIf { shouldBlockPackage(it) }
          ?.let { blockPackage(it, "watchdog") }
      } else {
        lastBlockedPackage = null
      }

      handler.postDelayed(this, if (isActive) ACTIVE_WATCHDOG_MS else IDLE_WATCHDOG_MS)
    }
  }

  override fun onServiceConnected() {
    super.onServiceConnected()
    Log.d(TAG, "AppBlocker Service Connected")
    startForegroundWatchdog()
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) return

    if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
        event.eventType != AccessibilityEvent.TYPE_WINDOWS_CHANGED &&
        event.eventType != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) {
      return
    }

    if (!BlockingSessionManager.isSessionActive(this)) {
      return
    }

    val packageName = getCandidatePackages(event).firstOrNull { shouldBlockPackage(it) } ?: return

    blockPackage(packageName, "accessibility")
  }

  private fun startForegroundWatchdog() {
    if (watchdogStarted) return
    watchdogStarted = true
    handler.post(foregroundWatchdog)
  }

  private fun blockPackage(packageName: String, source: String) {
    val now = System.currentTimeMillis()
    if (packageName == lastBlockedPackage && now - lastBlockedAt < BLOCK_DEBOUNCE_MS) {
      return
    }
    lastBlockedPackage = packageName
    lastBlockedAt = now

    Log.d(TAG, "Blocked app detected from $source: $packageName")

    val appName = BlockingSessionManager.getAppName(this, packageName)

    performGlobalAction(GLOBAL_ACTION_HOME)

    handler.postDelayed({
      if (BlockingSessionManager.isSessionActive(this@AppBlockerService)) {
        showBlockerOverlay(packageName, appName)
        BlockingSessionManager.notifyAppBlocked(this@AppBlockerService, packageName, appName)
      }
    }, SHOW_BLOCKER_DELAY_MS)
  }

  private fun getCandidatePackages(event: AccessibilityEvent): List<String> {
    val candidates = linkedSetOf<String>()

    event.packageName?.toString()?.takeIf { it.isNotBlank() }?.let { candidates.add(it) }
    rootInActiveWindow?.packageName?.toString()?.takeIf { it.isNotBlank() }?.let { candidates.add(it) }
    getForegroundAppPackageName()?.takeIf { it.isNotBlank() }?.let { candidates.add(it) }

    return candidates.toList()
  }

  private fun shouldBlockPackage(packageName: String): Boolean {
    if (packageName == application.packageName ||
        packageName == "com.android.systemui" ||
        packageName == "com.android.settings" ||
        packageName == "com.google.android.packageinstaller" ||
        packageName == "android") {
      return false
    }

    if (BlockingSessionManager.isPackageWhitelisted(packageName)) {
      return false
    }

    return BlockingSessionManager.isAppBlocked(this, packageName)
  }

  private fun getForegroundAppPackageName(): String? {
    val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
      ?: return null
    val now = System.currentTimeMillis()

    try {
      val usageEvents = usageStatsManager.queryEvents(now - 5_000, now)
      val event = UsageEvents.Event()
      var latestPackage: String? = null
      var latestTimestamp = 0L

      while (usageEvents.hasNextEvent()) {
        usageEvents.getNextEvent(event)
        val isForegroundEvent =
          event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND ||
          (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
            event.eventType == UsageEvents.Event.ACTIVITY_RESUMED)

        if (isForegroundEvent &&
            event.timeStamp >= latestTimestamp &&
            event.packageName != application.packageName) {
          latestPackage = event.packageName
          latestTimestamp = event.timeStamp
        }
      }

      if (!latestPackage.isNullOrBlank()) {
        return latestPackage
      }
    } catch (e: Exception) {
      Log.w(TAG, "UsageEvents foreground lookup failed", e)
    }

    val stats = usageStatsManager.queryUsageStats(
      UsageStatsManager.INTERVAL_DAILY,
      now - 10_000,
      now
    )

    return stats
      ?.filter { it.packageName != application.packageName }
      ?.maxByOrNull { it.lastTimeUsed }
      ?.packageName
  }

  private fun showBlockerOverlay(packageName: String, appName: String) {
    try {
      val intent = Intent(this, BlockerActivity::class.java)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
      intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
      intent.addFlags(Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS)
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
    handler.removeCallbacksAndMessages(null)
    watchdogStarted = false
    Log.d(TAG, "AppBlocker Service Destroyed")
  }
}
