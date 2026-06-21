/**
 * Safe Mode Manager
 * Handles automatic pausing of monitoring when sensitive apps are opened
 */

import { Platform } from 'react-native';
import { shieldSessionManager } from './shieldSessionManager';

// Sensitive apps that trigger Safe Mode
const SENSITIVE_APPS = new Set([
  // Payment Apps
  'net.one97.paytm',
  'com.phonepe.app',
  'com.google.android.apps.nbu.paisa.user',
  'in.amazon.mShop.android.shopping',
  'com.enstage.wibmo.hdfc',
  'in.org.npci.upiapp',
  
  // Banking Apps
  'com.snapwork.hdfc',
  'com.sbi.upi',
  'com.icicibank.pockets',
  'com.axis.mobile',
  'com.kotakbank.mobile',
  'com.indusind.mobile',
  'com.yesbank',
  
  // Investment Apps
  'com.zerodha.kite3',
  'in.groww.growwapp',
  'com.msf.kbank.mobile',
  'com.angelbroking.trading',
  
  // International
  'com.paypal.android.p2pmobile',
  'com.venmo',
  'com.squareup.cash',
]);

class SafeModeManager {
  private inSafeMode: boolean = false;
  private currentSensitiveApp: string | null = null;

  /**
   * Check if an app is sensitive (banking/payment)
   */
  isSensitiveApp(packageName: string): boolean {
    return SENSITIVE_APPS.has(packageName);
  }

  /**
   * Enter safe mode
   */
  async enterSafeMode(packageName: string, appName: string): Promise<void> {
    if (this.inSafeMode && this.currentSensitiveApp === packageName) {
      return; // Already in safe mode for this app
    }

    console.log(`[SafeMode] Entering safe mode for ${appName}`);
    
    this.inSafeMode = true;
    this.currentSensitiveApp = packageName;
    
    // Log to session
    await shieldSessionManager.enterSafeMode(appName);
    
    // Stop native monitoring if on Android
    if (Platform.OS === 'android') {
      try {
        const { nativeBlockingService } = require('./nativeBlockingService');
        nativeBlockingService.pauseMonitoring();
      } catch (e) {
        console.warn('[SafeMode] Could not pause native monitoring:', e);
      }
    }
  }

  /**
   * Exit safe mode
   */
  async exitSafeMode(): Promise<void> {
    if (!this.inSafeMode) {
      return; // Not in safe mode
    }

    console.log(`[SafeMode] Exiting safe mode`);
    
    this.inSafeMode = false;
    this.currentSensitiveApp = null;
    
    // Log to session
    await shieldSessionManager.exitSafeMode();
    
    // Resume native monitoring if on Android
    if (Platform.OS === 'android') {
      try {
        const { nativeBlockingService } = require('./nativeBlockingService');
        nativeBlockingService.resumeMonitoring();
      } catch (e) {
        console.warn('[SafeMode] Could not resume native monitoring:', e);
      }
    }
  }

  /**
   * Check if currently in safe mode
   */
  isInSafeMode(): boolean {
    return this.inSafeMode;
  }

  /**
   * Get current sensitive app
   */
  getCurrentSensitiveApp(): string | null {
    return this.currentSensitiveApp;
  }

  /**
   * Handle foreground app change
   */
  async handleAppChange(packageName: string, appName: string): Promise<void> {
    const isSensitive = this.isSensitiveApp(packageName);
    
    if (isSensitive && !this.inSafeMode) {
      // Entering sensitive app
      await this.enterSafeMode(packageName, appName);
    } else if (!isSensitive && this.inSafeMode) {
      // Leaving sensitive app
      await this.exitSafeMode();
    }
  }

  /**
   * Get all sensitive app package names
   */
  getSensitiveApps(): string[] {
    return Array.from(SENSITIVE_APPS);
  }

  /**
   * Add custom sensitive app
   */
  addSensitiveApp(packageName: string): void {
    SENSITIVE_APPS.add(packageName);
  }

  /**
   * Remove custom sensitive app
   */
  removeSensitiveApp(packageName: string): void {
    SENSITIVE_APPS.delete(packageName);
  }
}

export const safeModeManager = new SafeModeManager();
