package com.jennise.sankalai.appblocker

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Base64
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.ByteArrayOutputStream

class AppBlockerModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private val context: ReactApplicationContext = reactContext

    override fun getName(): String {
        return "AppBlocker"
    }

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        try {
            val hasPermission =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    Settings.canDrawOverlays(context)
                } else {
                    true
                }

            promise.resolve(hasPermission)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(context)) {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:${context.packageName}")
                    )
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(intent)
                    promise.resolve(false)
                } else {
                    promise.resolve(true)
                }
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        try {
            promise.resolve(
                FocusProtectionService.isServiceEnabled(context)
            )
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestAccessibilityService(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun hasUsageStatsPermission(promise: Promise) {
        try {
            val appOps =
                context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager

            val mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                context.packageName
            )

            promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestUsageStatsPermission(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun startBlockingSession(sessionData: ReadableMap, promise: Promise) {
        try {
            val sessionId = sessionData.getString("sessionId") ?: ""

            if (sessionId.isEmpty()) {
                promise.reject("ERROR", "Session ID is required")
                return
            }

            val blockedAppsArray = sessionData.getArray("blockedApps")
            val startTime = sessionData.getDouble("startTime").toLong()
            val duration = sessionData.getInt("duration")

            val blockedApps = mutableListOf<BlockedApp>()

            if (blockedAppsArray != null) {
                for (i in 0 until blockedAppsArray.size()) {
                    val appMap = blockedAppsArray.getMap(i)

                    if (appMap != null) {
                        val packageName =
                            appMap.getString("packageName") ?: ""
                        val appName =
                            appMap.getString("appName") ?: ""
                        val sessionStartedAt =
                            if (appMap.hasKey("sessionStartedAt") && !appMap.isNull("sessionStartedAt")) {
                                appMap.getDouble("sessionStartedAt").toLong()
                            } else {
                                startTime
                            }
                        val sessionEndsAt =
                            if (appMap.hasKey("sessionEndsAt") && !appMap.isNull("sessionEndsAt")) {
                                appMap.getDouble("sessionEndsAt").toLong()
                            } else {
                                startTime + duration * 60_000L
                            }
                        val sessionDuration =
                            if (appMap.hasKey("sessionDuration") && !appMap.isNull("sessionDuration")) {
                                appMap.getInt("sessionDuration")
                            } else {
                                duration
                            }

                        if (packageName.isNotEmpty()) {
                            blockedApps.add(
                                BlockedApp(
                                    packageName = packageName,
                                    appName = appName,
                                    sessionStartedAt = sessionStartedAt,
                                    sessionEndsAt = sessionEndsAt,
                                    sessionDuration = sessionDuration
                                )
                            )
                        }
                    }
                }
            }

            BlockingSessionManager.startSession(
                context = context,
                sessionId = sessionId,
                blockedApps = blockedApps,
                startTime = startTime,
                duration = duration
            )

            sendEventToJS(
                "BlockingSessionStarted",
                Arguments.createMap().apply {
                    putString("sessionId", sessionId)
                    putInt("blockedAppsCount", blockedApps.size)
                }
            )

            promise.resolve(true)

        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopBlockingSession(promise: Promise) {
        try {
            BlockingSessionManager.stopSession(context)

            sendEventToJS(
                "BlockingSessionStopped",
                Arguments.createMap()
            )

            promise.resolve(true)

        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun isBlockingSessionActive(promise: Promise) {
        try {
            promise.resolve(
                BlockingSessionManager.isSessionActive(context)
            )
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun pauseMonitoring(promise: Promise) {
        try {
            BlockingSessionManager.pauseMonitoring(context)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun resumeMonitoring(promise: Promise) {
        try {
            BlockingSessionManager.resumeMonitoring(context)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val packageManager = context.packageManager
            val packages =
                packageManager.getInstalledApplications(0)

            val installedApps = WritableNativeArray()

            for (packageInfo in packages) {
                val isSystem =
                    packageInfo.flags and
                    android.content.pm.ApplicationInfo.FLAG_SYSTEM != 0
                val isUpdatedSystem =
                    packageInfo.flags and
                    android.content.pm.ApplicationInfo.FLAG_UPDATED_SYSTEM_APP != 0
                val hasLauncher =
                    packageManager.getLaunchIntentForPackage(packageInfo.packageName) != null

                // Skip pure system/background packages (no launcher icon), but keep
                // user-facing apps even when pre-installed as system apps — many phones
                // ship Facebook, Instagram, etc. as system apps and they must still appear.
                if (!hasLauncher) {
                    continue
                }

                val appMap = Arguments.createMap().apply {
                    putString("packageName", packageInfo.packageName)
                    putString(
                        "name",
                        packageManager.getApplicationLabel(packageInfo).toString()
                    )
                    putString(
                        "icon",
                        drawableToDataUri(
                            packageManager.getApplicationIcon(packageInfo)
                        )
                    )
                    putBoolean("isSystemApp", isSystem || isUpdatedSystem)
                }

                installedApps.pushMap(appMap)
            }

            promise.resolve(installedApps)

        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    private fun sendEventToJS(
        eventName: String,
        params: WritableMap
    ) {
        if (context.hasActiveCatalystInstance()) {
            context
                .getJSModule(
                    DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
                )
                .emit(eventName, params)
        }
    }

    private fun drawableToDataUri(drawable: Drawable): String? {
        return try {
            val size = 96
            val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            drawable.setBounds(0, 0, canvas.width, canvas.height)
            drawable.draw(canvas)

            val output = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)

            "data:image/png;base64," + Base64.encodeToString(
                output.toByteArray(),
                Base64.NO_WRAP
            )
        } catch (e: Exception) {
            null
        }
    }

    companion object {
        fun sendAppBlockedEvent(
            context: ReactApplicationContext,
            packageName: String,
            appName: String
        ) {
            if (!context.hasActiveCatalystInstance()) return

            val params = Arguments.createMap().apply {
                putString("packageName", packageName)
                putString("appName", appName)
                putDouble(
                    "timestamp",
                    System.currentTimeMillis().toDouble()
                )
            }

            context
                .getJSModule(
                    DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
                )
                .emit("AppBlocked", params)
        }
    }
}

data class BlockedApp(
    val packageName: String,
    val appName: String,
    val sessionStartedAt: Long = 0L,
    val sessionEndsAt: Long = 0L,
    val sessionDuration: Int = 0
)
