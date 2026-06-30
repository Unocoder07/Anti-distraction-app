/**
 * Native App Blocking Service
 * Shield uses Usage Access for passive recommendations.
 * Focus Protection uses Accessibility only during active study sessions.
 */
import { Alert, Platform } from "react-native";
import { appBlockerNative as AppBlocker } from "./appBlockerNative";

export interface NativeBlockingSession {
  sessionId: string;
  blockedApps: {
    packageName: string;
    appName: string;
    sessionStartedAt?: number;
    sessionEndsAt?: number;
    sessionDuration?: number;
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
  private sensitiveAppDetectedListener: any = null;
  private sensitiveAppClearedListener: any = null;
  private sensitiveAppsWhitelist = new Set<string>();
  private sensitiveAppsScanned = false;

  async checkPermissions(): Promise<NativeProtectionPermissions> {
    if (Platform.OS !== "android") {
      return { overlay: true, accessibility: false, usageStats: false, notification: false };
    }

    try {
      const [accessibility, usageStats] = await Promise.all([
        AppBlocker.isAccessibilityServiceEnabled(),
        AppBlocker.hasUsageStatsPermission(),
      ]);
      return {
        overlay: true,
        accessibility,
        usageStats,
        notification: true,
      };
    } catch (error) {
      console.error("Error checking permissions:", error);
      return { overlay: true, accessibility: false, usageStats: false, notification: false };
    }
  }

  isShieldModeEnabled(): boolean {
    // Shield Mode is managed by the JS store (newShieldStore),
    // not the native module. Always return true to allow blocking.
    // The actual session state is tracked in BlockingSessionManager.
    return true;
  }

  setShieldModeEnabled(enabled: boolean): boolean {
    // Shield Mode toggle is handled at the JS layer.
    // This is a no-op for the native side.
    return enabled;
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

  async requestFocusProtectionPermissions(silent = false): Promise<boolean> {
    if (Platform.OS !== "android") {
      if (!silent) {
        Alert.alert(
          "Not Available",
          "Focus Protection is only available on Android devices.",
        );
      }
      return false;
    }

    const permissions = await this.checkPermissions();
    if (permissions.accessibility) return true;
    if (silent) return false;
    return this.requestAccessibilityPermission();
  }

  async prepareForFocusSession(
    blockedApps: {
      packageName: string;
      appName: string;
      sessionStartedAt?: number;
      sessionEndsAt?: number;
      sessionDuration?: number;
    }[],
    silent = false,
  ): Promise<boolean> {
    if (Platform.OS !== "android") return true;
    if (blockedApps.length === 0) return true;

    if (!this.isShieldModeEnabled()) {
      if (!silent) {
        Alert.alert(
          "Shield Required",
          "Turn Shield ON to use strict Focus Protection during study sessions.",
        );
      }
      return false;
    }

    return this.requestFocusProtectionPermissions(silent);
  }

  async scanSensitiveAppsWhitelist(): Promise<string[]> {
    if (Platform.OS !== "android") return [];

    try {
      const packages = await AppBlocker.scanSensitiveApps();
      this.sensitiveAppsWhitelist = new Set(packages);
      this.sensitiveAppsScanned = true;
      return packages;
    } catch (error) {
      console.error("Error scanning sensitive apps whitelist:", error);
      return [];
    }
  }

  async getSensitiveAppsWhitelist(): Promise<string[]> {
    if (Platform.OS !== "android") return [];

    try {
      const packages = this.sensitiveAppsScanned
        ? Array.from(this.sensitiveAppsWhitelist)
        : await AppBlocker.getSensitiveAppsWhitelist();
      this.sensitiveAppsWhitelist = new Set(packages);
      this.sensitiveAppsScanned = true;
      return packages;
    } catch (error) {
      console.error("Error loading sensitive apps whitelist:", error);
      return [];
    }
  }

  async isSensitiveApp(packageName: string): Promise<boolean> {
    if (Platform.OS !== "android") return false;

    try {
      if (!this.sensitiveAppsScanned) {
        await this.getSensitiveAppsWhitelist();
      }

      return this.sensitiveAppsWhitelist.has(packageName) ||
        await AppBlocker.isSensitiveApp(packageName);
    } catch (error) {
      console.error("Error checking sensitive app:", error);
      return false;
    }
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
            onPress: async () => {
              AppBlocker.requestUsageStatsPermission();
              setTimeout(async () => {
                const hasPermission = await AppBlocker.hasUsageStatsPermission();
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
            onPress: async () => {
              AppBlocker.requestAccessibilityService();
              setTimeout(async () => {
                const isEnabled = await AppBlocker.isAccessibilityServiceEnabled();
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
    blockedApps: {
      packageName: string;
      appName: string;
      sessionStartedAt?: number;
      sessionEndsAt?: number;
      sessionDuration?: number;
    }[],
    silent = false,
  ): Promise<boolean> {
    if (Platform.OS !== "android") {
      return false;
    }

    try {
      await this.clearSensitiveAppState();

      if (!this.sensitiveAppsScanned) {
        await this.scanSensitiveAppsWhitelist();
      }

      const effectiveBlockedApps = (
        await Promise.all(
          blockedApps.map(async (app) => ({
            packageName: app.packageName.trim(),
            appName: app.appName.trim() || app.packageName.trim(),
            sessionStartedAt: app.sessionStartedAt,
            sessionEndsAt: app.sessionEndsAt,
            sessionDuration: app.sessionDuration,
            sensitive: await this.isSensitiveApp(app.packageName.trim()),
          })),
        )
      )
        .filter((app) => !app.sensitive)
        .map((app) => ({
          packageName: app.packageName,
          appName: app.appName,
          sessionStartedAt: app.sessionStartedAt,
          sessionEndsAt: app.sessionEndsAt,
          sessionDuration: app.sessionDuration,
        }))
        .filter((app) => !!app.packageName);

      if (effectiveBlockedApps.length === 0) {
        await this.stopNativeSession();
        return true;
      }

      if (!this.isShieldModeEnabled()) {
        return false;
      }

      const granted = await this.prepareForFocusSession(effectiveBlockedApps, silent);
      if (!granted) return false;

      const started = await AppBlocker.startBlockingSession({
        sessionId: session.id,
        blockedApps: effectiveBlockedApps,
        startTime: new Date(session.startTime).getTime(),
        duration: session.duration,
      });

      if (!started) {
        if (!silent) {
          Alert.alert(
            "Focus Protection Unavailable",
            "Android could not activate strict blocking for this study session.",
          );
        }
        return false;
      }

      this.startListening();
      return true;
    } catch (error) {
      console.error("Error starting native session:", error);
      if (!silent) {
        Alert.alert(
          "Focus Protection Error",
          "Failed to start strict blocking. Please check Focus Protection settings and try again.",
        );
      }
      return false;
    }
  }

  async pauseMonitoring(): Promise<void> {
    if (Platform.OS !== "android") return;

    try {
      // Try to call native pause if available
      if (AppBlocker.pauseMonitoring) {
        await AppBlocker.pauseMonitoring();
      }
    } catch (error) {
      console.error("Error pausing monitoring:", error);
    }
  }

  async disableAccessibilityService(): Promise<boolean> {
    if (Platform.OS !== "android") return true;

    try {
      await this.pauseMonitoring();
      // Kept as a compatibility API for old callers. Android cannot silently
      // re-enable Accessibility, so Sankalai now pauses enforcement only.
      return true;
    } catch (error) {
      console.error("Error pausing Focus Protection:", error);
      return false;
    }
  }

  async resumeMonitoring(): Promise<void> {
    if (Platform.OS !== "android") return;

    try {
      await this.clearSensitiveAppState();

      // Try to call native resume if available
      if (AppBlocker.resumeMonitoring) {
        await AppBlocker.resumeMonitoring();
      }
    } catch (error) {
      console.error("Error resuming monitoring:", error);
    }
  }

  async stopNativeSession(): Promise<void> {
    if (Platform.OS !== "android") return;

    try {
      await this.clearSensitiveAppState();
      await AppBlocker.stopBlockingSession();
      this.stopListening();
    } catch (error) {
      console.error("Error stopping native session:", error);
    }
  }

  async stopNativeSessionById(sessionId: string): Promise<void> {
    if (Platform.OS !== "android") return;

    try {
      await this.clearSensitiveAppState();
      await AppBlocker.stopBlockingSessionById(sessionId);
      const active = await AppBlocker.isBlockingSessionActive();
      if (!active) {
        this.stopListening();
      }
    } catch (error) {
      console.error("Error stopping native session by id:", error);
    }
  }

  async isNativeSessionActive(): Promise<boolean> {
    if (Platform.OS !== "android") return false;

    try {
      return await AppBlocker.isBlockingSessionActive();
    } catch (error) {
      console.error("Error checking native session:", error);
      return false;
    }
  }

  async promptToDisableAfterSession(): Promise<void> {
    await this.pauseMonitoring();
  }

  async clearSensitiveAppState(): Promise<void> {
    if (Platform.OS !== "android") return;

    try {
      await AppBlocker.clearSensitiveAppState();
    } catch (error) {
      console.error("Error clearing sensitive app state:", error);
    }

    await this.clearShieldSafeModeState({ resumeNative: false });
  }

  getPrivacyCompletionMessage(): string {
    return "Study session complete. Banking, payment, wallet, and OTP apps stay whitelisted during future sessions.";
  }

  private startListening(): void {
    if (this.appBlockedListener) return;

    this.appBlockedListener = AppBlocker.addAppBlockedListener((event) => {
      console.log("App blocked:", event.appName, event.packageName);
    });

    // Listen for sensitive (banking/payment) app detected.
    // This is a silent bypass state: keep the service enabled and avoid warning UI.
    this.sensitiveAppDetectedListener = AppBlocker.addSensitiveAppDetectedListener(
      async (event) => {
        console.log(
          "Sensitive app bypass active:",
          event.appName,
          event.packageName,
        );
        try {
          const { useShieldStore } = await import("../store/newShieldStore");
          await useShieldStore.getState().enterSafeMode(event.packageName, event.appName);
        } catch (e) {
          console.warn("Failed to record sensitive app bypass:", e);
        }
      },
    );

    // Listen for sensitive app closed (user left banking app)
    this.sensitiveAppClearedListener = AppBlocker.addSensitiveAppClearedListener(
      async (_event) => {
        console.log("Sensitive app cleared, resuming monitoring");
        try {
          await this.clearShieldSafeModeState({ resumeNative: false });
        } catch (e) {
          console.warn("Failed to exit safe mode:", e);
        }
      },
    );
  }

  private stopListening(): void {
    if (this.appBlockedListener) {
      this.appBlockedListener.remove();
      this.appBlockedListener = null;
    }
    if (this.sensitiveAppDetectedListener) {
      this.sensitiveAppDetectedListener.remove();
      this.sensitiveAppDetectedListener = null;
    }
    if (this.sensitiveAppClearedListener) {
      this.sensitiveAppClearedListener.remove();
      this.sensitiveAppClearedListener = null;
    }
  }

  private async clearShieldSafeModeState(options: { resumeNative?: boolean } = {}): Promise<void> {
    try {
      const { useShieldStore } = await import("../store/newShieldStore");
      const { inSafeMode, exitSafeMode, clearSafeModeState } = useShieldStore.getState();

      if (inSafeMode) {
        await exitSafeMode({ resumeNative: options.resumeNative });
      } else {
        clearSafeModeState();
      }
    } catch (error) {
      console.warn("Failed to clear safe mode state:", error);
    }
  }
}

export const nativeBlockingService = new NativeBlockingService();
