package com.jennise.sankalai.appblocker

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.ReactApplicationContext

class FocusProtectionService : AccessibilityService() {

    companion object {
        private const val TAG = "FocusProtectionService"
        
        fun isServiceEnabled(context: Context): Boolean {
            val expectedComponentName = "${context.packageName}/${FocusProtectionService::class.java.name}"
            val enabledServicesSetting = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return false
            
            val colonSplitter = TextUtils.SimpleStringSplitter(':')
            colonSplitter.setString(enabledServicesSetting)
            
            while (colonSplitter.hasNext()) {
                val componentName = colonSplitter.next()
                if (componentName.equals(expectedComponentName, ignoreCase = true)) {
                    return true
                }
            }
            return false
        }
    }

    private var currentPackageName: String? = null
    private var lastBlockedPackage: String? = null
    private var lastBlockedTime: Long = 0

    override fun onServiceConnected() {
        super.onServiceConnected()
        
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
            notificationTimeout = 100
        }
        
        serviceInfo = info
        Log.d(TAG, "Focus Protection Service Connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            return
        }

        // Get the package name of the foreground app
        val packageName = event.packageName?.toString() ?: return
        
        // Ignore our own app
        if (packageName == this.packageName) {
            return
        }
        
        // Ignore system UI and launcher
        if (packageName.startsWith("com.android.") || 
            packageName.startsWith("com.google.android.") ||
            packageName.contains("launcher")) {
            return
        }
        
        // Check if app is currently blocked
        if (BlockingSessionManager.isAppBlocked(this, packageName)) {
            handleBlockedApp(packageName)
        }
        
        currentPackageName = packageName
    }

    private fun handleBlockedApp(packageName: String) {
        val currentTime = System.currentTimeMillis()
        
        // Debounce: Don't show blocker again if same app was just blocked within 2 seconds
        if (packageName == lastBlockedPackage && (currentTime - lastBlockedTime) < 2000) {
            return
        }
        
        lastBlockedPackage = packageName
        lastBlockedTime = currentTime
        
        val appName = BlockingSessionManager.getAppName(this, packageName) ?: packageName
        
        Log.d(TAG, "Blocking app: $appName ($packageName)")
        
        // Launch blocker activity
        val intent = Intent(this, BlockerActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
            putExtra("packageName", packageName)
            putExtra("appName", appName)
        }
        startActivity(intent)
        
        // Send event to React Native
        try {
            val reactContext = (application as? ReactApplication)
                ?.reactNativeHost
                ?.reactInstanceManager
                ?.currentReactContext as? ReactApplicationContext
            
            if (reactContext != null) {
                AppBlockerModule.sendAppBlockedEvent(reactContext, packageName, appName)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send event to React Native", e)
        }
    }

    override fun onInterrupt() {
        Log.d(TAG, "Service interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "Service destroyed")
    }
}
