package com.jennise.sankalai.appblocker

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import com.jennise.sankalai.MainActivity
import com.jennise.sankalai.R

class BlockerActivity : Activity() {

    private var blockedPackage: String? = null
    private var appName: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Show over lock screen and keep active
        window.apply {
            addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED)
            addFlags(WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD)
            addFlags(WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
            addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }

        setContentView(R.layout.activity_blocker)

        // Get blocked app details
        blockedPackage = intent.getStringExtra("packageName")
        appName = intent.getStringExtra("appName") ?: blockedPackage

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
            returnToSankalai(true)
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
        return when (keyCode) {
            KeyEvent.KEYCODE_BACK -> {
                returnToSankalai()
                true
            }

            // Block app switch and menu buttons
            KeyEvent.KEYCODE_APP_SWITCH,
            KeyEvent.KEYCODE_MENU -> true

            else -> super.onKeyDown(keyCode, event)
        }
    }

    override fun onBackPressed() {
        returnToSankalai()
    }
}