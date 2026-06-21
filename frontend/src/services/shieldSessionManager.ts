/**
 * Shield Session Manager
 * Handles all session-related logic including creation, tracking, persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BlockedApp {
  packageName: string;
  appName: string;
  icon: string;
  category: string;
}

export interface ShieldSession {
  id: string;
  userId?: string;
  blockedApps: BlockedApp[];
  duration: number; // in minutes
  startTime: Date;
  endTime: Date;
  status: 'active' | 'completed' | 'broken' | 'safe_mode';
  coinsEarned: number;
  coinsLost: number;
  emergencyAccessUsed: number;
  emergencyAccessLog: EmergencyAccess[];
  safeModeEntries: SafeModeEntry[];
}

export interface EmergencyAccess {
  appName: string;
  timestamp: Date;
  duration: number; // seconds
}

export interface SafeModeEntry {
  appName: string;
  enteredAt: Date;
  exitedAt?: Date;
}

const STORAGE_KEY = '@shield_session';
const HISTORY_KEY = '@shield_history';

class ShieldSessionManager {
  private currentSession: ShieldSession | null = null;
  private sessionTimer: NodeJS.Timeout | null = null;

  /**
   * Create a new shield session
   */
  async createSession(
    blockedApps: BlockedApp[],
    duration: number,
    userId?: string
  ): Promise<ShieldSession> {
    const now = new Date();
    const endTime = new Date(now.getTime() + duration * 60 * 1000);

    const session: ShieldSession = {
      id: `session_${Date.now()}`,
      userId,
      blockedApps,
      duration,
      startTime: now,
      endTime,
      status: 'active',
      coinsEarned: 0,
      coinsLost: 0,
      emergencyAccessUsed: 0,
      emergencyAccessLog: [],
      safeModeEntries: [],
    };

    this.currentSession = session;
    await this.persistSession(session);
    
    return session;
  }

  /**
   * Get current active session
   */
  async getCurrentSession(): Promise<ShieldSession | null> {
    if (this.currentSession) {
      return this.currentSession;
    }

    // Try to load from storage
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const session = JSON.parse(stored) as ShieldSession;
      // Convert date strings back to Date objects
      session.startTime = new Date(session.startTime);
      session.endTime = new Date(session.endTime);
      
      // Check if session is still valid
      if (new Date() < session.endTime && session.status === 'active') {
        this.currentSession = session;
        return session;
      } else if (session.status === 'active') {
        // Session expired, mark as completed
        await this.completeSession(session.id);
      }
    }

    return null;
  }

  /**
   * Complete a session (successful finish)
   */
  async completeSession(sessionId: string): Promise<number> {
    const session = await this.getCurrentSession();
    if (!session || session.id !== sessionId) {
      throw new Error('Session not found');
    }

    const coinsEarned = 30; // Base reward
    session.status = 'completed';
    session.coinsEarned = coinsEarned;

    await this.saveToHistory(session);
    await this.clearSession();

    return coinsEarned;
  }

  /**
   * Break a session early (penalty)
   */
  async breakSession(sessionId: string): Promise<number> {
    const session = await this.getCurrentSession();
    if (!session || session.id !== sessionId) {
      throw new Error('Session not found');
    }

    const coinsLost = 50; // Penalty
    session.status = 'broken';
    session.coinsLost = coinsLost;

    await this.saveToHistory(session);
    await this.clearSession();

    return coinsLost;
  }

  /**
   * Enter safe mode (banking app opened)
   */
  async enterSafeMode(appName: string): Promise<void> {
    const session = await this.getCurrentSession();
    if (!session) return;

    const entry: SafeModeEntry = {
      appName,
      enteredAt: new Date(),
    };

    session.safeModeEntries.push(entry);
    session.status = 'safe_mode';
    await this.persistSession(session);
  }

  /**
   * Exit safe mode (banking app closed)
   */
  async exitSafeMode(): Promise<void> {
    const session = await this.getCurrentSession();
    if (!session) return;

    const lastEntry = session.safeModeEntries[session.safeModeEntries.length - 1];
    if (lastEntry && !lastEntry.exitedAt) {
      lastEntry.exitedAt = new Date();
    }

    session.status = 'active';
    await this.persistSession(session);
  }

  /**
   * Log emergency access
   */
  async logEmergencyAccess(appName: string, duration: number): Promise<void> {
    const session = await this.getCurrentSession();
    if (!session) return;

    const access: EmergencyAccess = {
      appName,
      timestamp: new Date(),
      duration,
    };

    session.emergencyAccessLog.push(access);
    session.emergencyAccessUsed++;
    await this.persistSession(session);
  }

  /**
   * Check if app is blocked in current session
   */
  async isAppBlocked(packageName: string): Promise<boolean> {
    const session = await this.getCurrentSession();
    if (!session || session.status !== 'active') {
      return false;
    }

    return session.blockedApps.some(app => app.packageName === packageName);
  }

  /**
   * Get time remaining in current session
   */
  async getTimeRemaining(): Promise<number> {
    const session = await this.getCurrentSession();
    if (!session) return 0;

    const now = new Date();
    const remaining = session.endTime.getTime() - now.getTime();
    return Math.max(0, Math.floor(remaining / 1000)); // seconds
  }

  /**
   * Remove specific app from blocked list
   */
  async removeBlockedApp(packageName: string): Promise<void> {
    const session = await this.getCurrentSession();
    if (!session) return;

    session.blockedApps = session.blockedApps.filter(
      app => app.packageName !== packageName
    );

    if (session.blockedApps.length === 0) {
      // No more apps to block, complete session
      await this.completeSession(session.id);
    } else {
      await this.persistSession(session);
    }
  }

  /**
   * Get session history
   */
  async getHistory(): Promise<ShieldSession[]> {
    const stored = await AsyncStorage.getItem(HISTORY_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored) as ShieldSession[];
    // Convert date strings back to Date objects
    return history.map(session => ({
      ...session,
      startTime: new Date(session.startTime),
      endTime: new Date(session.endTime),
    }));
  }

  /**
   * Persist session to storage
   */
  private async persistSession(session: ShieldSession): Promise<void> {
    this.currentSession = session;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  /**
   * Clear current session
   */
  private async clearSession(): Promise<void> {
    this.currentSession = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Save session to history
   */
  private async saveToHistory(session: ShieldSession): Promise<void> {
    const history = await this.getHistory();
    history.unshift(session); // Add to beginning
    
    // Keep only last 100 sessions
    const trimmed = history.slice(0, 100);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  }
}

export const shieldSessionManager = new ShieldSessionManager();
