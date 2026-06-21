/**
 * New Shield Store - Complete State Management
 */

import { create } from 'zustand';
import { BlockedApp, ShieldSession, shieldSessionManager } from '../services/shieldSessionManager';
import { safeModeManager } from '../services/safeModeManager';
import { Platform } from 'react-native';

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
  startSession: () => Promise<void>;
  endSession: (withPenalty: boolean) => Promise<number>;
  removeBlockedApp: (packageName: string) => Promise<void>;
  loadCurrentSession: () => Promise<void>;

  // Safe Mode
  inSafeMode: boolean;
  safeModeApp: string | null;
  enterSafeMode: (packageName: string, appName: string) => Promise<void>;
  exitSafeMode: () => Promise<void>;

  // History & Stats
  sessionHistory: ShieldSession[];
  totalCoinsEarned: number;
  totalCoinsLost: number;
  loadHistory: () => Promise<void>;

  // UI State
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useShieldStore = create<ShieldState>((set, get) => ({
  // Initial State
  selectedApps: [],
  selectedDuration: 30, // default 30 minutes
  currentSession: null,
  timeRemaining: 0,
  isSessionActive: false,
  inSafeMode: false,
  safeModeApp: null,
  sessionHistory: [],
  totalCoinsEarned: 0,
  totalCoinsLost: 0,
  isLoading: false,
  error: null,

  // App Selection Actions
  selectApp: (app) => {
    const { selectedApps } = get();
    if (!selectedApps.find((a) => a.packageName === app.packageName)) {
      set({ selectedApps: [...selectedApps, app] });
    }
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
    const { selectedApps, selectedDuration } = get();

    if (selectedApps.length === 0) {
      set({ error: 'Please select at least one app to block' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Create session
      const session = await shieldSessionManager.createSession(
        selectedApps,
        selectedDuration
      );

      // Start native blocking if Android
      if (Platform.OS === 'android') {
        const { nativeBlockingService } = require('../services/nativeBlockingService');
        const blockedAppsForNative = selectedApps.map((app) => ({
          packageName: app.packageName,
          appName: app.appName,
        }));

        await nativeBlockingService.startNativeSession(session, blockedAppsForNative);
      }

      // Update state
      set({
        currentSession: session,
        isSessionActive: true,
        timeRemaining: selectedDuration * 60,
        selectedApps: [], // Clear selection after starting
        isLoading: false,
      });

      // Start countdown timer
      startCountdownTimer();
    } catch (error: any) {
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

      if (withPenalty) {
        // Break session - lose coins
        coins = await shieldSessionManager.breakSession(currentSession.id);
        set({ totalCoinsLost: get().totalCoinsLost + coins });
      } else {
        // Complete session - earn coins
        coins = await shieldSessionManager.completeSession(currentSession.id);
        set({ totalCoinsEarned: get().totalCoinsEarned + coins });
      }

      // Stop native blocking
      if (Platform.OS === 'android') {
        const { nativeBlockingService } = require('../services/nativeBlockingService');
        nativeBlockingService.stopNativeSession();
      }

      // Clear state
      set({
        currentSession: null,
        isSessionActive: false,
        timeRemaining: 0,
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
      set({ currentSession: updatedSession });

      // If no more apps, end session
      if (!updatedSession) {
        set({
          isSessionActive: false,
          timeRemaining: 0,
        });
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  loadCurrentSession: async () => {
    try {
      const session = await shieldSessionManager.getCurrentSession();
      if (session) {
        const remaining = await shieldSessionManager.getTimeRemaining();
        set({
          currentSession: session,
          isSessionActive: true,
          timeRemaining: remaining,
        });

        // Start countdown timer
        startCountdownTimer();
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

  exitSafeMode: async () => {
    await safeModeManager.exitSafeMode();
    set({
      inSafeMode: false,
      safeModeApp: null,
    });
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
}));

// Helper: Countdown Timer
let countdownInterval: NodeJS.Timeout | null = null;

function startCountdownTimer() {
  // Clear existing timer
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  // Start new timer
  countdownInterval = setInterval(async () => {
    const { currentSession, timeRemaining } = useShieldStore.getState();

    if (!currentSession || timeRemaining <= 0) {
      // Session ended
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }

      // Auto-complete if time is up
      if (currentSession && timeRemaining <= 0) {
        await useShieldStore.getState().endSession(false);
      }
      return;
    }

    // Decrement time
    useShieldStore.setState({ timeRemaining: timeRemaining - 1 });
  }, 1000);
}

// Export for cleanup
export function stopCountdownTimer() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}
