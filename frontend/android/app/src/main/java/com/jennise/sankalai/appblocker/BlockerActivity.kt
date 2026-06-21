package com.jennise.sankalai.appblocker

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import com.jennise.sankalai.MainActivity
import com.jennise.sankalai.R

class BlockerActivity : Activity() {

    private var packageName: String? = null
    private var appName: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Make activity full screen and show over lock screen
        window.apply {
            addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED)
            addFlags(WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD)
            addFlags(WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
        }
        
        setContentView(R.layout.activity_blocker)
        
        // Get intent extras
        packageName = intent.getStringExtra("packageName")
        appName = intent.getStringExtra("appName") ?: packageName
        
        setupUI()
    }

    private fun setupUI() {
        findViewById<TextView>(R.id.blocked_app_name)?.text = appName
        findViewById<TextView>(R.id.blocked_message)?.text = 
            "This app is blocked during your focus session.\n\nStay focused! You can do this! 💪"
        
        findViewById<Button>(R.id.btn_go_back)?.setOnClickListener {
            returnToSankalai()
        }
        
        findViewById<Button>(R.id.btn_end_session)?.setOnClickListener {
            returnToSankalai(showEndSessionDialog = true)
        }
    }

    private fun returnToSankalai(showEndSessionDialog: Boolean = false) {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
            if (showEndSessionDialog) {
                putExtra("showEndSessionDialog", true)
            }
        }
        startActivity(intent)
        finish()
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // Only allow back button
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            returnToSankalai()
            return true
        }
        
        // Block home button and other navigation
        if (keyCode == KeyEvent.KEYCODE_HOME || 
            keyCode == KeyEvent.KEYCODE_APP_SWITCH ||
            keyCode == KeyEvent.KEYCODE_MENU) {
            return true // Block these keys
        }
        
        return super.onKeyDown(keyCode, event)
    }

    override fun onBackPressed() {
        returnToSankalai()
    }
}
