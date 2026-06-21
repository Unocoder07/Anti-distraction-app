/**
 * Native App Blocker Bridge
 * Uses the Expo app-blocker module (registered as "AppBlocker" in Kotlin)
 */
import * as AppBlocker from 'app-blocker';
import { Platform } from 'react-native';

export interface InstalledAppNative {
  packageName: string;
  name: string;
  isSystemApp: boolean;
}

export interface BlockedAppNative {
  packageName: string;
  appName: string;
}

function isModuleAvailable(): boolean {
  if (Platform.OS !== 'android') return false;
  try {
    return typeof AppBlocker.getInstalledApps === 'function';
  } catch {
    return false;
  }
}

export const nativeAppBlocker = {
  async hasOverlayPermission(): Promise<boolean> {
    if (!isModuleAvailable()) return false;
    try {
      return AppBlocker.hasOverlayPermission();
    } catch (error) {
      console.error('Error checking overlay permission:', error);
      return false;
    }
  },

  async requestOverlayPermission(): Promise<void> {
    if (!isModuleAvailable()) return;
    try {
      AppBlocker.requestOverlayPermission();
    } catch (error) {
      console.error('Error requesting overlay permission:', error);
    }
  },

  async isAccessibilityServiceEnabled(): Promise<boolean> {
    if (!isModuleAvailable()) return false;
    try {
      return AppBlocker.isAccessibilityServiceEnabled();
    } catch (error) {
      console.error('Error checking accessibility service:', error);
      return false;
    }
  },

  async requestAccessibilityService(): Promise<void> {
    if (!isModuleAvailable()) return;
    try {
      AppBlocker.requestAccessibilityService();
    } catch (error) {
      console.error('Error requesting accessibility service:', error);
    }
  },

  async hasUsageStatsPermission(): Promise<boolean> {
    if (!isModuleAvailable()) return false;
    try {
      return AppBlocker.hasUsageStatsPermission();
    } catch (error) {
      console.error('Error checking usage stats permission:', error);
      return false;
    }
  },

  async requestUsageStatsPermission(): Promise<void> {
    if (!isModuleAvailable()) return;
    try {
      AppBlocker.requestUsageStatsPermission();
    } catch (error) {
      console.error('Error requesting usage stats permission:', error);
    }
  },

  async startBlockingSession(
    sessionId: string,
    blockedApps: BlockedAppNative[],
    startTime: number,
    duration: number
  ): Promise<boolean> {
    if (!isModuleAvailable()) return false;
    try {
      AppBlocker.startBlockingSession({
        sessionId,
        blockedApps,
        startTime,
        duration,
      });
      return true;
    } catch (error) {
      console.error('Error starting blocking session:', error);
      return false;
    }
  },

  async getInstalledApps(): Promise<InstalledAppNative[]> {
    if (!isModuleAvailable()) {
      console.warn('AppBlocker native module not available — use: npx expo run:android');
      return [];
    }
    try {
      const apps = AppBlocker.getInstalledApps();
      console.log(`📱 Native module returned ${apps?.length ?? 0} installed apps`);
      return apps ?? [];
    } catch (error) {
      console.error('Error getting installed apps from native module:', error);
      return [];
    }
  },

  async stopBlockingSession(): Promise<void> {
    if (!isModuleAvailable()) return;
    try {
      AppBlocker.stopBlockingSession();
    } catch (error) {
      console.error('Error stopping blocking session:', error);
    }
  },

  async isBlockingSessionActive(): Promise<boolean> {
    if (!isModuleAvailable()) return false;
    try {
      return AppBlocker.isBlockingSessionActive();
    } catch (error) {
      console.error('Error checking blocking session:', error);
      return false;
    }
  },

  async checkAllPermissions(): Promise<{
    overlay: boolean;
    accessibility: boolean;
    usageStats: boolean;
  }> {
    const [overlay, accessibility, usageStats] = await Promise.all([
      this.hasOverlayPermission(),
      this.isAccessibilityServiceEnabled(),
      this.hasUsageStatsPermission(),
    ]);
    return { overlay, accessibility, usageStats };
  },

  isAvailable(): boolean {
    return isModuleAvailable();
  },
};
