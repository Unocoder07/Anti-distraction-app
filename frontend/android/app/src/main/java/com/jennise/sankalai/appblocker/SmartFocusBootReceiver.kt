package com.jennise.sankalai.appblocker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class SmartFocusBootReceiver : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "SmartFocusBootReceiver"
    }
    
    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d(TAG, "Device booted, checking for active sessions...")
            
            context?.let {
                // Check if there's an active session
                if (BlockingSessionManager.isSessionActive(it)) {
                    Log.d(TAG, "Active session found after boot")
                    // Session will be automatically enforced by AccessibilityService
                    // if it's enabled
                } else {
                    Log.d(TAG, "No active session found")
                }
            }
        }
    }
}
