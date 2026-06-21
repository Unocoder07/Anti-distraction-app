package com.sankalai.appblocker

import android.app.ActivityManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.ComponentName
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
    val result = mutableListOf<Map<String, Any>>()
    val seen = mutableSetOf<String>()

    // Primary: check each known distracting package (works on Android 11+ with manifest queries)
    for (packageName in KNOWN_DISTRACTING_PACKAGES) {
      if (seen.contains(packageName)) continue

      val launchIntent = pm.getLaunchIntentForPackage(packageName) ?: continue

      try {
        val appInfo = pm.getApplicationInfo(packageName, android.content.pm.PackageManager.GET_META_DATA)
        val isSystemApp = (appInfo.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0
        result.add(
          mapOf(
            "name" to pm.getApplicationLabel(appInfo).toString(),
            "packageName" to packageName,
            "isSystemApp" to isSystemApp
          )
        )
        seen.add(packageName)
      } catch (e: android.content.pm.PackageManager.NameNotFoundException) {
        // Not installed
      }
    }

    // Fallback: full scan when QUERY_ALL_PACKAGES permission is granted
    if (result.isEmpty()) {
      try {
        val apps = pm.getInstalledApplications(android.content.pm.PackageManager.GET_META_DATA)
        for (app in apps) {
          val packageName = app.packageName
          if (seen.contains(packageName)) continue

          val isSystemApp = (app.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0
          if (isSystemApp && !SYSTEM_APP_EXCEPTIONS.contains(packageName)) continue
          if (!isLikelyDistractingApp(packageName)) continue

          result.add(
            mapOf(
              "name" to pm.getApplicationLabel(app).toString(),
              "packageName" to packageName,
              "isSystemApp" to isSystemApp
            )
          )
          seen.add(packageName)
        }
      } catch (e: Exception) {
        android.util.Log.e("AppBlockerModule", "Fallback app scan failed", e)
      }
    }

    android.util.Log.d("AppBlockerModule", "Detected ${result.size} installed distracting apps")
    return result
  }

  private fun isLikelyDistractingApp(packageName: String): Boolean {
    val lower = packageName.lowercase()
    val hints = listOf(
      "instagram", "facebook", "snapchat", "tiktok", "twitter", "reddit",
      "youtube", "netflix", "hotstar", "primevideo", "game", "pubg",
      "freefire", "clash", "roblox", "minecraft", "discord", "telegram"
    )
    return hints.any { lower.contains(it) }
  }

  companion object {
    private val SYSTEM_APP_EXCEPTIONS = setOf(
      "com.google.android.youtube",
      "com.android.chrome"
    )

    private val KNOWN_DISTRACTING_PACKAGES = listOf(
      // Social Media
      "com.instagram.android",
      "com.facebook.katana",
      "com.facebook.lite",
      "com.snapchat.android",
      "com.zhiliaoapp.musically",
      "com.ss.android.ugc.trill",
      "com.twitter.android",
      "com.reddit.frontpage",
      "com.pinterest",
      "com.linkedin.android",
      "com.instagram.barcelona",
      // Video
      "com.google.android.youtube",
      "com.netflix.mediaclient",
      "com.amazon.avod.thirdpartyclient",
      "in.startv.hotstar",
      "com.google.android.apps.youtube.music",
      // Messaging (often distracting)
      "com.whatsapp",
      "org.telegram.messenger",
      "com.discord",
      // Gaming
      "com.tencent.ig",
      "com.dts.freefireth",
      "com.dts.freefiremax",
      "com.activision.callofduty.shooter",
      "com.supercell.clashofclans",
      "com.supercell.clashroyale",
      "com.king.candycrushsaga",
      "com.innersloth.spacemafia",
      "com.mojang.minecraftpe",
      "com.garena.game.codm",
      "com.ea.gp.fifamobile",
      "com.roblox.client",
      "com.pubg.imobile",
      "com.ludo.king",
      "com.kiloo.subwaysurf"
    )
  }

  private fun isAccessibilityServiceEnabled(context: Context): Boolean {
    val expectedComponentName = ComponentName(context, AppBlockerService::class.java)
    val expectedFullName = expectedComponentName.flattenToString()
    val expectedShortName = expectedComponentName.flattenToShortString()
    val enabledServices = Settings.Secure.getString(
      context.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
    )
    if (enabledServices.isNullOrBlank()) {
      return false
    }

    val splitter = TextUtils.SimpleStringSplitter(':')
    splitter.setString(enabledServices)
    for (service in splitter) {
      if (TextUtils.equals(service, expectedFullName) || TextUtils.equals(service, expectedShortName)) {
        return true
      }
    }

    return false
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
