// Service to monitor app switches and show warnings
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';

export interface BlockedAppMonitor {
  packageName: string;
  appName: string;
}

class AppMonitorService {
  private blockedApps: BlockedAppMonitor[] = [];
  private isMonitoring = false;
  private appStateSubscription: any = null;
  private lastAppState: AppStateStatus = 'active';
  private sessionActive = false;
  private onAppSwitchAttempt: ((appName: string) => void) | null = null;

  /**
   * Start monitoring for app switches
   */
  async startMonitoring(
    blockedApps: BlockedAppMonitor[],
    onAttempt?: (appName: string) => void
  ): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️ Already monitoring');
      return;
    }

    this.blockedApps = blockedApps;
    this.sessionActive = true;
    this.onAppSwitchAttempt = onAttempt || null;
    this.isMonitoring = true;

    console.log(`🛡️ Started monitoring ${blockedApps.length} blocked apps`);

    // Listen to app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    this.isMonitoring = false;
    this.sessionActive = false;
    this.blockedApps = [];
    this.onAppSwitchAttempt = null;

    console.log('🛡️ Stopped monitoring');
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    console.log(`📱 App state: ${this.lastAppState} → ${nextAppState}`);

    // Detect when user leaves the app
    if (this.lastAppState === 'active' && nextAppState.match(/inactive|background/)) {
      await this.onUserLeavesApp();
    }

    // Detect when user returns to the app
    if (this.lastAppState.match(/inactive|background/) && nextAppState === 'active') {
      await this.onUserReturnsToApp();
    }

    this.lastAppState = nextAppState;
  };

  /**
   * Called when user leaves the app
   */
  private async onUserLeavesApp(): Promise<void> {
    if (!this.sessionActive || this.blockedApps.length === 0) {
      return;
    }

    console.log('⚠️ User left app during blocking session!');

    // Try to detect which app they opened (Android only)
    if (Platform.OS === 'android') {
      setTimeout(async () => {
        try {
          // Get the foreground app
          const foregroundApp = await this.getForegroundApp();
          if (foregroundApp) {
            console.log(`📱 User opened: ${foregroundApp.name} (${foregroundApp.packageName})`);
            
            // Check if it's a blocked app
            const isBlocked = this.blockedApps.some(app => 
              app.packageName === foregroundApp.packageName
            );
            
            if (isBlocked) {
              console.log(`🚫 BLOCKED APP OPENED: ${foregroundApp.name}`);
              
              // Log the attempt
              if (this.onAppSwitchAttempt) {
                this.onAppSwitchAttempt(foregroundApp.name);
              }
            }
          }
        } catch (error) {
          console.log('Could not detect foreground app:', error);
        }
      }, 500); // Small delay to let the app switch complete
    }

    // Log the attempt
    if (this.onAppSwitchAttempt) {
      this.onAppSwitchAttempt('Unknown App');
    }
  }

  /**
   * Get the currently foreground app (Android only)
   */
  private async getForegroundApp(): Promise<{name: string; packageName: string} | null> {
    try {
      if (Platform.OS === 'android') {
        // This would require additional native code to get the truly foreground app
        // For now, we'll return null and rely on the warning system
        return null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Called when user returns to the app
   */
  private async onUserReturnsToApp(): Promise<void> {
    if (!this.sessionActive || this.blockedApps.length === 0) {
      return;
    }

    console.log('✅ User returned to app');

    // Show warning alert
    setTimeout(() => {
      this.showWarningAlert();
    }, 500); // Delay to let app fully resume
  }

  /**
   * Show warning alert
   */
  private showWarningAlert(): void {
    const blockedAppsList = this.blockedApps.map(app => app.appName).join(', ');
    const blockedCount = this.blockedApps.length;

    Alert.alert(
      '🚨 WARNING: Blocking Session Active!',
      `You left the app during your focus session!\n\n` +
      `🛡️ BLOCKED APPS (${blockedCount}):\n${blockedAppsList}\n\n` +
      `⚠️ DID YOU OPEN A BLOCKED APP?\n\n` +
      `If YES:\n` +
      `• Session will be BROKEN\n` +
      `• You'll LOSE 50 Focus Points\n` +
      `• All progress will be LOST\n\n` +
      `If NO (you only attended calls/messages):\n` +
      `• Continue your session\n` +
      `• Earn 20 FP when you complete\n\n` +
      `❓ Be honest: Did you open any blocked apps?`,
      [
        {
          text: '❌ Yes, I Opened Blocked App (-50 FP)',
          style: 'destructive',
          onPress: () => {
            // User admits they opened blocked app
            console.log('🚫 User admitted opening blocked app');
            if (this.onAppSwitchAttempt) {
              this.onAppSwitchAttempt('User Admitted - Session Broken');
            }
          },
        },
        {
          text: '✅ No, I Stayed Focused',
          style: 'cancel',
          onPress: () => {
            console.log('✅ User claims they stayed focused');
          },
        },
      ],
      { cancelable: false }
    );
  }

  /**
   * Update blocked apps list
   */
  updateBlockedApps(blockedApps: BlockedAppMonitor[]): void {
    this.blockedApps = blockedApps;
    console.log(`🔄 Updated blocked apps: ${blockedApps.length} apps`);
  }

  /**
   * Check if monitoring
   */
  isActive(): boolean {
    return this.isMonitoring && this.sessionActive;
  }

  /**
   * Get blocked apps count
   */
  getBlockedAppsCount(): number {
    return this.blockedApps.length;
  }
}

export const appMonitorService = new AppMonitorService();
