// Home Store using Zustand
import { create } from 'zustand';
import {
    homeService,
    type ChallengeHistory,
    type DailyChallenge,
    type PetStatus,
    type UserStats
} from '../services/homeService';

interface HomeState {
  // Data
  userStats: UserStats | null;
  petStatus: PetStatus | null;
  dailyChallenges: DailyChallenge[];
  challengeHistory: ChallengeHistory[];
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Computed
  streakInfo: {
    currentStreak: number;
    bestStreak: number;
    todayDone: boolean;
  } | null;

  // Actions
  loadHomeData: (userId: string) => Promise<void>;
  refreshHomeData: (userId: string) => Promise<void>;
  updateStats: (updates: Partial<UserStats>) => void;
  awardRewards: (userId: string, fp: number, xp: number) => Promise<void>;
  recordSession: (userId: string, duration: number, fp: number, xp: number) => Promise<void>;
  updateChallengeProgress: (userId: string, type: string, amount: number) => Promise<void>;
  loadChallengeHistory: (userId: string, days?: number) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  userStats: null,
  petStatus: null,
  dailyChallenges: [],
  challengeHistory: [],
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

      set({
        userStats: homeData.userStats,
        petStatus: homeData.petStatus,
        dailyChallenges: homeData.dailyChallenges,
        streakInfo: homeData.streakInfo,
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
   * Update user stats locally
   */
  updateStats: (updates: Partial<UserStats>) => {
    const { userStats } = get();
    if (userStats) {
      set({ userStats: { ...userStats, ...updates } });
    }
  },

  /**
   * Award Focus Points and XP
   */
  awardRewards: async (userId: string, fp: number, xp: number) => {
    try {
      await homeService.awardRewards(userId, fp, xp);
      
      // Reload stats to get updated values
      const stats = await homeService.getUserStats(userId);
      set({ userStats: stats });
    } catch (error: any) {
      console.error('Error awarding rewards:', error);
      set({ error: error.message });
    }
  },

  /**
   * Record session completion
   */
  recordSession: async (userId: string, duration: number, fp: number, xp: number) => {
    try {
      set({ loading: true });

      await homeService.recordSessionCompletion(userId, duration, fp, xp);

      // Just reload home data once, as it contains everything (stats, pet, challenges)
      const homeData = await homeService.getHomeData(userId);

      set({
        userStats: homeData.userStats,
        petStatus: homeData.petStatus,
        dailyChallenges: homeData.dailyChallenges,
        streakInfo: homeData.streakInfo,
        loading: false,
      });
    } catch (error: any) {
      console.error('Error recording session:', error);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * Update challenge progress
   */
  updateChallengeProgress: async (userId: string, type: string, amount: number) => {
    try {
      await homeService.updateChallengeProgress(userId, type, amount);

      // Reload challenges
      const challenges = await homeService.getDailyChallenges(userId);
      set({ dailyChallenges: challenges });
    } catch (error: any) {
      console.error('Error updating challenge progress:', error);
      set({ error: error.message });
    }
  },

  /**
   * Load challenge history
   */
  loadChallengeHistory: async (userId: string, days: number = 7) => {
    try {
      const history = await homeService.getChallengeHistory(userId, days);
      set({ challengeHistory: history });
    } catch (error: any) {
      console.error('Error loading challenge history:', error);
      set({ error: error.message });
    }
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
