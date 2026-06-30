// Home Store using Zustand
import { create } from 'zustand';
import {
    homeService,
    type DailyChallenge,
    type UserStats
} from '../services/homeService';
import { progressCalendarService, type ProgressCalendarMark } from '../services/progressCalendarService';
import { shieldSessionManager } from '../services/shieldSessionManager';

const applyLocalShieldCoinAdjustments = async (stats: UserStats): Promise<UserStats> => {
  const currentSession = await shieldSessionManager.getCurrentSession();
  await shieldSessionManager.consumePendingRewards();

  const history = await shieldSessionManager.getHistory();
  const earned = history.reduce((sum, session) => sum + (session.coinsEarned ?? 0), 0);
  const lost = history.reduce((sum, session) => sum + (session.coinsLost ?? 0), 0);
  const activeEarned = currentSession?.coinsEarned ?? 0;

  return {
    ...stats,
    totalFocusPoints: stats.totalFocusPoints + earned + activeEarned,
    currentFocusPoints: Math.max(0, stats.currentFocusPoints + earned + activeEarned - lost),
  };
};

const syncProgressMarks = async (userId: string, challenges: DailyChallenge[]) => {
  await progressCalendarService.syncCompletedSessions(userId);
  return progressCalendarService.syncDailyTasks(userId, challenges);
};

interface HomeState {
  // Data
  userStats: UserStats | null;
  dailyChallenges: DailyChallenge[];
  progressMarks: ProgressCalendarMark[];
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Computed
  streakInfo: {
    currentStreak: number;
    bestStreak: number;
    todayDone: boolean;
    todayStudyMinutes: number;
  } | null;

  // Actions
  loadHomeData: (userId: string) => Promise<void>;
  refreshHomeData: (userId: string) => Promise<void>;
  completeDailyChallenge: (userId: string, challengeId: string) => Promise<void>;
  markFocusSessionCompleted: (userId: string, minutes?: number) => Promise<void>;
  createCustomChallenge: (userId: string, title: string, description?: string) => Promise<void>;
  loadProgressCalendar: (userId: string) => Promise<void>;
  applyFocusCoinDelta: (currentDelta: number, totalEarnedDelta?: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  userStats: null,
  dailyChallenges: [],
  progressMarks: [],
  loading: false,
  error: null,
  streakInfo: null,
};

export const useHomeStore = create<HomeState>((set, get) => ({
  ...initialState,

  /**
   * Load all home page data
   */
  loadHomeData: async (userId: string) => {
    try {
      set({ loading: true, error: null });

      const homeData = await homeService.getHomeData(userId);
      const userStats = await applyLocalShieldCoinAdjustments(homeData.userStats);
      const progressMarks = await syncProgressMarks(userId, homeData.dailyChallenges);

      set({
        userStats,
        dailyChallenges: homeData.dailyChallenges,
        streakInfo: homeData.streakInfo,
        progressMarks,
        loading: false,
      });
    } catch (error: any) {
      console.error('Error loading home data:', error);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * Refresh home data (force reload)
   */
  refreshHomeData: async (userId: string) => {
    const { loadHomeData } = get();
    await loadHomeData(userId);
  },

  /**
   * Complete a daily directive manually
   */
  completeDailyChallenge: async (userId: string, challengeId: string) => {
    try {
      await homeService.completeDailyChallenge(userId, challengeId);
      const [homeData, progressMarks] = await Promise.all([
        homeService.getHomeData(userId),
        progressCalendarService.recordMark(userId, 'task'),
      ]);
      const userStats = await applyLocalShieldCoinAdjustments(homeData.userStats);

      set({
        userStats,
        dailyChallenges: homeData.dailyChallenges,
        streakInfo: homeData.streakInfo,
        progressMarks,
      });
    } catch (error: any) {
      console.error('Error completing daily challenge:', error);
      set({ error: error.message });
      throw error;
    }
  },

  /**
   * Mark today's calendar as completed because a focus session finished.
   * Idempotent: the day is only ever marked once, regardless of how many
   * sessions are completed in the same day.
   */
  markFocusSessionCompleted: async (userId: string, minutes = 0) => {
    try {
      const progressMarks = await progressCalendarService.recordSessionDay(
        userId,
        new Date(),
        minutes,
      );
      set({ progressMarks });
    } catch (error: any) {
      console.error('Error marking focus session on calendar:', error);
    }
  },

  /**
   * Add a custom daily directive
   */
  createCustomChallenge: async (userId: string, title: string, description?: string) => {
    try {
      await homeService.createCustomChallenge(userId, title, description);
      const homeData = await homeService.getHomeData(userId);
      const userStats = await applyLocalShieldCoinAdjustments(homeData.userStats);

      set({
        userStats,
        dailyChallenges: homeData.dailyChallenges,
        streakInfo: homeData.streakInfo,
      });
    } catch (error: any) {
      console.error('Error creating custom challenge:', error);
      set({ error: error.message });
      throw error;
    }
  },

  /**
   * Load persisted monthly progress marks
   */
  loadProgressCalendar: async (userId: string) => {
    try {
      const progressMarks = await progressCalendarService.syncCompletedSessions(userId);
      set({ progressMarks });
    } catch (error: any) {
      console.error('Error loading progress calendar:', error);
      set({ error: error.message });
    }
  },

  /**
   * Apply local Shield rewards/penalties immediately to the Home coin balance.
   * Backend-loaded stats are adjusted from Shield history on the next refresh.
   */
  applyFocusCoinDelta: (currentDelta, totalEarnedDelta = Math.max(0, currentDelta)) => {
    const { userStats } = get();
    if (!userStats) return;

    set({
      userStats: {
        ...userStats,
        totalFocusPoints: Math.max(0, userStats.totalFocusPoints + totalEarnedDelta),
        currentFocusPoints: Math.max(0, userStats.currentFocusPoints + currentDelta),
      },
    });
  },

  /**
   * Set loading state
   */
  setLoading: (loading: boolean) => set({ loading }),

  /**
   * Set error state
   */
  setError: (error: string | null) => set({ error }),

  /**
   * Reset store
   */
  reset: () => set(initialState),
}));
