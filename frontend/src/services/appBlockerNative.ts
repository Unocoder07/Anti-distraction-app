import { NativeEventEmitter, NativeModules, Platform } from "react-native";

export type NativeBlockedApp = {
  packageName: string;
  appName: string;
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

type NativeSubscription = { remove: () => void };

type AppBlockerNativeModule = {
  hasOverlayPermission?: () => boolean;
  requestOverlayPermission?: () => boolean;
  isAccessibilityServiceEnabled?: () => boolean;
  requestAccessibilityService?: () => boolean;
  hasUsageStatsPermission?: () => boolean;
  requestUsageStatsPermission?: () => boolean;
  startPassiveMonitoring?: () => boolean;
  stopPassiveMonitoring?: () => boolean;
  isShieldModeEnabled?: () => boolean;
  setShieldModeEnabled?: (enabled: boolean) => boolean;
  getUsageStatsRecommendations?: () => Promise<NativeUsageRecommendation[]>;
  getInstalledApps?: () => Promise<NativeUsageRecommendation[]>;
  startBlockingSession?: (session: NativeBlockingSessionPayload) => boolean;
  stopBlockingSession?: () => boolean;
  stopBlockingSessionById?: (sessionId: string) => boolean;
  isBlockingSessionActive?: () => boolean;
  isFocusSessionActive?: () => boolean;
  pauseMonitoring?: () => boolean;
  resumeMonitoring?: () => boolean;
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
    return Boolean((method as (...methodArgs: unknown[]) => unknown)(...args));
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

export const appBlockerNative = {
  isAvailable(): boolean {
    return Platform.OS === "android" && !!nativeModule;
  },

  hasOverlayPermission(): boolean {
    return callBoolean("hasOverlayPermission", true);
  },

  requestOverlayPermission(): boolean {
    return callBoolean("requestOverlayPermission", true);
  },

  isAccessibilityServiceEnabled(): boolean {
    return callBoolean("isAccessibilityServiceEnabled", false);
  },

  requestAccessibilityService(): boolean {
    return callBoolean("requestAccessibilityService", false);
  },

  hasUsageStatsPermission(): boolean {
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

  startBlockingSession(session: NativeBlockingSessionPayload): boolean {
    return callBoolean("startBlockingSession", false, session);
  },

  stopBlockingSession(): boolean {
    return callBoolean("stopBlockingSession", true);
  },

  stopBlockingSessionById(sessionId: string): boolean {
    return callBoolean("stopBlockingSessionById", true, sessionId);
  },

  isBlockingSessionActive(): boolean {
    return callBoolean("isBlockingSessionActive", false);
  },

  isFocusSessionActive(): boolean {
    return callBoolean("isFocusSessionActive", false);
  },

  pauseMonitoring(): boolean {
    return callBoolean("pauseMonitoring", true);
  },

  resumeMonitoring(): boolean {
    return callBoolean("resumeMonitoring", true);
  },

  addAppBlockedListener(
    listener: (event: NativeAppBlockedEvent) => void,
  ): NativeSubscription {
    if (!eventEmitter) {
      return { remove: () => undefined };
    }

    return eventEmitter.addListener("AppBlocked", listener);
  },
};
