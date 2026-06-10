// App Blocking Service with Backend API Integration
import { apiCall } from '../config/api';

export interface BlockedApp {
  id: number;
  name: string;
  category: string;
  icon: string;
  logo?: string;
  blocked: boolean;
  packageName?: string;
  bundleId?: string;
}

export interface BlockingSession {
  id: string;
  userId: string;
  appId: number;
  appName: string;
  startTime: Date;
  duration: number; // in minutes
  status: 'active' | 'completed' | 'broken';
  coinsEarned: number;
  coinsLost: number;
  completedAt?: Date;
  brokenAt?: Date;
}

export interface BlockingLog {
  id: string;
  userId: string;
  appId: number;
  appName: string;
  action: 'block' | 'unblock' | 'session_start' | 'session_complete' | 'session_broken';
  timestamp: Date;
  coinsChange: number;
  sessionId?: string;
}

const REWARD_COINS = 20; // Coins earned for completing session
const PENALTY_COINS = 50; // Coins lost for breaking session
const DEFAULT_SESSION_DURATION = 50; // minutes

class BlockingService {
  /**
   * Get user's blocked apps from backend
   */
  async getUserBlockedApps(userId: string): Promise<BlockedApp[]> {
    try {
      const response = await apiCall('/blocking/apps', 'GET');
      
      return response.map((app: any) => ({
        id: app.appId,
        name: app.appName,
        category: app.category,
        icon: app.icon,
        logo: app.logo,
        blocked: app.blocked,
        packageName: app.packageName,
        bundleId: app.bundleId,
      }));
    } catch (error) {
      console.error('Error getting blocked apps:', error);
      return [];
    }
  }

  /**
   * Save blocked apps to backend
   */
  async saveUserBlockedApps(userId: string, apps: BlockedApp[]): Promise<void> {
    try {
      await apiCall('/blocking/apps', 'POST', {
        apps: apps.map(app => ({
          appId: app.id,
          appName: app.name,
          category: app.category,
          icon: app.icon,
          logo: app.logo,
          blocked: app.blocked,
          packageName: app.packageName,
          bundleId: app.bundleId,
        })),
      });
    } catch (error) {
      console.error('Error saving blocked apps:', error);
      throw error;
    }
  }

  /**
   * Toggle app blocking status
   */
  async toggleAppBlocking(userId: string, appId: number, apps: BlockedApp[]): Promise<BlockedApp[]> {
    try {
      await apiCall(`/blocking/apps/${appId}/toggle`, 'PUT');
      return await this.getUserBlockedApps(userId);
    } catch (error) {
      console.error('Error toggling app blocking:', error);
      throw error;
    }
  }

  /**
   * Start a blocking session for an app
   */
  async startBlockingSession(
    userId: string,
    appId: number,
    appName: string,
    duration: number = DEFAULT_SESSION_DURATION
  ): Promise<BlockingSession> {
    try {
      const response = await apiCall('/blocking/sessions/start', 'POST', {
        appId,
        appName,
        duration,
      });

      return {
        id: response.id,
        userId,
        appId: response.appId,
        appName: response.appName,
        startTime: new Date(response.startTime),
        duration: response.duration,
        status: response.status,
        coinsEarned: response.coinsEarned,
        coinsLost: response.coinsLost,
      };
    } catch (error) {
      console.error('Error starting blocking session:', error);
      throw error;
    }
  }

  /**
   * Complete a blocking session (user successfully avoided the app)
   */
  async completeBlockingSession(sessionId: string, userId: string): Promise<number> {
    try {
      const response = await apiCall(`/blocking/sessions/${sessionId}/complete`, 'POST');
      return response.coinsChange;
    } catch (error) {
      console.error('Error completing blocking session:', error);
      throw error;
    }
  }

  /**
   * Break a blocking session (user unlocked the app mid-session)
   */
  async breakBlockingSession(sessionId: string, userId: string): Promise<number> {
    try {
      const response = await apiCall(`/blocking/sessions/${sessionId}/break`, 'POST');
      return Math.abs(response.coinsChange);
    } catch (error) {
      console.error('Error breaking blocking session:', error);
      throw error;
    }
  }

  /**
   * Get active blocking sessions for user
   */
  async getActiveBlockingSessions(userId: string): Promise<BlockingSession[]> {
    try {
      const response = await apiCall('/blocking/sessions/active', 'GET');
      
      return response.map((s: any) => ({
        id: s.id,
        userId: s.userId,
        appId: s.appId,
        appName: s.appName,
        startTime: new Date(s.startTime),
        duration: s.duration,
        status: s.status,
        coinsEarned: s.coinsEarned,
        coinsLost: s.coinsLost,
      }));
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  }

  /**
   * Check if app has an active blocking session
   */
  async hasActiveSession(userId: string, appId: number): Promise<BlockingSession | null> {
    try {
      const sessions = await this.getActiveBlockingSessions(userId);
      return sessions.find(s => s.appId === appId) || null;
    } catch (error) {
      console.error('Error checking active session:', error);
      return null;
    }
  }

  /**
   * Get blocking statistics for user
   */
  async getBlockingStats(userId: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    brokenSessions: number;
    totalCoinsEarned: number;
    totalCoinsLost: number;
    successRate: number;
  }> {
    try {
      const response = await apiCall('/blocking/stats', 'GET');
      
      return {
        totalSessions: response.totalSessions,
        completedSessions: response.completedSessions,
        brokenSessions: response.brokenSessions,
        totalCoinsEarned: response.totalCoinsEarned,
        totalCoinsLost: response.totalCoinsLost,
        successRate: response.successRate,
      };
    } catch (error) {
      console.error('Error getting blocking stats:', error);
      return {
        totalSessions: 0,
        completedSessions: 0,
        brokenSessions: 0,
        totalCoinsEarned: 0,
        totalCoinsLost: 0,
        successRate: 0,
      };
    }
  }

  /**
   * Clean up old/stale active sessions (for debugging)
   */
  async cleanupStaleSessions(userId: string): Promise<number> {
    try {
      const response = await apiCall('/blocking/sessions/cleanup', 'POST');
      return response;
    } catch (error) {
      console.error('Error cleaning up stale sessions:', error);
      return 0;
    }
  }

  // Placeholder methods for backward compatibility
  private async updateUserCoins(userId: string, coinsChange: number): Promise<void> {
    // Coins are updated on the backend
    console.log('Coins update handled by backend');
  }

  private async logBlockingAction(
    userId: string,
    appId: number,
    appName: string,
    action: BlockingLog['action'],
    coinsChange: number,
    sessionId?: string
  ): Promise<void> {
    // Logging is handled by backend
    console.log('Logging handled by backend');
  }

  private async getLocalBlockedApps(): Promise<BlockedApp[]> {
    return [];
  }
}

export const blockingService = new BlockingService();
export { DEFAULT_SESSION_DURATION, PENALTY_COINS, REWARD_COINS };

