package com.sankalai.appblocker

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView

/**
 * Full-screen blocking activity shown when user tries to open a blocked app
 */
class BlockerActivity : Activity() {

  companion object {
    private const val TAG = "BlockerActivity"
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Make it full screen and show on lock screen
    window.addFlags(
      WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
      WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
      WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
    )

    setContentView(R.layout.activity_blocker)

    val packageName = intent.getStringExtra("packageName") ?: "Unknown"
    val appName = intent.getStringExtra("appName") ?: "Unknown App"

    // Get session info
    val session = BlockingSessionManager.getSession(this)
    val timeRemaining = if (session != null) {
      val elapsed = System.currentTimeMillis() - session.startTime
      val totalDuration = session.duration * 60 * 1000
      val remaining = totalDuration - elapsed
      (remaining / 1000 / 60).toInt()
    } else {
      0
    }

    // Set up UI
    findViewById<TextView>(R.id.blockedAppName)?.text = appName
    findViewById<TextView>(R.id.timeRemaining)?.text = "$timeRemaining minutes remaining"
    findViewById<TextView>(R.id.blockedMessage)?.text = 
      "This app is blocked during your focus session.\n\n" +
      "Breaking the session will cost you 50 Focus Points."

    // Return to focus button
    findViewById<Button>(R.id.returnToFocusButton)?.setOnClickListener {
      returnToMainApp()
    }

    // Break session button
    findViewById<Button>(R.id.breakSessionButton)?.setOnClickListener {
      showBreakWarning()
    }

    // Auto-return to home after 3 seconds if not interacted
    // Removing auto-return to home for stronger blocking
    /*
    Handler(Looper.getMainLooper()).postDelayed({
      if (!isFinishing) {
        returnToHome()
      }
    }, 3000)
    */
  }

  private fun showBreakWarning() {
    // For simplicity in a native Activity without complex dialog builders, 
    // we'll just handle the logic directly or use a simple AlertDialog
    val builder = android.app.AlertDialog.Builder(this)
    builder.setTitle("⚠️ Warning")
    builder.setMessage("If you unblock now, you will lose 50 focus coins. Are you sure?")
    builder.setPositiveButton("Yes, Break Session") { _, _ ->
      breakSession()
    }
    builder.setNegativeButton("Cancel") { dialog, _ ->
      dialog.dismiss()
    }
    builder.show()
  }

  private fun returnToMainApp() {
    // Return to our app
    val launchIntent = packageManager.getLaunchIntentForPackage(application.packageName)
    if (launchIntent != null) {
      launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      startActivity(launchIntent)
    }
    finish()
  }

  private fun returnToHome() {
    // Go to home screen
    val homeIntent = Intent(Intent.ACTION_MAIN)
    homeIntent.addCategory(Intent.CATEGORY_HOME)
    homeIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
    startActivity(homeIntent)
    finish()
  }

  private fun breakSession() {
    // Notify that session was broken
    BlockingSessionManager.breakSession(this)
    returnToMainApp()
  }

  override fun onBackPressed() {
    // Prevent back button from closing the blocker
    returnToHome()
  }
}
