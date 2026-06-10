package com.sankalai.appblocker

import android.app.ActivityManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.text.TextUtils
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AppBlockerModule : Module() {
  private val context
    get() = requireNotNull(appContext.reactContext)

  override fun definition() = ModuleDefinition {
    Name("AppBlocker")

    Events("onAppBlocked")

    // Check if overlay permission is granted
    Function("hasOverlayPermission") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        Settings.canDrawOverlays(context)
      } else {
        true
      }
    }

    // Request overlay permission
    Function("requestOverlayPermission") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val intent = Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:${context.packageName}")
        )
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }

    // Check if accessibility service is enabled
    Function("isAccessibilityServiceEnabled") {
      isAccessibilityServiceEnabled(context)
    }

    // Request accessibility service
    Function("requestAccessibilityService") {
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    // Check if usage stats permission is granted
    Function("hasUsageStatsPermission") {
      hasUsageStatsPermission(context)
    }

    // Request usage stats permission
    Function("requestUsageStatsPermission") {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    // Start blocking session
    Function("startBlockingSession") { sessionId: String, blockedApps: List<Map<String, String>>, startTime: Long, duration: Int ->
      BlockingSessionManager.startSession(
        context,
        sessionId,
        blockedApps,
        startTime,
        duration
      )
    }

    // Stop blocking session
    Function("stopBlockingSession") {
      BlockingSessionManager.stopSession(context)
    }

    // Check if blocking session is active
    Function("isBlockingSessionActive") {
      BlockingSessionManager.isSessionActive(context)
    }

    // Get foreground app
    Function("getForegroundApp") {
      getForegroundAppPackageName(context)
    }

    // Get all installed apps (distracting ones)
    Function("getInstalledApps") {
      getInstalledAppsList(context)
    }
  }

  private fun getInstalledAppsList(context: Context): List<Map<String, Any>> {
    val pm = context.packageManager
    val apps = pm.getInstalledApplications(android.content.pm.PackageManager.GET_META_DATA)
    val result = mutableListOf<Map<String, Any>>()

    for (app in apps) {
      // Only include non-system apps or common system apps like YouTube
      val isSystemApp = (app.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0
      val packageName = app.packageName

      // We only care about distracting apps
      if (!isSystemApp || packageName == "com.google.android.youtube" || packageName == "com.android.chrome") {
        val map = mutableMapOf<String, Any>()
        map["name"] = pm.getApplicationLabel(app).toString()
        map["packageName"] = packageName
        map["isSystemApp"] = isSystemApp
        result.add(map)
      }
    }
    return result
  }

  private fun isAccessibilityServiceEnabled(context: Context): Boolean {
    val expectedComponentName = "${context.packageName}/${AppBlockerService::class.java.canonicalName}"
    val enabledServices = Settings.Secure.getString(
      context.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
    )
    return enabledServices?.contains(expectedComponentName) ?: false
  }

  private fun hasUsageStatsPermission(context: Context): Boolean {
    val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
      ?: return false

    val time = System.currentTimeMillis()
    val stats = usageStatsManager.queryUsageStats(
      UsageStatsManager.INTERVAL_DAILY,
      time - 1000 * 60,
      time
    )

    return stats != null && stats.isNotEmpty()
  }

  private fun getForegroundAppPackageName(context: Context): String? {
    if (!hasUsageStatsPermission(context)) {
      return null
    }

    val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
      ?: return null

    val time = System.currentTimeMillis()
    val stats = usageStatsManager.queryUsageStats(
      UsageStatsManager.INTERVAL_DAILY,
      time - 1000 * 10, // Last 10 seconds
      time
    )

    if (stats.isNullOrEmpty()) {
      return null
    }

    // Get the app with the most recent timestamp
    val sortedStats = stats.sortedByDescending { it.lastTimeUsed }
    return sortedStats.firstOrNull()?.packageName
  }
}
