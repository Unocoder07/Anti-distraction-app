/**
 * Native App Blocking Service
 * Integrates with Android native module for TRUE app blocking
 */
import * as AppBlocker from 'app-blocker';
import { Alert, Platform } from 'react-native';
import type { BlockingSession as FirebaseSession } from './blockingService';

export interface NativeBlockingSession {
  sessionId: string;
  blockedApps: Array<{
    packageName: string;
    appName: string;
  }>;
  startTime: number;
  duration: number;
}

class NativeBlockingService {
  private appBlockedListener: any = null;

  /**
   * Check if all required permissions are granted
   */
  async checkPermissions(): Promise<{
    overlay: boolean;
    accessibility: boolean;
    usageStats: boolean;
  }> {
    if (Platform.OS !== 'android') {
      return { overlay: false, accessibility: false, usageStats: false };
    }

    try {
      return {
        overlay: AppBlocker.hasOverlayPermission(),
        accessibility: AppBlocker.isAccessibilityServiceEnabled(),
        usageStats: AppBlocker.hasUsageStatsPermission(),
      };
    } catch (error) {
      console.error('Error checking permissions:', error);
      return { overlay: false, accessibility: false, usageStats: false };
    }
  }

  /**
   * Request all required permissions with user-friendly dialogs
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      Alert.alert(
        'Not Available',
        'Native app blocking is only available on Android devices.'
      );
      return false;
    }

    const permissions = await this.checkPermissions();

    // Request Overlay Permission
    if (!permissions.overlay) {
      const granted = await this.requestOverlayPermission();
      if (!granted) return false;
    }

    // Request Usage Stats Permission
    if (!permissions.usageStats) {
      const granted = await this.requestUsageStatsPermission();
      if (!granted) return false;
    }

    // Request Accessibility Service
    if (!permissions.accessibility) {
      const granted = await this.requestAccessibilityPermission();
      if (!granted) return false;
    }

    return true;
  }

  /**
   * Request overlay permission
   */
  private async requestOverlayPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        '🛡️ Screen Overlay Permission',
        'We need permission to show blocking screens on top of other apps.\n\n' +
        'This allows us to physically block distracting apps during your focus sessions.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Grant Permission',
            onPress: () => {
              AppBlocker.requestOverlayPermission();
              // Give user time to grant permission
              setTimeout(() => {
                const hasPermission = AppBlocker.hasOverlayPermission();
                if (!hasPermission) {
                  Alert.alert(
                    'Permission Required',
                    'Please enable "Display over other apps" for Sankalai.',
                    [{ text: 'OK', onPress: () => resolve(false) }]
                  );
                } else {
                  resolve(true);
                }
              }, 2000);
            },
          },
        ]
      );
    });
  }

  /**
   * Request usage stats permission
   */
  private async requestUsageStatsPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        '📊 Usage Access Permission',
        'We need permission to monitor which apps are currently active.\n\n' +
        'This allows us to detect when you try to open blocked apps.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Grant Permission',
            onPress: () => {
              AppBlocker.requestUsageStatsPermission();
              // Give user time to grant permission
              setTimeout(() => {
                const hasPermission = AppBlocker.hasUsageStatsPermission();
                if (!hasPermission) {
                  Alert.alert(
                    'Permission Required',
                    'Please enable "Usage access" for Sankalai.',
                    [{ text: 'OK', onPress: () => resolve(false) }]
                  );
                } else {
                  resolve(true);
                }
              }, 2000);
            },
          },
        ]
      );
    });
  }

  /**
   * Request accessibility service
   */
  private async requestAccessibilityPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        '♿ Accessibility Service',
        'We need the Accessibility Service to monitor app switches.\n\n' +
        'Steps:\n' +
        '1. Find "Sankalai" in the list\n' +
        '2. Enable the service\n' +
        '3. Confirm when prompted\n\n' +
        'This service is used ONLY for app blocking - your privacy is protected.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Open Settings',
            onPress: () => {
              AppBlocker.requestAccessibilityService();
              // Give user time to enable service
              setTimeout(() => {
                const isEnabled = AppBlocker.isAccessibilityServiceEnabled();
                if (!isEnabled) {
                  Alert.alert(
                    'Service Required',
                    'Please enable the Accessibility Service for Sankalai to use app blocking.',
                    [{ text: 'OK', onPress: () => resolve(false) }]
                  );
                } else {
                  Alert.alert(
                    '✅ All Set!',
                    'Native app blocking is now active. Blocked apps will be physically prevented from opening during focus sessions.',
                    [{ text: 'Awesome!', onPress: () => resolve(true) }]
                  );
                }
              }, 3000);
            },
          },
        ]
      );
    });
  }

  /**
   * Start native blocking session
   */
  async startNativeSession(session: FirebaseSession, blockedApps: Array<{ packageName: string; appName: string }>): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.log('Native blocking only available on Android');
      return false;
    }

    try {
      // Check if we have all permissions
      const permissions = await this.checkPermissions();
      if (!permissions.overlay || !permissions.accessibility || !permissions.usageStats) {
        console.log('Missing permissions for native blocking');
        const granted = await this.requestPermissions();
        if (!granted) return false;
      }

      // Start native blocking session
      const nativeSession: NativeBlockingSession = {
        sessionId: session.id,
        blockedApps,
        startTime: new Date(session.startTime).getTime(),
        duration: session.duration,
      };

      AppBlocker.startBlockingSession(nativeSession);

      // Listen for app blocked events
      this.startListening();

      console.log('✅ Native blocking session started');
      return true;
    } catch (error) {
      console.error('Error starting native session:', error);
      Alert.alert(
        'Error',
        'Failed to start native app blocking. Please check permissions.'
      );
      return false;
    }
  }

  /**
   * Stop native blocking session
   */
  stopNativeSession(): void {
    if (Platform.OS !== 'android') return;

    try {
      AppBlocker.stopBlockingSession();
      this.stopListening();
      console.log('✅ Native blocking session stopped');
    } catch (error) {
      console.error('Error stopping native session:', error);
    }
  }

  /**
   * Check if native session is active
   */
  isNativeSessionActive(): boolean {
    if (Platform.OS !== 'android') return false;

    try {
      return AppBlocker.isBlockingSessionActive();
    } catch (error) {
      console.error('Error checking native session:', error);
      return false;
    }
  }

  /**
   * Start listening to app blocked events
   */
  private startListening(): void {
    if (this.appBlockedListener) return;

    this.appBlockedListener = AppBlocker.addAppBlockedListener((event) => {
      console.log('🚫 App blocked:', event.appName, event.packageName);
      // Could send to Firebase analytics
    });
  }

  /**
   * Stop listening to app blocked events
   */
  private stopListening(): void {
    if (this.appBlockedListener) {
      this.appBlockedListener.remove();
      this.appBlockedListener = null;
    }
  }

  /**
   * Get current foreground app (for debugging)
   */
  getForegroundApp(): string | null {
    if (Platform.OS !== 'android') return null;

    try {
      return AppBlocker.getForegroundApp();
    } catch (error) {
      console.error('Error getting foreground app:', error);
      return null;
    }
  }
}

export const nativeBlockingService = new NativeBlockingService();
