package com.sankalai.appblocker

import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

/**
 * Manages blocking session data using SharedPreferences
 */
object BlockingSessionManager {
  private const val TAG = "BlockingSessionManager"
  private const val PREFS_NAME = "app_blocker_prefs"
  private const val KEY_SESSION_ID = "session_id"
  private const val KEY_BLOCKED_APPS = "blocked_apps"
  private const val KEY_START_TIME = "start_time"
  private const val KEY_DURATION = "duration"
  private const val KEY_IS_ACTIVE = "is_active"

  private val WHITELISTED_PACKAGES = setOf(
    "com.android.dialer",
    "com.google.android.dialer",
    "com.android.incallui",
    "com.android.contacts",
    "com.google.android.contacts",
    "com.android.messaging",
    "com.google.android.apps.messaging",
    "com.android.emergency",
    "com.google.android.apps.emergencyassist",
    "com.jennise.sankalai"
  )

  data class BlockingSession(
    val sessionId: String,
    val blockedApps: List<BlockedApp>,
    val startTime: Long,
    val duration: Int
  )

  data class BlockedApp(
    val packageName: String,
    val appName: String
  )

  private fun getPrefs(context: Context): SharedPreferences {
    return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
  }

  fun startSession(
    context: Context,
    sessionId: String,
    blockedApps: List<Map<String, String>>,
    startTime: Long,
    duration: Int
  ) {
    val prefs = getPrefs(context)
    val editor = prefs.edit()

    editor.putString(KEY_SESSION_ID, sessionId)
    editor.putLong(KEY_START_TIME, startTime)
    editor.putInt(KEY_DURATION, duration)
    editor.putBoolean(KEY_IS_ACTIVE, true)

    // Convert blocked apps to JSON
    val jsonArray = JSONArray()
    for (app in blockedApps) {
      val packageName = app["packageName"]?.trim().orEmpty()
      if (packageName.isBlank()) continue

      val jsonObject = JSONObject()
      jsonObject.put("packageName", packageName)
      jsonObject.put("appName", app["appName"]?.trim().takeUnless { it.isNullOrBlank() } ?: packageName)
      jsonArray.put(jsonObject)
    }
    editor.putString(KEY_BLOCKED_APPS, jsonArray.toString())

    editor.apply()

    Log.d(TAG, "Session started: $sessionId with ${jsonArray.length()} blocked apps")
  }

  fun stopSession(context: Context) {
    val prefs = getPrefs(context)
    val editor = prefs.edit()
    editor.putBoolean(KEY_IS_ACTIVE, false)
    editor.apply()

    Log.d(TAG, "Session stopped")
  }

  fun breakSession(context: Context) {
    // Notify React Native that session was broken
    // This would require event emitter setup
    stopSession(context)
    Log.d(TAG, "Session broken by user")
  }

  fun isSessionActive(context: Context): Boolean {
    val prefs = getPrefs(context)
    val isActive = prefs.getBoolean(KEY_IS_ACTIVE, false)
    
    if (!isActive) {
      return false
    }

    // Check if session has expired
    val startTime = prefs.getLong(KEY_START_TIME, 0)
    val duration = prefs.getInt(KEY_DURATION, 0)
    val endTime = startTime + (duration * 60 * 1000)
    val now = System.currentTimeMillis()

    if (now >= endTime) {
      // Session expired
      stopSession(context)
      return false
    }

    return true
  }

  fun isAppBlocked(context: Context, packageName: String): Boolean {
    if (isPackageWhitelisted(packageName)) {
      return false
    }

    if (!isSessionActive(context)) {
      return false
    }

    val prefs = getPrefs(context)
    val blockedAppsJson = prefs.getString(KEY_BLOCKED_APPS, "[]") ?: "[]"

    try {
      val jsonArray = JSONArray(blockedAppsJson)
      for (i in 0 until jsonArray.length()) {
        val jsonObject = jsonArray.getJSONObject(i)
        val blockedPackage = jsonObject.getString("packageName").trim()
        if (blockedPackage == packageName) {
          return true
        }
      }
    } catch (e: Exception) {
      Log.e(TAG, "Error checking if app is blocked", e)
    }

    return false
  }

  fun isPackageWhitelisted(packageName: String): Boolean {
    return WHITELISTED_PACKAGES.contains(packageName)
  }

  fun getAppName(context: Context, packageName: String): String {
    // First check if we have it in our blocked apps list
    val prefs = getPrefs(context)
    val blockedAppsJson = prefs.getString(KEY_BLOCKED_APPS, "[]") ?: "[]"

    try {
      val jsonArray = JSONArray(blockedAppsJson)
      for (i in 0 until jsonArray.length()) {
        val jsonObject = jsonArray.getJSONObject(i)
        val blockedPackage = jsonObject.getString("packageName")
        if (blockedPackage == packageName) {
          return jsonObject.getString("appName")
        }
      }
    } catch (e: Exception) {
      Log.e(TAG, "Error getting app name from blocked list", e)
    }

    // Fallback: Get from package manager
    return try {
      val pm = context.packageManager
      val appInfo = pm.getApplicationInfo(packageName, 0)
      pm.getApplicationLabel(appInfo).toString()
    } catch (e: Exception) {
      packageName
    }
  }

  fun getSession(context: Context): BlockingSession? {
    if (!isSessionActive(context)) {
      return null
    }

    val prefs = getPrefs(context)
    val sessionId = prefs.getString(KEY_SESSION_ID, null) ?: return null
    val startTime = prefs.getLong(KEY_START_TIME, 0)
    val duration = prefs.getInt(KEY_DURATION, 0)
    val blockedAppsJson = prefs.getString(KEY_BLOCKED_APPS, "[]") ?: "[]"

    val blockedApps = mutableListOf<BlockedApp>()
    try {
      val jsonArray = JSONArray(blockedAppsJson)
      for (i in 0 until jsonArray.length()) {
        val jsonObject = jsonArray.getJSONObject(i)
        blockedApps.add(
          BlockedApp(
            packageName = jsonObject.getString("packageName"),
            appName = jsonObject.getString("appName")
          )
        )
      }
    } catch (e: Exception) {
      Log.e(TAG, "Error parsing blocked apps", e)
    }

    return BlockingSession(
      sessionId = sessionId,
      blockedApps = blockedApps,
      startTime = startTime,
      duration = duration
    )
  }

  fun notifyAppBlocked(context: Context, packageName: String, appName: String) {
    // This would emit an event to React Native
    Log.d(TAG, "App blocked event: $appName ($packageName)")
  }
}
