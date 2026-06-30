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
  appSessionId?: string;
  sessionStartedAt?: Date;
  sessionEndsAt?: Date;
  sessionDuration?: number; // minutes
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
  completedApps?: BlockedApp[];
}

export interface ShieldReward {
  id: string;
  sessionId: string;
  coins: number;
  appCount: number;
  duration: number;
  completedAt: Date;
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

export const SHIELD_COINS_PER_BLOCKED_APP = 30;
export const SHIELD_BREAK_PENALTY_COINS = 50;

const STORAGE_KEY = '@shield_session';
const HISTORY_KEY = '@shield_history';
const PENDING_REWARDS_KEY = '@shield_pending_rewards';
const ACTIVE_SESSION_STATUSES: ShieldSession['status'][] = ['active', 'safe_mode'];

export function calculateShieldReward(appCount: number): number {
  return Math.max(0, appCount) * SHIELD_COINS_PER_BLOCKED_APP;
}

export function getBlockedAppTimeRemaining(
  app: BlockedApp,
  fallbackEndTime?: Date,
  now = new Date(),
): number {
  const endTime = app.sessionEndsAt ?? fallbackEndTime;
  if (!endTime) return 0;

  return Math.max(0, Math.floor((new Date(endTime).getTime() - now.getTime()) / 1000));
}

export function getShieldSessionTimeRemaining(session: ShieldSession, now = new Date()): number {
  if (session.blockedApps.length === 0) return 0;

  return Math.max(
    ...session.blockedApps.map((app) => getBlockedAppTimeRemaining(app, session.endTime, now)),
  );
}

class ShieldSessionManager {
  private currentSession: ShieldSession | null = null;

  /**
   * Create a new shield session
   */
  async createSession(
    blockedApps: BlockedApp[],
    duration: number,
    userId?: string,
    appLimit?: number | null
  ): Promise<ShieldSession> {
    this.assertWithinLimit(blockedApps.length, appLimit);

    const now = new Date();
    const sessionApps = this.createAppSessions(blockedApps, now, duration);
    const endTime = this.getLatestEndTime(sessionApps) ?? new Date(now.getTime() + duration * 60 * 1000);

    const session: ShieldSession = {
      id: `session_${Date.now()}`,
      userId,
      blockedApps: sessionApps,
      duration,
      startTime: now,
      endTime,
      status: 'active',
      coinsEarned: 0,
      coinsLost: 0,
      emergencyAccessUsed: 0,
      emergencyAccessLog: [],
      safeModeEntries: [],
      completedApps: [],
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
      return this.refreshActiveSession(this.currentSession);
    }

    // Try to load from storage
    const session = await this.loadStoredSession();
    if (session) {
      return this.refreshActiveSession(session);
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

    const activeApps = [...session.blockedApps];
    const coinsEarned = calculateShieldReward(activeApps.length);
    session.status = 'completed';
    session.endTime = new Date();
    session.coinsEarned = (session.coinsEarned ?? 0) + coinsEarned;
    session.completedApps = [
      ...(session.completedApps ?? []),
      ...activeApps,
    ];
    session.blockedApps = [];

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

    const coinsLost = SHIELD_BREAK_PENALTY_COINS;
    session.status = 'broken';
    session.coinsLost = coinsLost;
    session.endTime = new Date();

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
    if (!session || !ACTIVE_SESSION_STATUSES.includes(session.status)) {
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

    return getShieldSessionTimeRemaining(session); // seconds
  }

  /**
   * Add more apps to the blocked list of the current active session.
   * Skips apps that are already blocked (dedup by packageName).
   * Returns the updated session, or null if there is no active session.
   */
  async addBlockedApps(
    apps: BlockedApp[],
    duration?: number,
    appLimit?: number | null,
  ): Promise<ShieldSession | null> {
    const session = await this.getCurrentSession();
    if (!session) return null;

    const existing = new Set(session.blockedApps.map((app) => app.packageName));
    const newApps = apps.filter((app) => !existing.has(app.packageName));

    this.assertWithinLimit(session.blockedApps.length + newApps.length, appLimit);

    if (newApps.length === 0) {
      return session;
    }

    const now = new Date();
    const appDuration = duration ?? session.duration;
    const newAppSessions = this.createAppSessions(newApps, now, appDuration);

    session.blockedApps = [...session.blockedApps, ...newAppSessions];
    session.endTime = this.getLatestEndTime(session.blockedApps) ?? session.endTime;
    await this.persistSession(session);

    return session;
  }

  /**
   * Apply a downgraded subscription limit to an active session.
   * Keeps the earliest selected apps and returns the updated session.
   */
  async enforceAppLimit(appLimit: number | null): Promise<ShieldSession | null> {
    const session = await this.getCurrentSession();
    if (!session || appLimit === null || session.blockedApps.length <= appLimit) {
      return session;
    }

    session.blockedApps = session.blockedApps.slice(0, appLimit);
    session.endTime = this.getLatestEndTime(session.blockedApps) ?? session.endTime;

    if (session.blockedApps.length === 0) {
      await this.completeSession(session.id);
      return null;
    }

    await this.persistSession(session);
    return session;
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
      await this.finalizeSessionAfterManualRemoval(session);
    } else {
      session.endTime = this.getLatestEndTime(session.blockedApps) ?? session.endTime;
      await this.persistSession(session);
    }
  }

  /**
   * Abort current session without saving or penalizing
   */
  async abortSession(): Promise<void> {
    this.currentSession = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Get session history
   */
  async getHistory(): Promise<ShieldSession[]> {
    const stored = await AsyncStorage.getItem(HISTORY_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored) as ShieldSession[];
    // Convert date strings back to Date objects
    return history.map(session => this.reviveSession(session));
  }

  async consumePendingRewards(): Promise<ShieldReward[]> {
    const stored = await AsyncStorage.getItem(PENDING_REWARDS_KEY);
    if (!stored) return [];

    await AsyncStorage.removeItem(PENDING_REWARDS_KEY);

    return (JSON.parse(stored) as ShieldReward[]).map((reward) => ({
      ...reward,
      completedAt: new Date(reward.completedAt),
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

  /**
   * Load session from storage without applying active/expired side effects.
   */
  private async loadStoredSession(): Promise<ShieldSession | null> {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    return this.reviveSession(JSON.parse(stored) as ShieldSession);
  }

  /**
   * Convert persisted date strings back to Date objects.
   */
  private reviveSession(session: ShieldSession): ShieldSession {
    return {
      ...session,
      startTime: new Date(session.startTime),
      endTime: new Date(session.endTime),
      emergencyAccessLog: (session.emergencyAccessLog ?? []).map((entry) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      })),
      safeModeEntries: (session.safeModeEntries ?? []).map((entry) => ({
        ...entry,
        enteredAt: new Date(entry.enteredAt),
        exitedAt: entry.exitedAt ? new Date(entry.exitedAt) : undefined,
      })),
      blockedApps: (session.blockedApps ?? []).map((app) => this.reviveBlockedApp(app)),
      completedApps: (session.completedApps ?? []).map((app) => this.reviveBlockedApp(app)),
    };
  }

  private reviveBlockedApp(app: BlockedApp): BlockedApp {
    return {
      ...app,
      sessionStartedAt: app.sessionStartedAt ? new Date(app.sessionStartedAt) : undefined,
      sessionEndsAt: app.sessionEndsAt ? new Date(app.sessionEndsAt) : undefined,
    };
  }

  private async refreshActiveSession(session: ShieldSession): Promise<ShieldSession | null> {
    const revivedSession = this.reviveSession(session);

    if (!ACTIVE_SESSION_STATUSES.includes(revivedSession.status)) {
      return null;
    }

    return this.completeExpiredApps(revivedSession);
  }

  private async completeExpiredApps(session: ShieldSession): Promise<ShieldSession | null> {
    const now = new Date();
    const activeApps: BlockedApp[] = [];
    const completedApps: BlockedApp[] = [];

    session.blockedApps.forEach((app) => {
      if (this.isAppStillActive(app, session, now)) {
        activeApps.push(app);
      } else {
        completedApps.push(app);
      }
    });

    if (completedApps.length === 0) {
      this.currentSession = session;
      return session;
    }

    if (completedApps.length > 0) {
      const coins = calculateShieldReward(completedApps.length);

      session.coinsEarned = (session.coinsEarned ?? 0) + coins;
      session.completedApps = [
        ...(session.completedApps ?? []),
        ...completedApps,
      ];
      session.blockedApps = activeApps;

      await this.queuePendingReward({
        id: `reward_${session.id}_${now.getTime()}_${completedApps.length}`,
        sessionId: session.id,
        coins,
        appCount: completedApps.length,
        duration: this.getRewardDuration(completedApps, session.duration),
        completedAt: now,
      });
    }

    if (session.blockedApps.length === 0) {
      session.status = 'completed';
      session.endTime = now;
      await this.saveToHistory(session);
      await this.clearSession();
      return null;
    }

    session.endTime = this.getLatestEndTime(session.blockedApps) ?? session.endTime;
    await this.persistSession(session);

    return session;
  }

  private isAppStillActive(app: BlockedApp, session: ShieldSession, now = new Date()): boolean {
    const endTime = app.sessionEndsAt ?? session.endTime;
    return now < endTime;
  }

  private createAppSessions(apps: BlockedApp[], startTime: Date, duration: number): BlockedApp[] {
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    return apps.map((app, index) => ({
      ...app,
      appSessionId: `app_session_${startTime.getTime()}_${index}_${app.packageName}`,
      sessionStartedAt: startTime,
      sessionEndsAt: endTime,
      sessionDuration: duration,
    }));
  }

  private getLatestEndTime(apps: BlockedApp[]): Date | null {
    if (apps.length === 0) return null;

    return apps.reduce<Date | null>((latest, app) => {
      if (!app.sessionEndsAt) return latest;
      if (!latest || app.sessionEndsAt > latest) return app.sessionEndsAt;
      return latest;
    }, null);
  }

  private getRewardDuration(apps: BlockedApp[], fallbackDuration: number): number {
    const durations = apps
      .map((app) => app.sessionDuration)
      .filter((duration): duration is number => typeof duration === 'number' && duration > 0);

    return durations.length > 0 ? Math.max(...durations) : fallbackDuration;
  }

  private async finalizeSessionAfterManualRemoval(session: ShieldSession): Promise<void> {
    session.endTime = new Date();
    session.status = (session.coinsEarned ?? 0) > 0 ? 'completed' : 'broken';

    await this.saveToHistory(session);
    await this.clearSession();
  }

  private async queuePendingReward(reward: ShieldReward): Promise<void> {
    if (reward.coins <= 0) return;

    const stored = await AsyncStorage.getItem(PENDING_REWARDS_KEY);
    const rewards = stored ? JSON.parse(stored) as ShieldReward[] : [];
    rewards.push(reward);

    await AsyncStorage.setItem(PENDING_REWARDS_KEY, JSON.stringify(rewards));
  }

  private assertWithinLimit(appCount: number, appLimit?: number | null): void {
    if (appLimit === undefined || appLimit === null) return;

    if (appCount > appLimit) {
      throw new Error(`Your current plan allows blocking up to ${appLimit} apps at the same time.`);
    }
  }
}

export const shieldSessionManager = new ShieldSessionManager();
