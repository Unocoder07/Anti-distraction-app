/**
 * Native App Blocker Bridge
 * Uses the in-app Android native module registered as "AppBlocker".
 */
import { Platform } from "react-native";
import { appBlockerNative as AppBlocker } from "./appBlockerNative";

export interface InstalledAppNative {
  packageName: string;
  name: string;
  isSystemApp: boolean;
  category?: string;
  totalTimeMs?: number;
  openCount?: number;
  lastAnalyzedAt?: number;
}

export interface BlockedAppNative {
  packageName: string;
  appName: string;
}

function isModuleAvailable(): boolean {
  if (Platform.OS !== "android") return false;
  try {
    return AppBlocker.isAvailable();
  } catch {
    return false;
  }
}

export const nativeAppBlocker = {
  async hasOverlayPermission(): Promise<boolean> {
    return true;
  },

  async requestOverlayPermission(): Promise<void> {
    return;
  },

  async isAccessibilityServiceEnabled(): Promise<boolean> {
    if (!isModuleAvailable()) return false;
    try {
      return AppBlocker.isAccessibilityServiceEnabled();
    } catch (error) {
      console.error("Error checking accessibility service:", error);
      return false;
    }
  },

  async requestAccessibilityService(): Promise<void> {
    if (!isModuleAvailable()) return;
    try {
      AppBlocker.requestAccessibilityService();
    } catch (error) {
      console.error("Error requesting accessibility service:", error);
    }
  },

  async hasUsageStatsPermission(): Promise<boolean> {
    if (!isModuleAvailable()) return false;
    try {
      return AppBlocker.hasUsageStatsPermission();
    } catch (error) {
      console.error("Error checking usage stats permission:", error);
      return false;
    }
  },

  async requestUsageStatsPermission(): Promise<void> {
    if (!isModuleAvailable()) return;
    try {
      AppBlocker.requestUsageStatsPermission();
    } catch (error) {
      console.error("Error requesting usage stats permission:", error);
    }
  },

  async startPassiveMonitoring(): Promise<boolean> {
    if (!isModuleAvailable()) return false;
    try {
      return AppBlocker.startPassiveMonitoring();
    } catch (error) {
      console.error("Error starting passive monitoring:", error);
      return false;
    }
  },

  async stopPassiveMonitoring(): Promise<boolean> {
    if (!isModuleAvailable()) return true;
    try {
      return AppBlocker.stopPassiveMonitoring();
    } catch (error) {
      console.error("Error stopping passive monitoring:", error);
      return false;
    }
  },

  async getUsageStatsRecommendations(): Promise<InstalledAppNative[]> {
    if (!isModuleAvailable()) return [];
    try {
      return await AppBlocker.getUsageStatsRecommendations();
    } catch (error) {
      console.error("Error getting usage recommendations:", error);
      return [];
    }
  },

  async startBlockingSession(
    sessionId: string,
    blockedApps: BlockedAppNative[],
    startTime: number,
    duration: number,
  ): Promise<boolean> {
    if (!isModuleAvailable()) return false;
    try {
      return AppBlocker.startBlockingSession({
        sessionId,
        blockedApps,
        startTime,
        duration,
      });
    } catch (error) {
      console.error("Error starting blocking session:", error);
      return false;
    }
  },

  async getInstalledApps(): Promise<InstalledAppNative[]> {
    if (!isModuleAvailable()) {
      console.warn(
        "AppBlocker native module not available — use: npx expo run:android",
      );
      return [];
    }
    try {
      const apps = await AppBlocker.getInstalledApps();
      console.log(
        `📱 Native module returned ${apps?.length ?? 0} installed apps`,
      );
      return apps ?? [];
    } catch (error) {
      console.error("Error getting installed apps from native module:", error);
      return [];
    }
  },

  async stopBlockingSession(): Promise<void> {
    if (!isModuleAvailable()) return;
    try {
      AppBlocker.stopBlockingSession();
    } catch (error) {
      console.error("Error stopping blocking session:", error);
    }
  },

  async isBlockingSessionActive(): Promise<boolean> {
    if (!isModuleAvailable()) return false;
    try {
      return AppBlocker.isBlockingSessionActive();
    } catch (error) {
      console.error("Error checking blocking session:", error);
      return false;
    }
  },

  async checkAllPermissions(): Promise<{
    overlay: boolean;
    accessibility: boolean;
    usageStats: boolean;
  }> {
    const [accessibility, usageStats] = await Promise.all([
      this.isAccessibilityServiceEnabled(),
      this.hasUsageStatsPermission(),
    ]);
    return { overlay: true, accessibility, usageStats };
  },

  isAvailable(): boolean {
    return isModuleAvailable();
  },
};
