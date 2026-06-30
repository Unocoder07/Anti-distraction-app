import { NativeEventEmitter, NativeModules, Platform } from "react-native";

export type NativeBlockedApp = {
  packageName: string;
  appName: string;
  sessionStartedAt?: number;
  sessionEndsAt?: number;
  sessionDuration?: number;
};

export type NativeBlockingSessionPayload = {
  sessionId: string;
  blockedApps: NativeBlockedApp[];
  startTime: number;
  duration: number;
};

export type NativeUsageRecommendation = {
  packageName: string;
  name: string;
  icon?: string;
  isSystemApp: boolean;
  category?: string;
  totalTimeMs?: number;
  openCount?: number;
  lastAnalyzedAt?: number;
};

export type NativeAppBlockedEvent = {
  packageName: string;
  appName: string;
  timestamp: number;
};

export type NativeSensitiveAppEvent = {
  packageName: string;
  appName: string;
  timestamp: number;
};

export type NativeSensitiveAppClearedEvent = {
  timestamp: number;
};

type NativeSubscription = { remove: () => void };

type AppBlockerNativeModule = {
  hasOverlayPermission?: () => Promise<boolean>;
  requestOverlayPermission?: () => Promise<boolean>;
  isAccessibilityServiceEnabled?: () => Promise<boolean>;
  requestAccessibilityService?: () => Promise<boolean>;
  disableAccessibilityService?: () => Promise<boolean>;
  hasUsageStatsPermission?: () => Promise<boolean>;
  requestUsageStatsPermission?: () => Promise<boolean>;
  startPassiveMonitoring?: () => Promise<boolean>;
  stopPassiveMonitoring?: () => Promise<boolean>;
  isShieldModeEnabled?: () => Promise<boolean>;
  setShieldModeEnabled?: (enabled: boolean) => Promise<boolean>;
  getUsageStatsRecommendations?: () => Promise<NativeUsageRecommendation[]>;
  getInstalledApps?: () => Promise<NativeUsageRecommendation[]>;
  scanSensitiveApps?: () => Promise<string[]>;
  getSensitiveAppsWhitelist?: () => Promise<string[]>;
  startBlockingSession?: (session: NativeBlockingSessionPayload) => Promise<boolean>;
  stopBlockingSession?: () => Promise<boolean>;
  stopBlockingSessionById?: (sessionId: string) => Promise<boolean>;
  isBlockingSessionActive?: () => Promise<boolean>;
  isFocusSessionActive?: () => Promise<boolean>;
  pauseMonitoring?: () => Promise<boolean>;
  resumeMonitoring?: () => Promise<boolean>;
  clearSensitiveAppState?: () => Promise<boolean>;
  isSensitiveApp?: (packageName: string) => Promise<boolean>;
  addListener?: (eventName: string) => void;
  removeListeners?: (count: number) => void;
};

const nativeModule: AppBlockerNativeModule | undefined =
  Platform.OS === "android" ? NativeModules.AppBlocker : undefined;

const eventEmitter = nativeModule ? new NativeEventEmitter(nativeModule as any) : null;

function callBoolean(
  methodName: keyof AppBlockerNativeModule,
  fallback: boolean,
  ...args: unknown[]
): boolean {
  try {
    const method = nativeModule?.[methodName];
    if (typeof method !== "function") return fallback;
    // Native module methods return Promises but callBoolean is sync
    // For sync checks, this returns the Promise (truthy) — use async versions instead
    const result = (method as (...methodArgs: unknown[]) => unknown)(...args);
    if (result instanceof Promise) return fallback;
    return Boolean(result);
  } catch (error) {
    console.error(`AppBlockerNative.${String(methodName)} failed:`, error);
    return fallback;
  }
}

async function callBooleanAsync(
  methodName: keyof AppBlockerNativeModule,
  fallback: boolean,
  ...args: unknown[]
): Promise<boolean> {
  try {
    const method = nativeModule?.[methodName];
    if (typeof method !== "function") return fallback;
    const result = await (method as (...methodArgs: unknown[]) => unknown)(...args);
    return Boolean(result);
  } catch (error) {
    console.error(`AppBlockerNative.${String(methodName)} failed:`, error);
    return fallback;
  }
}

async function callArray(
  methodName: keyof AppBlockerNativeModule,
): Promise<NativeUsageRecommendation[]> {
  try {
    const method = nativeModule?.[methodName];
    if (typeof method !== "function") return [];
    const result = await (method as () => Promise<NativeUsageRecommendation[]> | NativeUsageRecommendation[])();
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error(`AppBlockerNative.${String(methodName)} failed:`, error);
    return [];
  }
}

async function callStringArray(
  methodName: keyof AppBlockerNativeModule,
): Promise<string[]> {
  try {
    const method = nativeModule?.[methodName];
    if (typeof method !== "function") return [];
    const result = await (method as () => Promise<string[]> | string[])();
    return Array.isArray(result)
      ? result.filter((item): item is string => typeof item === "string")
      : [];
  } catch (error) {
    console.error(`AppBlockerNative.${String(methodName)} failed:`, error);
    return [];
  }
}

export const appBlockerNative = {
  isAvailable(): boolean {
    return Platform.OS === "android" && !!nativeModule;
  },

  hasOverlayPermission(): boolean {
    return callBoolean("hasOverlayPermission", true);
  },

  async hasOverlayPermissionAsync(): Promise<boolean> {
    return callBooleanAsync("hasOverlayPermission", true);
  },

  requestOverlayPermission(): boolean {
    return callBoolean("requestOverlayPermission", true);
  },

  async isAccessibilityServiceEnabled(): Promise<boolean> {
    return callBooleanAsync("isAccessibilityServiceEnabled", false);
  },

  isAccessibilityServiceEnabledSync(): boolean {
    return callBoolean("isAccessibilityServiceEnabled", false);
  },

  requestAccessibilityService(): boolean {
    return callBoolean("requestAccessibilityService", false);
  },

  async disableAccessibilityService(): Promise<boolean> {
    return callBooleanAsync("disableAccessibilityService", true);
  },

  async hasUsageStatsPermission(): Promise<boolean> {
    return callBooleanAsync("hasUsageStatsPermission", false);
  },

  hasUsageStatsPermissionSync(): boolean {
    return callBoolean("hasUsageStatsPermission", false);
  },

  requestUsageStatsPermission(): boolean {
    return callBoolean("requestUsageStatsPermission", false);
  },

  startPassiveMonitoring(): boolean {
    return callBoolean("startPassiveMonitoring", false);
  },

  stopPassiveMonitoring(): boolean {
    return callBoolean("stopPassiveMonitoring", true);
  },

  isShieldModeEnabled(): boolean {
    return callBoolean("isShieldModeEnabled", false);
  },

  setShieldModeEnabled(enabled: boolean): boolean {
    return callBoolean("setShieldModeEnabled", enabled, enabled);
  },

  getUsageStatsRecommendations(): Promise<NativeUsageRecommendation[]> {
    return callArray("getUsageStatsRecommendations");
  },

  getInstalledApps(): Promise<NativeUsageRecommendation[]> {
    return callArray("getInstalledApps");
  },

  scanSensitiveApps(): Promise<string[]> {
    return callStringArray("scanSensitiveApps");
  },

  getSensitiveAppsWhitelist(): Promise<string[]> {
    return callStringArray("getSensitiveAppsWhitelist");
  },

  async startBlockingSession(session: NativeBlockingSessionPayload): Promise<boolean> {
    return callBooleanAsync("startBlockingSession", false, session);
  },

  async stopBlockingSession(): Promise<boolean> {
    return callBooleanAsync("stopBlockingSession", true);
  },

  async stopBlockingSessionById(sessionId: string): Promise<boolean> {
    return callBooleanAsync("stopBlockingSessionById", true, sessionId);
  },

  async isBlockingSessionActive(): Promise<boolean> {
    return callBooleanAsync("isBlockingSessionActive", false);
  },

  isFocusSessionActive(): boolean {
    return callBoolean("isFocusSessionActive", false);
  },

  async pauseMonitoring(): Promise<boolean> {
    return callBooleanAsync("pauseMonitoring", true);
  },

  async resumeMonitoring(): Promise<boolean> {
    return callBooleanAsync("resumeMonitoring", true);
  },

  async clearSensitiveAppState(): Promise<boolean> {
    return callBooleanAsync("clearSensitiveAppState", true);
  },

  async isSensitiveApp(packageName: string): Promise<boolean> {
    return callBooleanAsync("isSensitiveApp", false, packageName);
  },

  addAppBlockedListener(
    listener: (event: NativeAppBlockedEvent) => void,
  ): NativeSubscription {
    if (!eventEmitter) {
      return { remove: () => undefined };
    }

    return eventEmitter.addListener("AppBlocked", listener);
  },

  addSensitiveAppDetectedListener(
    listener: (event: NativeSensitiveAppEvent) => void,
  ): NativeSubscription {
    if (!eventEmitter) {
      return { remove: () => undefined };
    }

    return eventEmitter.addListener("SensitiveAppDetected", listener);
  },

  addSensitiveAppClearedListener(
    listener: (event: NativeSensitiveAppClearedEvent) => void,
  ): NativeSubscription {
    if (!eventEmitter) {
      return { remove: () => undefined };
    }

    return eventEmitter.addListener("SensitiveAppCleared", listener);
  },
};
