// Home Service - Main data service for home page (Backend API Integration)
import { apiCall } from '../config/api';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface UserStats {
  userId: string;
  
  // Focus Points & Level (Max 100 levels)
  totalFocusPoints: number;     // Total FP earned (never decreases)
  currentFocusPoints: number;   // Current FP balance (can be spent)
  currentLevel: number;         // 1-100
  totalXP: number;              // Total experience points
  xpToNextLevel: number;        // XP needed for next level
  levelProgress: number;        // Percentage to next level (0-100)
  
  // Sessions
  totalSessions: number;        // Total focus sessions completed
  totalMinutes: number;         // Total minutes focused
  totalDeepWorkHours: number;   // Hours in deep work (90+ min sessions)
  averageSessionLength: number; // Average session duration
  
  // Streaks
  currentStreak: number;        // Current daily streak
  bestStreak: number;           // Best streak ever
  lastSessionDate: string;      // ISO date string (YYYY-MM-DD)
  streakUpdatedAt: Date;
  
  // Achievement
  achievementLevel: string;     // "Novice I", "Apprentice III", etc.
  achievementName: string;      // "Beginner", "Focused Student", etc.
  achievementTier: number;      // 1-10
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface PetStatus {
  userId: string;
  
  // Pet Stats
  mood: 'optimal' | 'happy' | 'tired' | 'sad';
  loyalty: number;              // 0-100
  health: number;               // 0-100
  energy: number;               // 0-100
  
  // Pet Info
  name: string;
  type: string;
  level: number;
  
  // Last Interaction
  lastFed: Date;
  lastPlayed: Date;
  
  updatedAt: Date;
}

export interface DailyChallenge {
  id: string;
  userId: string;
  
  // Challenge Info
  title: string;
  description: string;
  type: 'session' | 'time' | 'streak' | 'blocking' | 'deep-work';
  
  // Progress
  progress: number;
  total: number;
  unit: string;                 // 'm' (minutes), 'c' (cycles), 'h' (hours)
  completed: boolean;
  
  // Rewards
  rewardFP: number;             // Focus Points reward
  rewardXP: number;             // XP reward
  
  // Metadata
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  
  // Timestamps
  date: string;                 // ISO date (YYYY-MM-DD)
  createdAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

export interface ChallengeHistory {
  id: string;
  userId: string;
  date: string;                 // ISO date
  challengesCompleted: number;
  totalChallenges: number;
  fpEarned: number;
  xpEarned: number;
  challenges: DailyChallenge[];
  createdAt: Date;
}

export interface HomeData {
  userStats: UserStats;
  petStatus: PetStatus;
  dailyChallenges: DailyChallenge[];
  streakInfo: {
    currentStreak: number;
    bestStreak: number;
    todayDone: boolean;
  };
}

// ═══════════════════════════════════════════════════════════
// LEVEL SYSTEM (100 Levels Max)
// ═══════════════════════════════════════════════════════════

const MAX_LEVEL = 100;

// XP required for each level (exponential growth, capped at 100)
function getXPForLevel(level: number): number {
  if (level >= MAX_LEVEL) return 0;
  // Exponential formula: 100 * 1.5^(level-1)
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Calculate level from total XP
export function calculateLevel(totalXP: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
  xpToNextLevel: number;
} {
  let level = 1;
  let xpAccumulated = 0;
  
  // Find current level
  while (level < MAX_LEVEL && totalXP >= xpAccumulated + getXPForLevel(level)) {
    xpAccumulated += getXPForLevel(level);
    level++;
  }
  
  // If max level reached
  if (level >= MAX_LEVEL) {
    return {
      level: MAX_LEVEL,
      currentLevelXP: 0,
      nextLevelXP: 0,
      progress: 100,
      xpToNextLevel: 0,
    };
  }
  
  const xpInCurrentLevel = totalXP - xpAccumulated;
  const xpForNextLevel = getXPForLevel(level);
  const progress = Math.min(100, (xpInCurrentLevel / xpForNextLevel) * 100);
  const xpToNextLevel = xpForNextLevel - xpInCurrentLevel;
  
  return {
    level,
    currentLevelXP: xpInCurrentLevel,
    nextLevelXP: xpForNextLevel,
    progress: Math.round(progress),
    xpToNextLevel,
  };
}

// Get achievement tier based on level
export function getAchievementTier(level: number): {
  tier: number;
  level: string;
  name: string;
} {
  if (level >= 90) return { tier: 10, level: 'Master X', name: 'Enlightened Master' };
  if (level >= 80) return { tier: 9, level: 'Master IX', name: 'Grand Master' };
  if (level >= 70) return { tier: 8, level: 'Expert VIII', name: 'Expert Scholar' };
  if (level >= 60) return { tier: 7, level: 'Expert VII', name: 'Advanced Expert' };
  if (level >= 50) return { tier: 6, level: 'Adept VI', name: 'Skilled Adept' };
  if (level >= 40) return { tier: 5, level: 'Adept V', name: 'Rising Adept' };
  if (level >= 30) return { tier: 4, level: 'Apprentice IV', name: 'Senior Apprentice' };
  if (level >= 20) return { tier: 3, level: 'Apprentice III', name: 'Dedicated Apprentice' };
  if (level >= 10) return { tier: 2, level: 'Novice II', name: 'Focused Student' };
  return { tier: 1, level: 'Novice I', name: 'Beginner' };
}

// ═══════════════════════════════════════════════════════════
// HOME SERVICE CLASS
// ═══════════════════════════════════════════════════════════

class HomeService {
  /**
   * Get all home page data from backend
   */
  async getHomeData(userId: string): Promise<HomeData> {
    try {
      const response = await apiCall('/home', 'GET');
      
      // Convert backend response to frontend format
      const userStats: UserStats = {
        userId: response.userStats.userId,
        totalFocusPoints: response.userStats.totalFocusPoints,
        currentFocusPoints: response.userStats.currentFocusPoints,
        currentLevel: response.userStats.currentLevel,
        totalXP: response.userStats.totalXP,
        xpToNextLevel: response.userStats.xpToNextLevel,
        levelProgress: response.userStats.levelProgress,
        totalSessions: response.userStats.totalSessions,
        totalMinutes: response.userStats.totalMinutes,
        totalDeepWorkHours: response.userStats.totalDeepWorkHours,
        averageSessionLength: response.userStats.averageSessionLength,
        currentStreak: response.userStats.currentStreak,
        bestStreak: response.userStats.bestStreak,
        lastSessionDate: response.userStats.lastSessionDate,
        streakUpdatedAt: new Date(response.userStats.streakUpdatedAt),
        achievementLevel: response.userStats.achievementLevel,
        achievementName: response.userStats.achievementName,
        achievementTier: response.userStats.achievementTier,
        createdAt: new Date(response.userStats.createdAt),
        updatedAt: new Date(response.userStats.updatedAt),
      };

      const petStatus: PetStatus = {
        userId: response.petStatus.userId,
        mood: response.petStatus.mood,
        loyalty: response.petStatus.loyalty,
        health: response.petStatus.health,
        energy: response.petStatus.energy,
        name: response.petStatus.name,
        type: response.petStatus.type,
        level: response.petStatus.level,
        lastFed: new Date(response.petStatus.lastFed),
        lastPlayed: new Date(response.petStatus.lastPlayed),
        updatedAt: new Date(response.petStatus.updatedAt),
      };

      const dailyChallenges: DailyChallenge[] = response.dailyChallenges.map((c: any) => ({
        id: c.id,
        userId: c.userId,
        title: c.title,
        description: c.description,
        type: c.type,
        progress: c.progress,
        total: c.total,
        unit: c.unit,
        completed: c.completed,
        rewardFP: c.rewardFP,
        rewardXP: c.rewardXP,
        difficulty: c.difficulty,
        category: c.category,
        date: c.date,
        createdAt: new Date(c.createdAt),
        completedAt: c.completedAt ? new Date(c.completedAt) : undefined,
        expiresAt: new Date(c.expiresAt),
      }));

      const streakInfo = {
        currentStreak: response.streakInfo.currentStreak,
        bestStreak: response.streakInfo.bestStreak,
        todayDone: response.streakInfo.todayDone,
      };

      return {
        userStats,
        petStatus,
        dailyChallenges,
        streakInfo,
      };
    } catch (error) {
      console.error('Error getting home data:', error);
      throw error;
    }
  }

  /**
   * Get user stats from backend
   */
  async getUserStats(userId: string): Promise<UserStats> {
    const homeData = await this.getHomeData(userId);
    return homeData.userStats;
  }

  /**
   * Record session completion via backend
   */
  async recordSessionCompletion(
    userId: string,
    durationMinutes: number,
    fpEarned: number,
    xpEarned: number
  ): Promise<void> {
    try {
      await apiCall('/home/session/complete', 'POST', {
        durationMinutes,
        focusScore: 100, // Default score, can be calculated
        sessionType: 'STUDY',
        subject: null,
      });
    } catch (error) {
      console.error('Error recording session completion:', error);
      throw error;
    }
  }

  /**
   * Feed pet via backend
   */
  async feedPet(userId: string): Promise<void> {
    try {
      await apiCall('/home/pet/feed', 'POST');
    } catch (error) {
      console.error('Error feeding pet:', error);
      throw error;
    }
  }

  /**
   * Get daily challenges from backend
   */
  async getDailyChallenges(userId: string): Promise<DailyChallenge[]> {
    const homeData = await this.getHomeData(userId);
    return homeData.dailyChallenges;
  }

  /**
   * Get pet status from backend
   */
  async getPetStatus(userId: string): Promise<PetStatus> {
    const homeData = await this.getHomeData(userId);
    return homeData.petStatus;
  }

  // Placeholder methods for backward compatibility
  async initializeUserStats(userId: string): Promise<UserStats> {
    return this.getUserStats(userId);
  }

  async updateUserStats(userId: string, updates: Partial<UserStats>): Promise<void> {
    // Stats are updated on the backend
    console.log('Stats update handled by backend');
  }

  async awardRewards(userId: string, focusPoints: number, xp: number): Promise<void> {
    // Rewards are handled by backend
    console.log('Rewards handled by backend');
  }

  async updateStreak(userId: string): Promise<void> {
    // Streak is handled by backend
    console.log('Streak handled by backend');
  }

  async initializePetStatus(userId: string): Promise<PetStatus> {
    return this.getPetStatus(userId);
  }

  async generateDailyChallenges(userId: string): Promise<DailyChallenge[]> {
    return this.getDailyChallenges(userId);
  }

  async updateChallengeProgress(userId: string, type: string, amount: number): Promise<void> {
    // Challenge progress is handled by backend
    console.log('Challenge progress handled by backend');
  }

  async getChallengeHistory(userId: string, days: number = 7): Promise<ChallengeHistory[]> {
    // Challenge history not implemented in backend yet
    return [];
  }

  async saveChallengeHistory(userId: string): Promise<void> {
    // Challenge history not implemented in backend yet
    console.log('Challenge history not implemented');
  }

  // ═══════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getYesterdayDateString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  private getEndOfDay(): Date {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end;
  }

  private isTodayDone(lastSessionDate: string): boolean {
    return lastSessionDate === this.getTodayDateString();
  }
}

export const homeService = new HomeService();
