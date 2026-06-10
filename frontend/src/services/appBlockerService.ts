// App Blocker Service - Monitor and block app launches
import { AppState, AppStateStatus } from 'react-native';

export interface BlockAttempt {
  appId: number;
  appName: string;
  timestamp: Date;
  sessionId: string;
}

class AppBlockerService {
  private appStateSubscription: any = null;
  private blockedApps: Set<number> = new Set();
  private activeSessionApps: Map<number, string> = new Map(); // appId -> sessionId
  private onBlockAttempt: ((attempt: BlockAttempt) => void) | null = null;
  private lastAppState: AppStateStatus = 'active';

  /**
   * Start monitoring app state changes
   */
  startMonitoring(
    blockedAppIds: number[],
    activeSessions: Map<number, any>,
    onAttempt: (attempt: BlockAttempt) => void
  ): void {
    // Update blocked apps
    this.blockedApps = new Set(blockedAppIds);
    
    // Update active sessions
    this.activeSessionApps.clear();
    activeSessions.forEach((session, appId) => {
      this.activeSessionApps.set(appId, session.id);
    });
    
    // Set callback
    this.onBlockAttempt = onAttempt;

    // Start listening to app state changes
    if (!this.appStateSubscription) {
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.onBlockAttempt = null;
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    // Detect when user leaves the app (goes to background)
    if (this.lastAppState === 'active' && nextAppState.match(/inactive|background/)) {
      // User might be trying to open a blocked app
      this.checkForBlockedAppAttempt();
    }

    this.lastAppState = nextAppState;
  };

  /**
   * Check if user is trying to open a blocked app
   * Note: This is limited - we can't actually detect which app they opened
   */
  private checkForBlockedAppAttempt(): void {
    // In a real implementation with native code, we would:
    // 1. Detect which app is being opened
    // 2. Check if it's in our blocked list
    // 3. Show a system-level alert
    // 4. Prevent the app from opening
    
    // For now, we can only detect that the user left our app
    // We'll show a warning when they return
    console.log('User left app - might be trying to open blocked app');
  }

  /**
   * Check if an app is currently blocked
   */
  isAppBlocked(appId: number): boolean {
    return this.blockedApps.has(appId);
  }

  /**
   * Check if an app has an active blocking session
   */
  hasActiveSession(appId: number): boolean {
    return this.activeSessionApps.has(appId);
  }

  /**
   * Get warning message for blocked app
   */
  getWarningMessage(appName: string, hasSession: boolean): {
    title: string;
    message: string;
    severity: 'warning' | 'danger';
  } {
    if (hasSession) {
      return {
        title: '🛡️ App Blocked!',
        message: `${appName} is blocked during your focus session.\n\nOpening this app will:\n• Break your blocking session\n• Cost you 50 Focus Points\n• Reset your progress\n\nStay focused and complete your session to earn 20 FP!`,
        severity: 'danger',
      };
    } else {
      return {
        title: '⚠️ Distraction Alert',
        message: `${appName} is marked as blocked.\n\nThis app can distract you from studying. Consider:\n• Starting a blocking session\n• Staying focused on your goals\n• Earning rewards for self-control`,
        severity: 'warning',
      };
    }
  }

  /**
   * Attempt to open a blocked app (for testing)
   */
  async attemptToOpenApp(urlScheme: string, appId: number, appName: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // Check if app is blocked
    if (!this.isAppBlocked(appId)) {
      return { allowed: true };
    }

    // Check if there's an active session
    const hasSession = this.hasActiveSession(appId);
    
    if (hasSession) {
      // Record the attempt
      const sessionId = this.activeSessionApps.get(appId)!;
      const attempt: BlockAttempt = {
        appId,
        appName,
        timestamp: new Date(),
        sessionId,
      };

      // Notify callback
      if (this.onBlockAttempt) {
        this.onBlockAttempt(attempt);
      }

      return {
        allowed: false,
        reason: 'Active blocking session - opening will break session and cost 50 FP',
      };
    }

    return {
      allowed: false,
      reason: 'App is blocked - start a blocking session to earn rewards',
    };
  }

  /**
   * Get blocking statistics
   */
  getBlockingStats(): {
    totalBlockedApps: number;
    activeSessionApps: number;
  } {
    return {
      totalBlockedApps: this.blockedApps.size,
      activeSessionApps: this.activeSessionApps.size,
    };
  }

  /**
   * Update blocked apps list
   */
  updateBlockedApps(blockedAppIds: number[]): void {
    this.blockedApps = new Set(blockedAppIds);
  }

  /**
   * Update active sessions
   */
  updateActiveSessions(activeSessions: Map<number, any>): void {
    this.activeSessionApps.clear();
    activeSessions.forEach((session, appId) => {
      this.activeSessionApps.set(appId, session.id);
    });
  }
}

export const appBlockerService = new AppBlockerService();
