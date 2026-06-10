/**
 * Native App Blocker Bridge
 * Simple bridge to native Kotlin module
 */
import { NativeModules, Platform } from 'react-native';

const { AppBlockerModule } = NativeModules;

export interface BlockedAppNative {
  packageName: string;
  appName: string;
}

export const nativeAppBlocker = {
  /**
   * Check if overlay permission is granted
   */
  async hasOverlayPermission(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return false;
    try {
      return await AppBlockerModule.hasOverlayPermission();
    } catch (error) {
      console.error('Error checking overlay permission:', error);
      return false;
    }
  },

  /**
   * Request overlay permission
   */
  async requestOverlayPermission(): Promise<void> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return;
    try {
      await AppBlockerModule.requestOverlayPermission();
    } catch (error) {
      console.error('Error requesting overlay permission:', error);
    }
  },

  /**
   * Check if accessibility service is enabled
   */
  async isAccessibilityServiceEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return false;
    try {
      return await AppBlockerModule.isAccessibilityServiceEnabled();
    } catch (error) {
      console.error('Error checking accessibility service:', error);
      return false;
    }
  },

  /**
   * Request accessibility service
   */
  async requestAccessibilityService(): Promise<void> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return;
    try {
      await AppBlockerModule.requestAccessibilityService();
    } catch (error) {
      console.error('Error requesting accessibility service:', error);
    }
  },

  /**
   * Check if usage stats permission is granted
   */
  async hasUsageStatsPermission(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return false;
    try {
      return await AppBlockerModule.hasUsageStatsPermission();
    } catch (error) {
      console.error('Error checking usage stats permission:', error);
      return false;
    }
  },

  /**
   * Request usage stats permission
   */
  async requestUsageStatsPermission(): Promise<void> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return;
    try {
      await AppBlockerModule.requestUsageStatsPermission();
    } catch (error) {
      console.error('Error requesting usage stats permission:', error);
    }
  },

  /**
   * Start blocking session
   */
  async startBlockingSession(
    sessionId: string,
    blockedApps: BlockedAppNative[],
    startTime: number,
    duration: number
  ): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return false;
    try {
      return await AppBlockerModule.startBlockingSession(sessionId, blockedApps, startTime, duration);
    } catch (error) {
      console.error('Error starting blocking session:', error);
      return false;
    }
  },

  /**
   * Get installed apps using our native module
   */
  async getInstalledApps(): Promise<any[]> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return [];
    try {
      return await AppBlockerModule.getInstalledApps();
    } catch (error) {
      console.error('Error getting installed apps from native module:', error);
      return [];
    }
  }
};
      await AppBlockerModule.startBlockingSession(
        sessionId,
        blockedApps,
        startTime,
        duration
      );
      console.log('✅ Native blocking session started');
      return true;
    } catch (error) {
      console.error('Error starting blocking session:', error);
      return false;
    }
  },

  /**
   * Stop blocking session
   */
  async stopBlockingSession(): Promise<void> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return;
    try {
      await AppBlockerModule.stopBlockingSession();
      console.log('✅ Native blocking session stopped');
    } catch (error) {
      console.error('Error stopping blocking session:', error);
    }
  },

  /**
   * Check if blocking session is active
   */
  async isBlockingSessionActive(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return false;
    try {
      return await AppBlockerModule.isBlockingSessionActive();
    } catch (error) {
      console.error('Error checking blocking session:', error);
      return false;
    }
  },

  /**
   * Check all permissions
   */
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

  /**
   * Check if module is available
   */
  isAvailable(): boolean {
    return Platform.OS === 'android' && !!AppBlockerModule;
  },
};
