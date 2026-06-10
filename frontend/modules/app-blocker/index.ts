import { EventEmitter, Subscription } from 'expo-modules-core';

// Import the native module. On web, it will be resolved to AppBlocker.web.ts
// and on native platforms to AppBlocker.ts
import AppBlockerModule from './src/AppBlockerModule';

export interface BlockedApp {
  packageName: string;
  appName: string;
}

export interface BlockingSession {
  sessionId: string;
  blockedApps: BlockedApp[];
  startTime: number;
  duration: number; // in minutes
}

/**
 * Check if overlay permission is granted
 */
export function hasOverlayPermission(): boolean {
  return AppBlockerModule.hasOverlayPermission();
}

/**
 * Request overlay permission (opens settings)
 */
export function requestOverlayPermission(): void {
  AppBlockerModule.requestOverlayPermission();
}

/**
 * Check if accessibility service is enabled
 */
export function isAccessibilityServiceEnabled(): boolean {
  return AppBlockerModule.isAccessibilityServiceEnabled();
}

/**
 * Request accessibility service (opens settings)
 */
export function requestAccessibilityService(): void {
  AppBlockerModule.requestAccessibilityService();
}

/**
 * Check if usage stats permission is granted
 */
export function hasUsageStatsPermission(): boolean {
  return AppBlockerModule.hasUsageStatsPermission();
}

/**
 * Request usage stats permission (opens settings)
 */
export function requestUsageStatsPermission(): void {
  AppBlockerModule.requestUsageStatsPermission();
}

/**
 * Start blocking session
 */
export function startBlockingSession(session: BlockingSession): void {
  AppBlockerModule.startBlockingSession(
    session.sessionId,
    session.blockedApps,
    session.startTime,
    session.duration
  );
}

/**
 * Stop blocking session
 */
export function stopBlockingSession(): void {
  AppBlockerModule.stopBlockingSession();
}

/**
 * Check if blocking session is active
 */
export function isBlockingSessionActive(): boolean {
  return AppBlockerModule.isBlockingSessionActive();
}

/**
 * Get foreground app package name
 */
export function getForegroundApp(): string | null {
  return AppBlockerModule.getForegroundApp();
}

// Event emitter for app blocking events
const emitter = new EventEmitter(AppBlockerModule);

export interface AppBlockedEvent {
  packageName: string;
  appName: string;
  timestamp: number;
}

/**
 * Listen to app blocked events
 */
export function addAppBlockedListener(
  listener: (event: AppBlockedEvent) => void
): Subscription {
  return emitter.addListener<AppBlockedEvent>('onAppBlocked', listener);
}

export { AppBlockerModule };
