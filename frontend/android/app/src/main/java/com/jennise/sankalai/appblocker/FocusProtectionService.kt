package com.jennise.sankalai.appblocker

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.os.Handler
import android.os.Looper
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.ReactApplicationContext

class FocusProtectionService : AccessibilityService() {

    companion object {
        private const val TAG = "FocusProtectionService"

        fun isServiceEnabled(context: Context): Boolean {
            val expectedComponentName =
                "${context.packageName}/${FocusProtectionService::class.java.name}"

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
            eventTypes =
                AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
                AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED or
                AccessibilityEvent.TYPE_WINDOWS_CHANGED

            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC

            flags =
                AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS or
                AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS

            notificationTimeout = 100
        }

        serviceInfo = info
        Log.d(TAG, "Focus Protection Service Connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        // Listen for app switches and content updates
        if (
            event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
            event.eventType != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED &&
            event.eventType != AccessibilityEvent.TYPE_WINDOWS_CHANGED
        ) {
            return
        }

        val packageName = event.packageName?.toString() ?: return

        // Ignore our own app and launcher only
        if (
            packageName == this.packageName ||
            packageName == "com.android.systemui" ||
            packageName.contains("launcher")
        ) {
            currentPackageName = packageName
            return
        }

        currentPackageName = packageName

        // Check if app is blocked
        if (BlockingSessionManager.isAppBlocked(this, packageName)) {
            handleBlockedApp(packageName)
        }
    }

    private fun handleBlockedApp(packageName: String) {
        val currentTime = System.currentTimeMillis()

        val shouldShowBlocker =
            packageName != lastBlockedPackage ||
            (currentTime - lastBlockedTime) >= 1000

        val appName =
            BlockingSessionManager.getAppName(this, packageName) ?: packageName

        Log.d(TAG, "Blocking app: $appName ($packageName)")

        // Immediately exit blocked app
        performGlobalAction(GLOBAL_ACTION_HOME)

        // Always force Home for blocked apps. Only throttle the warning screen,
        // never the actual block action.
        if (!shouldShowBlocker) {
            return
        }

        lastBlockedPackage = packageName
        lastBlockedTime = currentTime

        // Small delay before opening blocker screen
        Handler(Looper.getMainLooper()).postDelayed({
            if (!BlockingSessionManager.isAppBlocked(this, packageName)) {
                return@postDelayed
            }

            val intent = Intent(this, BlockerActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
                putExtra("packageName", packageName)
                putExtra("appName", appName)
            }
            startActivity(intent)
        }, 150)

        // Send event to React Native
        try {
            val reactContext =
                (application as? ReactApplication)
                    ?.reactNativeHost
                    ?.reactInstanceManager
                    ?.currentReactContext as? ReactApplicationContext

            reactContext?.let {
                AppBlockerModule.sendAppBlockedEvent(it, packageName, appName)
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
