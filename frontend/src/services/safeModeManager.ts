/**
 * Safe Mode Manager
 * Handles automatic pausing of monitoring when sensitive apps are opened
 */

import { Platform } from 'react-native';
import { shieldSessionManager } from './shieldSessionManager';
import { nativeBlockingService } from './nativeBlockingService';

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

  async refreshSensitiveAppsWhitelist(): Promise<string[]> {
    if (Platform.OS !== 'android') {
      return this.getSensitiveApps();
    }

    try {
      const packages = await nativeBlockingService.scanSensitiveAppsWhitelist();
      packages.forEach((packageName) => SENSITIVE_APPS.add(packageName));
      return this.getSensitiveApps();
    } catch (error) {
      console.warn('[SafeMode] Could not refresh sensitive app whitelist:', error);
      return this.getSensitiveApps();
    }
  }

  /**
   * Enter safe mode
   */
  async enterSafeMode(packageName: string, appName: string): Promise<void> {
    if (this.inSafeMode && this.currentSensitiveApp === packageName) {
      return; // Already in safe mode for this app
    }

    console.log(`[SafeMode] Temporarily bypassing enforcement for ${appName}`);
    
    this.inSafeMode = true;
    this.currentSensitiveApp = packageName;
    
    // Log to session
    await shieldSessionManager.enterSafeMode(appName);
  }

  /**
   * Exit safe mode
   */
  async exitSafeMode(options: { resumeNative?: boolean } = {}): Promise<void> {
    if (!this.inSafeMode) {
      return; // Not in safe mode
    }

    console.log(`[SafeMode] Resuming enforcement after sensitive app`);
    
    this.inSafeMode = false;
    this.currentSensitiveApp = null;
    
    // Log to session
    await shieldSessionManager.exitSafeMode();
    
    if (Platform.OS === 'android' && options.resumeNative !== false) {
      await nativeBlockingService.resumeMonitoring();
    }
  }

  clearSafeModeState(): void {
    this.inSafeMode = false;
    this.currentSensitiveApp = null;
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
    const isSensitive = this.isSensitiveApp(packageName) ||
      await nativeBlockingService.isSensitiveApp(packageName);
    
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
