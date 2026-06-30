/**
 * New Shield Store - Complete State Management
 */

import { create } from 'zustand';
import {
  BlockedApp,
  ShieldReward,
  ShieldSession,
  getShieldSessionTimeRemaining,
  shieldSessionManager,
} from '../services/shieldSessionManager';
import { safeModeManager } from '../services/safeModeManager';
import { nativeBlockingService } from '../services/nativeBlockingService';
import { Platform } from 'react-native';
import {
  DEFAULT_SUBSCRIPTION,
  SubscriptionState,
  subscriptionService,
} from '../services/subscriptionService';
import { useHomeStore } from './homeStore';

/**
 * Maximum number of apps a free user can block at the same time.
 * Blocking more than this requires a premium upgrade.
 */
export const FREE_APP_LIMIT = 2;
export const BASIC_APP_LIMIT = 4;

type PremiumModalReason = 'limit' | 'suggestion';

export interface ShieldCompletionSummary {
  coins: number;
  duration: number;
  appCount: number;
  completedAt: Date;
}

interface ShieldState {
  // App Selection
  selectedApps: BlockedApp[];
  selectApp: (app: BlockedApp) => void;
  deselectApp: (packageName: string) => void;
  clearSelection: () => void;
  isAppSelected: (packageName: string) => boolean;

  // Duration
  selectedDuration: number; // minutes
  setDuration: (minutes: number) => void;

  // Session
  currentSession: ShieldSession | null;
  timeRemaining: number; // seconds
  isSessionActive: boolean;
  lastCompletedReward: ShieldCompletionSummary | null;
  startSession: () => Promise<void>;
  endSession: (withPenalty: boolean) => Promise<number>;
  removeBlockedApp: (packageName: string) => Promise<void>;
  addAppsToSession: () => Promise<void>;
  loadCurrentSession: () => Promise<void>;
  clearCompletedReward: () => void;

  // Safe Mode
  inSafeMode: boolean;
  safeModeApp: string | null;
  enterSafeMode: (packageName: string, appName: string) => Promise<void>;
  exitSafeMode: (options?: { resumeNative?: boolean }) => Promise<void>;
  clearSafeModeState: () => void;

  // History & Stats
  sessionHistory: ShieldSession[];
  totalCoinsEarned: number;
  totalCoinsLost: number;
  loadHistory: () => Promise<void>;

  // UI State
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;

  // Premium
  showPremiumModal: boolean;
  premiumModalReason: PremiumModalReason;
  subscription: SubscriptionState;
  currentAppLimit: number | null;
  loadSubscription: () => Promise<void>;
  syncSubscription: () => Promise<void>;
  setSubscription: (subscription: SubscriptionState) => Promise<void>;
  setShowPremiumModal: (show: boolean) => void;
  openPremiumModal: (reason?: PremiumModalReason) => void;
}

export const useShieldStore = create<ShieldState>((set, get) => ({
  // Initial State
  selectedApps: [],
  selectedDuration: 30, // default 30 minutes
  currentSession: null,
  timeRemaining: 0,
  isSessionActive: false,
  lastCompletedReward: null,
  inSafeMode: false,
  safeModeApp: null,
  sessionHistory: [],
  totalCoinsEarned: 0,
  totalCoinsLost: 0,
  isLoading: false,
  error: null,
  showPremiumModal: false,
  premiumModalReason: 'limit',
  subscription: DEFAULT_SUBSCRIPTION,
  currentAppLimit: FREE_APP_LIMIT,

  // App Selection Actions
  selectApp: (app) => {
    const { selectedApps, currentSession, currentAppLimit } = get();

    // Already selected - nothing to do
    if (selectedApps.find((a) => a.packageName === app.packageName)) {
      return;
    }

    const alreadyBlocked = currentSession?.blockedApps.length ?? 0;
    const nextCount = alreadyBlocked + selectedApps.length + 1;

    if (isOverLimit(nextCount, currentAppLimit)) {
      set({ showPremiumModal: true, premiumModalReason: 'limit' });
      return;
    }

    set({ selectedApps: [...selectedApps, app] });
  },

  deselectApp: (packageName) => {
    set({
      selectedApps: get().selectedApps.filter((a) => a.packageName !== packageName),
    });
  },

  clearSelection: () => {
    set({ selectedApps: [] });
  },

  isAppSelected: (packageName) => {
    return get().selectedApps.some((a) => a.packageName === packageName);
  },

  // Duration Actions
  setDuration: (minutes) => {
    set({ selectedDuration: minutes });
  },

  // Session Actions
  startSession: async () => {
    const { selectedApps, selectedDuration, currentAppLimit } = get();

    if (selectedApps.length === 0) {
      set({ error: 'Please select at least one app to block' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const appsToBlock = await filterSensitiveApps(selectedApps);

      if (appsToBlock.length === 0) {
        set({
          error: 'Selected banking, payment, wallet, or OTP apps are always allowed for safety.',
          isLoading: false,
        });
        return;
      }

      if (isOverLimit(appsToBlock.length, currentAppLimit)) {
        set({
          showPremiumModal: true,
          premiumModalReason: 'limit',
          isLoading: false,
        });
        return;
      }

      // Create session
      const session = await shieldSessionManager.createSession(
        appsToBlock,
        selectedDuration,
        undefined,
        currentAppLimit
      );

      // Start native blocking if Android
      if (Platform.OS === 'android') {
        const started = await nativeBlockingService.startNativeSession(
          session,
          toNativeBlockedApps(session),
        );
        if (!started) {
          await shieldSessionManager.abortSession();
          set({
            error: 'Failed to start Focus Protection. Please enable Accessibility permission and try again.',
            isLoading: false,
          });
          return;
        }
      }

      // Update state
      set({
        currentSession: session,
        isSessionActive: true,
        timeRemaining: getShieldSessionTimeRemaining(session),
        lastCompletedReward: null,
        selectedApps: [], // Clear selection after starting
        isLoading: false,
      });

      // Start countdown timer
      startCountdownTimer();
    } catch (error: any) {
      await shieldSessionManager.abortSession();
      set({
        error: error.message || 'Failed to start session',
        isLoading: false,
      });
    }
  },

  endSession: async (withPenalty) => {
    const { currentSession } = get();
    if (!currentSession) return 0;

    set({ isLoading: true });

    try {
      let coins = 0;
      let pendingRewards: ShieldReward[] = [];

      if (withPenalty) {
        // Break session - lose coins
        try {
          coins = await shieldSessionManager.breakSession(currentSession.id);
          set({ totalCoinsLost: get().totalCoinsLost + coins });
          applyHomeCoinDelta(-coins, 0);
        } catch (error) {
          pendingRewards = await shieldSessionManager.consumePendingRewards();
          if (pendingRewards.length === 0) {
            throw error;
          }
        }
      } else {
        // Complete session - earn coins
        try {
          coins = await shieldSessionManager.completeSession(currentSession.id);
          applyHomeCoinDelta(coins, coins);
        } catch (error) {
          pendingRewards = await shieldSessionManager.consumePendingRewards();
          if (pendingRewards.length === 0) {
            throw error;
          }
        }
      }

      if (pendingRewards.length === 0) {
        pendingRewards = await shieldSessionManager.consumePendingRewards();
      }
      const pendingSummary = pendingRewards.length > 0 ? summarizeRewards(pendingRewards) : null;

      if (pendingSummary) {
        applyHomeCoinDelta(pendingSummary.coins, pendingSummary.coins);
      }

      const completedCoins = coins + (pendingSummary?.coins ?? 0);
      const completedAppCount = currentSession.blockedApps.length + (pendingSummary?.appCount ?? 0);
      const completedDuration = Math.max(
        getCompletionDuration(currentSession.blockedApps, currentSession.duration),
        pendingSummary?.duration ?? 0,
      );

      // Stop native blocking
      if (Platform.OS === 'android') {
        await nativeBlockingService.stopNativeSession();
      }

      // Clear state
      set({
        totalCoinsEarned: get().totalCoinsEarned + (withPenalty ? pendingSummary?.coins ?? 0 : completedCoins),
        currentSession: null,
        isSessionActive: false,
        timeRemaining: 0,
        lastCompletedReward: !withPenalty && completedCoins > 0
          ? {
              coins: completedCoins,
              appCount: completedAppCount,
              duration: completedDuration,
              completedAt: new Date(),
            }
          : null,
        isLoading: false,
      });

      // Reload history
      await get().loadHistory();

      return coins;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to end session',
        isLoading: false,
      });
      return 0;
    }
  },

  removeBlockedApp: async (packageName) => {
    const { currentSession } = get();
    if (!currentSession) return;

    try {
      await shieldSessionManager.removeBlockedApp(packageName);

      // Update local state
      const updatedSession = await shieldSessionManager.getCurrentSession();
      await applyPendingRewards(updatedSession, false);
      set({
        currentSession: updatedSession,
        timeRemaining: updatedSession ? getShieldSessionTimeRemaining(updatedSession) : 0,
      });

      // If no more apps, end session
      if (!updatedSession) {
        if (Platform.OS === 'android') {
          await nativeBlockingService.stopNativeSession();
        }
        set({
          isSessionActive: false,
          timeRemaining: 0,
        });
      } else if (Platform.OS === 'android') {
        await nativeBlockingService.startNativeSession(
          updatedSession,
          toNativeBlockedApps(updatedSession),
        );
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addAppsToSession: async () => {
    const { selectedApps, selectedDuration, currentSession, currentAppLimit } = get();
    if (!currentSession) return;

    if (selectedApps.length === 0) {
      set({ error: 'Please select at least one app to add' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const appsToAdd = await filterSensitiveApps(selectedApps);

      if (appsToAdd.length === 0) {
        set({
          error: 'Selected banking, payment, wallet, or OTP apps are always allowed for safety.',
          isLoading: false,
        });
        return;
      }

      const refreshedSession = await shieldSessionManager.getCurrentSession();
      await applyPendingRewards(refreshedSession, false);

      if (!refreshedSession) {
        set({
          currentSession: null,
          isSessionActive: false,
          timeRemaining: 0,
          selectedApps: [],
          isLoading: false,
        });
        return;
      }

      const existingPackages = new Set(refreshedSession.blockedApps.map((app) => app.packageName));
      const newAppsCount = appsToAdd.filter((app) => !existingPackages.has(app.packageName)).length;

      if (isOverLimit(refreshedSession.blockedApps.length + newAppsCount, currentAppLimit)) {
        set({
          showPremiumModal: true,
          premiumModalReason: 'limit',
          isLoading: false,
        });
        return;
      }

      const updatedSession = await shieldSessionManager.addBlockedApps(
        appsToAdd,
        selectedDuration,
        currentAppLimit,
      );

      // Restart native blocking with the full updated app list
      if (Platform.OS === 'android' && updatedSession) {
        await nativeBlockingService.startNativeSession(
          updatedSession,
          toNativeBlockedApps(updatedSession),
        );
      }

      set({
        currentSession: updatedSession,
        timeRemaining: updatedSession ? getShieldSessionTimeRemaining(updatedSession) : 0,
        lastCompletedReward: null,
        selectedApps: [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to add apps to session',
        isLoading: false,
      });
    }
  },

  loadCurrentSession: async () => {
    try {
      const { currentAppLimit } = get();
      const session = await shieldSessionManager.enforceAppLimit(currentAppLimit);
      await applyPendingRewards(session, true);
      if (session) {
        const remaining = getShieldSessionTimeRemaining(session);
        set({
          currentSession: session,
          isSessionActive: true,
          timeRemaining: remaining,
        });

        // Start countdown timer
        startCountdownTimer();

        // Restore native blocking on app restart
        if (Platform.OS === 'android') {
          try {
            await nativeBlockingService.startNativeSession(session, toNativeBlockedApps(session), true);
          } catch (e) {
            console.warn('Failed to restart native blocking after app restart:', e);
          }
        }
      } else {
        set({
          currentSession: null,
          isSessionActive: false,
          timeRemaining: 0,
        });

        if (Platform.OS === 'android') {
          await nativeBlockingService.stopNativeSession();
        }
      }
    } catch (error: any) {
      console.error('Failed to load session:', error);
    }
  },

  // Safe Mode Actions
  enterSafeMode: async (packageName, appName) => {
    await safeModeManager.enterSafeMode(packageName, appName);
    set({
      inSafeMode: true,
      safeModeApp: appName,
    });
  },

  exitSafeMode: async (options) => {
    await safeModeManager.exitSafeMode(options);
    set({
      inSafeMode: false,
      safeModeApp: null,
    });
  },

  clearSafeModeState: () => {
    safeModeManager.clearSafeModeState();
    set({
      inSafeMode: false,
      safeModeApp: null,
    });
  },

  clearCompletedReward: () => {
    set({ lastCompletedReward: null });
  },

  // History Actions
  loadHistory: async () => {
    try {
      const history = await shieldSessionManager.getHistory();
      
      // Calculate total coins
      const earned = history.reduce((sum, s) => sum + s.coinsEarned, 0);
      const lost = history.reduce((sum, s) => sum + s.coinsLost, 0);

      set({
        sessionHistory: history,
        totalCoinsEarned: earned,
        totalCoinsLost: lost,
      });
    } catch (error: any) {
      console.error('Failed to load history:', error);
    }
  },

  // Error Actions
  setError: (error) => {
    set({ error });
  },

  // Premium Actions
  loadSubscription: async () => {
    const subscription = await subscriptionService.loadLocal();
    const trimmedSession = await shieldSessionManager.enforceAppLimit(subscription.appLimit);

    set({
      subscription,
      currentAppLimit: subscription.appLimit,
      currentSession: trimmedSession,
      isSessionActive: !!trimmedSession,
      timeRemaining: trimmedSession ? getShieldSessionTimeRemaining(trimmedSession) : 0,
    });
  },

  syncSubscription: async () => {
    try {
      const subscription = await subscriptionService.syncFromBackend();
      await get().setSubscription(subscription);
    } catch (error) {
      console.warn('Failed to sync subscription:', error);
      await get().loadSubscription();
    }
  },

  setSubscription: async (subscription) => {
    const effectiveSubscription = await subscriptionService.saveLocal(subscription);
    const trimmedSession = await shieldSessionManager.enforceAppLimit(effectiveSubscription.appLimit);
    await applyPendingRewards(trimmedSession, false);

    set({
      subscription: effectiveSubscription,
      currentAppLimit: effectiveSubscription.appLimit,
      currentSession: trimmedSession,
      isSessionActive: !!trimmedSession,
      timeRemaining: trimmedSession ? getShieldSessionTimeRemaining(trimmedSession) : 0,
    });

    if (trimmedSession && Platform.OS === 'android') {
      await nativeBlockingService.startNativeSession(trimmedSession, toNativeBlockedApps(trimmedSession));
    }
  },

  setShowPremiumModal: (show) => {
    set({ showPremiumModal: show });
  },

  openPremiumModal: (reason = 'limit') => {
    set({ showPremiumModal: true, premiumModalReason: reason });
  },
}));

// Helper: Countdown Timer
let countdownInterval: ReturnType<typeof setInterval> | null = null;

function startCountdownTimer() {
  // Clear existing timer
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  // Start new timer
  countdownInterval = setInterval(async () => {
    const { currentSession } = useShieldStore.getState();

    if (!currentSession) {
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
      return;
    }

    const updatedSession = await shieldSessionManager.getCurrentSession();
    await applyPendingRewards(updatedSession, true);

    if (!updatedSession) {
      if (Platform.OS === 'android') {
        await nativeBlockingService.stopNativeSession();
      }

      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }

      useShieldStore.setState({
        currentSession: null,
        isSessionActive: false,
        timeRemaining: 0,
      });
      return;
    }

    useShieldStore.setState({
      currentSession: updatedSession,
      isSessionActive: true,
      timeRemaining: getShieldSessionTimeRemaining(updatedSession),
    });
  }, 1000);
}

// Export for cleanup
export function stopCountdownTimer() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

async function filterSensitiveApps(apps: BlockedApp[]): Promise<BlockedApp[]> {
  if (Platform.OS !== 'android') return apps;

  try {
    return (
      await Promise.all(
        apps.map(async (app) => ({
          app,
          sensitive: await nativeBlockingService.isSensitiveApp(app.packageName),
        })),
      )
    )
      .filter(({ sensitive }) => !sensitive)
      .map(({ app }) => app);
  } catch (error) {
    console.warn('Failed to filter sensitive apps before blocking:', error);
    return apps;
  }
}

async function applyPendingRewards(
  activeSession: ShieldSession | null,
  showCompletion: boolean,
): Promise<void> {
  const rewards = await shieldSessionManager.consumePendingRewards();
  if (rewards.length === 0) return;

  const summary = summarizeRewards(rewards);

  applyHomeCoinDelta(summary.coins, summary.coins);

  const history = await shieldSessionManager.getHistory();
  const historyEarned = history.reduce((sum, session) => sum + (session.coinsEarned ?? 0), 0);
  const historyLost = history.reduce((sum, session) => sum + (session.coinsLost ?? 0), 0);

  useShieldStore.setState({
    totalCoinsEarned: historyEarned + (activeSession?.coinsEarned ?? 0),
    totalCoinsLost: historyLost,
    lastCompletedReward: showCompletion ? summary : useShieldStore.getState().lastCompletedReward,
  });
}

function summarizeRewards(rewards: ShieldReward[]): ShieldCompletionSummary {
  return {
    coins: rewards.reduce((sum, reward) => sum + reward.coins, 0),
    appCount: rewards.reduce((sum, reward) => sum + reward.appCount, 0),
    duration: Math.max(...rewards.map((reward) => reward.duration)),
    completedAt: new Date(Math.max(...rewards.map((reward) => reward.completedAt.getTime()))),
  };
}

function applyHomeCoinDelta(currentDelta: number, totalEarnedDelta = Math.max(0, currentDelta)): void {
  useHomeStore.getState().applyFocusCoinDelta(currentDelta, totalEarnedDelta);
}

function getCompletionDuration(apps: BlockedApp[], fallbackDuration: number): number {
  const durations = apps
    .map((app) => app.sessionDuration)
    .filter((duration): duration is number => typeof duration === 'number' && duration > 0);

  return durations.length > 0 ? Math.max(...durations) : fallbackDuration;
}

function toNativeBlockedApps(session: ShieldSession) {
  return session.blockedApps.map((app) => ({
    packageName: app.packageName,
    appName: app.appName,
    sessionStartedAt: app.sessionStartedAt?.getTime(),
    sessionEndsAt: app.sessionEndsAt?.getTime(),
    sessionDuration: app.sessionDuration,
  }));
}

function isOverLimit(appCount: number, appLimit: number | null): boolean {
  return appLimit !== null && appCount > appLimit;
}
