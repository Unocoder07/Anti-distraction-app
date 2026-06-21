package com.sankalai.appblocker

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
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

  @Suppress("DEPRECATION")
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Modern way to show on lock screen and keep screen on
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
      val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
      keyguardManager.requestDismissKeyguard(this, null)
    } else {
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
      )
    }
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

    setContentView(R.layout.activity_blocker)
    bindBlockerContent(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    bindBlockerContent(intent)
  }

  private fun bindBlockerContent(intent: Intent) {
    val appName = intent.getStringExtra("appName") ?: "Unknown App"

    // Get session info
    val session = BlockingSessionManager.getSession(this)
    val timeRemaining = if (session != null) {
      val elapsed = System.currentTimeMillis() - session.startTime
      val totalDuration = session.duration * 60 * 1000
      val remaining = (totalDuration - elapsed).coerceAtLeast(0)
      ((remaining + 59_999) / 60_000).toInt()
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

  }

  private fun showBreakWarning() {
    // For simplicity in a native Activity without complex dialog builders, 
    // we'll just handle the logic directly or use a simple AlertDialog
    val builder = android.app.AlertDialog.Builder(this)
    builder.setTitle("⚠️ Warning")
    builder.setTitle("Warning")
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

  override fun onPause() {
    super.onPause()
    if (BlockingSessionManager.isSessionActive(this)) {
      val blockedPackage = intent.getStringExtra("packageName") ?: "blocked"
      val blockedAppName = intent.getStringExtra("appName") ?: "Blocked App"
      handler.postDelayed({
        if (!isFinishing && BlockingSessionManager.isSessionActive(this)) {
          val relaunch = Intent(this, BlockerActivity::class.java)
          relaunch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
          relaunch.putExtra("packageName", blockedPackage)
          relaunch.putExtra("appName", blockedAppName)
          startActivity(relaunch)
        }
      }, 200)
    }
  }

  @Suppress("DEPRECATION")
  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (!hasFocus && BlockingSessionManager.isSessionActive(this)) {
        // User is trying to pull down notification shade or use recents
        // We can't easily block that without being a device owner, 
        // but we can close the system dialogs
        val closeIntent = Intent(Intent.ACTION_CLOSE_SYSTEM_DIALOGS)
        sendBroadcast(closeIntent)
    }
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
