package com.jennise.sankalai.appblocker

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

object BlockingSessionManager {
    
    private const val PREFS_NAME = "blocking_session_prefs"
    private const val KEY_SESSION_ID = "session_id"
    private const val KEY_BLOCKED_APPS = "blocked_apps"
    private const val KEY_START_TIME = "start_time"
    private const val KEY_DURATION = "duration"
    private const val KEY_IS_ACTIVE = "is_active"
    private const val KEY_IS_PAUSED = "is_paused"
    
    private val gson = Gson()
    
    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }
    
    fun startSession(
        context: Context,
        sessionId: String,
        blockedApps: List<BlockedApp>,
        startTime: Long,
        duration: Int
    ) {
        val prefs = getPrefs(context)
        val blockedAppsJson = gson.toJson(blockedApps)
        
        prefs.edit().apply {
            putString(KEY_SESSION_ID, sessionId)
            putString(KEY_BLOCKED_APPS, blockedAppsJson)
            putLong(KEY_START_TIME, startTime)
            putInt(KEY_DURATION, duration)
            putBoolean(KEY_IS_ACTIVE, true)
            putBoolean(KEY_IS_PAUSED, false)
            apply()
        }
    }
    
    fun stopSession(context: Context) {
        getPrefs(context).edit().apply {
            clear()
            apply()
        }
    }
    
    fun isSessionActive(context: Context): Boolean {
        return getPrefs(context).getBoolean(KEY_IS_ACTIVE, false)
    }
    
    fun isPaused(context: Context): Boolean {
        return getPrefs(context).getBoolean(KEY_IS_PAUSED, false)
    }
    
    fun pauseMonitoring(context: Context) {
        getPrefs(context).edit().apply {
            putBoolean(KEY_IS_PAUSED, true)
            apply()
        }
    }
    
    fun resumeMonitoring(context: Context) {
        getPrefs(context).edit().apply {
            putBoolean(KEY_IS_PAUSED, false)
            apply()
        }
    }
    
    fun getBlockedApps(context: Context): List<BlockedApp> {
        val prefs = getPrefs(context)
        val blockedAppsJson = prefs.getString(KEY_BLOCKED_APPS, null) ?: return emptyList()
        
        return try {
            val type = object : TypeToken<List<BlockedApp>>() {}.type
            gson.fromJson(blockedAppsJson, type)
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    fun isAppBlocked(context: Context, packageName: String): Boolean {
        if (!isSessionActive(context) || isPaused(context)) {
            return false
        }
        
        return getBlockedApps(context).any { it.packageName == packageName }
    }
    
    fun getAppName(context: Context, packageName: String): String? {
        return getBlockedApps(context).find { it.packageName == packageName }?.appName
    }
}
