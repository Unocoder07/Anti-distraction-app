/**
 * Native App Blocking Service
 * Shield uses Usage Access for passive recommendations.
 * Focus Protection uses Accessibility only during active study sessions.
 */
import { Alert, PermissionsAndroid, Platform } from "react-native";
import { appBlockerNative as AppBlocker } from "./appBlockerNative";

export interface NativeBlockingSession {
  sessionId: string;
  blockedApps: {
    packageName: string;
    appName: string;
  }[];
  startTime: number;
  duration: number;
}

type SessionLike = {
  id: string;
  startTime: Date | string | number;
  duration: number;
};

export type NativeProtectionPermissions = {
  overlay: boolean;
  accessibility: boolean;
  usageStats: boolean;
  notification: boolean;
};

export type NativeUsageRecommendation = {
  packageName: string;
  name: string;
  isSystemApp: boolean;
  category?: string;
  totalTimeMs?: number;
  openCount?: number;
  lastAnalyzedAt?: number;
};

class NativeBlockingService {
  private appBlockedListener: any = null;

  async checkPermissions(): Promise<NativeProtectionPermissions> {
    if (Platform.OS !== "android") {
      return { overlay: true, accessibility: false, usageStats: false };
    }

    try {
      return {
        overlay: true,
        accessibility: AppBlocker.isAccessibilityServiceEnabled(),
        usageStats: AppBlocker.hasUsageStatsPermission(),
      };
    } catch (error) {
      console.error("Error checking permissions:", error);
      return { overlay: true, accessibility: false, usageStats: false };
    }
  }

  isShieldModeEnabled(): boolean {
    if (Platform.OS !== "android") return false;

    try {
      return AppBlocker.isShieldModeEnabled();
    } catch (error) {
      console.error("Error checking Shield Mode:", error);
      return false;
    }
  }

  setShieldModeEnabled(enabled: boolean): boolean {
    if (Platform.OS !== "android") return enabled;

    try {
      return AppBlocker.setShieldModeEnabled(enabled);
    } catch (error) {
      console.error("Error setting Shield Mode:", error);
      return false;
    }
  }

  async requestPassiveMonitoringPermission(): Promise<boolean> {
    if (Platform.OS !== "android") {
      Alert.alert(
        "Not Available",
        "Shield monitoring is only available on Android devices.",
      );
      return false;
    }

    const permissions = await this.checkPermissions();
    if (permissions.usageStats) return true;
    return this.requestUsageStatsPermission();
  }

  async requestPermissions(): Promise<boolean> {
    return this.requestFocusProtectionPermissions();
  }

  async requestFocusProtectionPermissions(): Promise<boolean> {
    if (Platform.OS !== "android") {
      Alert.alert(
        "Not Available",
        "Focus Protection is only available on Android devices.",
      );
      return false;
    }

    const permissions = await this.checkPermissions();
    if (permissions.accessibility) return true;
    return this.requestAccessibilityPermission();
  }

  async prepareForFocusSession(
    blockedApps: { packageName: string; appName: string }[],
  ): Promise<boolean> {
    if (Platform.OS !== "android") return true;
    if (blockedApps.length === 0) return true;

    if (!this.isShieldModeEnabled()) {
      Alert.alert(
        "Shield Required",
        "Turn Shield ON to use strict Focus Protection during study sessions.",
      );
      return false;
    }

    return this.requestFocusProtectionPermissions();
  }

  async getUsageStatsRecommendations(): Promise<NativeUsageRecommendation[]> {
    if (Platform.OS !== "android") return [];

    try {
      return await AppBlocker.getUsageStatsRecommendations();
    } catch (error) {
      console.error("Error getting usage recommendations:", error);
      return [];
    }
  }

  private async requestUsageStatsPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        "Usage Access Permission",
        "Sankalai uses Usage Access for private screen-time insights and app recommendations.\n\nThis does not enable live blocking or Accessibility.",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: "Grant Permission",
            onPress: () => {
              AppBlocker.requestUsageStatsPermission();
              setTimeout(() => {
                const hasPermission = AppBlocker.hasUsageStatsPermission();
                if (!hasPermission) {
                  Alert.alert(
                    "Permission Required",
                    "Please enable Usage Access for Sankalai to power Shield recommendations.",
                    [{ text: "OK", onPress: () => resolve(false) }],
                  );
                } else {
                  resolve(true);
                }
              }, 2000);
            },
          },
        ],
      );
    });
  }

  private async requestAccessibilityPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        "Focus Protection",
        "Focus Protection requires Accessibility permission for strict blocking during study sessions.",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: "Enable Focus Protection",
            onPress: () => {
              AppBlocker.requestAccessibilityService();
              setTimeout(() => {
                const isEnabled = AppBlocker.isAccessibilityServiceEnabled();
                if (!isEnabled) {
                  Alert.alert(
                    "Focus Protection Required",
                    "Please enable the Sankalai Accessibility service to use strict blocking during study sessions.",
                    [{ text: "OK", onPress: () => resolve(false) }],
                  );
                } else {
                  resolve(true);
                }
              }, 3000);
            },
          },
        ],
      );
    });
  }

  async startNativeSession(
    session: SessionLike,
    blockedApps: { packageName: string; appName: string }[],
  ): Promise<boolean> {
    if (Platform.OS !== "android") {
      return false;
    }

    try {
      const effectiveBlockedApps = blockedApps
        .map((app) => ({
          packageName: app.packageName.trim(),
          appName: app.appName.trim() || app.packageName.trim(),
        }))
        .filter((app) => !!app.packageName);

      if (effectiveBlockedApps.length === 0) {
        this.stopNativeSession();
        return true;
      }

      if (!this.isShieldModeEnabled()) {
        return false;
      }

      const granted = await this.prepareForFocusSession(effectiveBlockedApps);
      if (!granted) return false;

      const started = AppBlocker.startBlockingSession({
        sessionId: session.id,
        blockedApps: effectiveBlockedApps,
        startTime: new Date(session.startTime).getTime(),
        duration: session.duration,
      });

      if (!started) {
        Alert.alert(
          "Focus Protection Unavailable",
          "Android could not activate strict blocking for this study session.",
        );
        return false;
      }

      this.startListening();
      return true;
    } catch (error) {
      console.error("Error starting native session:", error);
      Alert.alert(
        "Focus Protection Error",
        "Failed to start strict blocking. Please check Focus Protection settings and try again.",
      );
      return false;
    }
  }

  pauseMonitoring(): void {
    if (Platform.OS !== "android") return;

    try {
      // Try to call native pause if available
      if (AppBlocker.pauseMonitoring) {
        AppBlocker.pauseMonitoring();
      }
    } catch (error) {
      console.error("Error pausing monitoring:", error);
    }
  }

  resumeMonitoring(): void {
    if (Platform.OS !== "android") return;

    try {
      // Try to call native resume if available
      if (AppBlocker.resumeMonitoring) {
        AppBlocker.resumeMonitoring();
      }
    } catch (error) {
      console.error("Error resuming monitoring:", error);
    }
  }

  stopNativeSession(): void {
    if (Platform.OS !== "android") return;

    try {
      AppBlocker.stopBlockingSession();
      this.stopListening();
    } catch (error) {
      console.error("Error stopping native session:", error);
    }
  }

  stopNativeSessionById(sessionId: string): void {
    if (Platform.OS !== "android") return;

    try {
      AppBlocker.stopBlockingSessionById(sessionId);
      if (!AppBlocker.isBlockingSessionActive()) {
        this.stopListening();
      }
    } catch (error) {
      console.error("Error stopping native session by id:", error);
    }
  }

  isNativeSessionActive(): boolean {
    if (Platform.OS !== "android") return false;

    try {
      return AppBlocker.isBlockingSessionActive();
    } catch (error) {
      console.error("Error checking native session:", error);
      return false;
    }
  }

  async promptToDisableAfterSession(): Promise<void> {
    if (Platform.OS !== "android") return;

    try {
      if (!AppBlocker.isAccessibilityServiceEnabled()) {
        return;
      }
    } catch (error) {
      console.error("Error checking Accessibility before prompt:", error);
      return;
    }

    await new Promise<void>((resolve) => {
      Alert.alert(
        "Study session complete",
        "Disable Focus Protection for full privacy and banking safety.",
        [
          {
            text: "Disable Now",
            onPress: () => {
              AppBlocker.requestAccessibilityService();
              resolve();
            },
          },
          {
            text: "Keep Enabled",
            style: "cancel",
            onPress: () => resolve(),
          },
        ],
      );
    });
  }

  getPrivacyCompletionMessage(): string {
    return "Study session complete. Disable Focus Protection for full privacy and banking safety.";
  }

  private startListening(): void {
    if (this.appBlockedListener) return;

    this.appBlockedListener = AppBlocker.addAppBlockedListener((event) => {
      console.log("App blocked:", event.appName, event.packageName);
    });
  }

  private stopListening(): void {
    if (this.appBlockedListener) {
      this.appBlockedListener.remove();
      this.appBlockedListener = null;
    }
  }
}

export const nativeBlockingService = new NativeBlockingService();
