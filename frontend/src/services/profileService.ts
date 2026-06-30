// Profile Service - User profile and achievements management with backend API integration
import { apiCall } from '../config/api';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'sessions' | 'streak' | 'focus' | 'blocking' | 'level' | 'special';
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;        // 0-100 for locked achievements
  requirement: number;      // What's needed to unlock
  currentValue: number;     // User's current progress
}

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  avatar: string;
  
  // Stats Summary
  level: number;
  focusPoints: number;
  totalSessions: number;
  totalHours: number;
  currentStreak: number;
  
  // Achievements
  totalAchievements: number;
  unlockedAchievements: number;
  
  // Rank
  globalRank?: number;
  
  // Timestamps
  joinedAt: Date;
  lastActive: Date;
}

// ═══════════════════════════════════════════════════════════
// ACHIEVEMENT DEFINITIONS
// ═══════════════════════════════════════════════════════════

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress' | 'currentValue'>[] = [
  // Common Achievements
  {
    id: 'first-session',
    title: 'First Steps',
    description: 'Complete your first focus session',
    icon: '🎯',
    rarity: 'common',
    category: 'sessions',
    requirement: 1,
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Complete a session before 8 AM',
    icon: '🌅',
    rarity: 'common',
    category: 'special',
    requirement: 1,
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Complete a session after 10 PM',
    icon: '🦉',
    rarity: 'common',
    category: 'special',
    requirement: 1,
  },
  {
    id: 'streak-3',
    title: 'Getting Started',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    rarity: 'common',
    category: 'streak',
    requirement: 3,
  },
  {
    id: 'sessions-10',
    title: 'Dedicated Learner',
    description: 'Complete 10 focus sessions',
    icon: '📚',
    rarity: 'common',
    category: 'sessions',
    requirement: 10,
  },

  // Rare Achievements
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚡',
    rarity: 'rare',
    category: 'streak',
    requirement: 7,
  },
  {
    id: 'deep-work-first',
    title: 'Deep Diver',
    description: 'Complete your first 90-minute deep work session',
    icon: '🌊',
    rarity: 'rare',
    category: 'focus',
    requirement: 1,
  },
  {
    id: 'sessions-50',
    title: 'Consistent Scholar',
    description: 'Complete 50 focus sessions',
    icon: '🎓',
    rarity: 'rare',
    category: 'sessions',
    requirement: 50,
  },
  {
    id: 'level-10',
    title: 'Rising Star',
    description: 'Reach Level 10',
    icon: '⭐',
    rarity: 'rare',
    category: 'level',
    requirement: 10,
  },
  {
    id: 'blocking-master',
    title: 'Discipline Master',
    description: 'Complete 20 blocking sessions without breaking',
    icon: '🛡️',
    rarity: 'rare',
    category: 'blocking',
    requirement: 20,
  },

  // Epic Achievements
  {
    id: 'streak-30',
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🏆',
    rarity: 'epic',
    category: 'streak',
    requirement: 30,
  },
  {
    id: 'sessions-100',
    title: 'Centurion',
    description: 'Complete 100 focus sessions',
    icon: '💯',
    rarity: 'epic',
    category: 'sessions',
    requirement: 100,
  },
  {
    id: 'deep-work-10',
    title: 'Deep Work Expert',
    description: 'Complete 10 deep work sessions',
    icon: '🧠',
    rarity: 'epic',
    category: 'focus',
    requirement: 10,
  },
  {
    id: 'level-50',
    title: 'Adept Scholar',
    description: 'Reach Level 50',
    icon: '🌟',
    rarity: 'epic',
    category: 'level',
    requirement: 50,
  },
  {
    id: 'perfect-week',
    title: 'Perfect Week',
    description: 'Complete sessions 7 days in a row with 90+ focus score',
    icon: '💎',
    rarity: 'epic',
    category: 'special',
    requirement: 7,
  },

  // Legendary Achievements
  {
    id: 'streak-100',
    title: 'Unstoppable',
    description: 'Maintain a 100-day streak',
    icon: '👑',
    rarity: 'legendary',
    category: 'streak',
    requirement: 100,
  },
  {
    id: 'sessions-500',
    title: 'Grand Master',
    description: 'Complete 500 focus sessions',
    icon: '🎖️',
    rarity: 'legendary',
    category: 'sessions',
    requirement: 500,
  },
  {
    id: 'level-100',
    title: 'Enlightened',
    description: 'Reach the maximum level (100)',
    icon: '✨',
    rarity: 'legendary',
    category: 'level',
    requirement: 100,
  },
  {
    id: 'deep-work-50',
    title: 'Flow State Master',
    description: 'Complete 50 deep work sessions',
    icon: '🌌',
    rarity: 'legendary',
    category: 'focus',
    requirement: 50,
  },
  {
    id: 'perfect-score',
    title: 'Perfectionist',
    description: 'Achieve 100 focus score in 10 sessions',
    icon: '🏅',
    rarity: 'legendary',
    category: 'special',
    requirement: 10,
  },
];

// ═══════════════════════════════════════════════════════════
// PROFILE SERVICE CLASS
// ═══════════════════════════════════════════════════════════

class ProfileService {
  /**
   * Get user profile from backend
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await apiCall('/profile', 'GET') as any;
      
      return {
        userId: response.userId,
        username: response.username,
        email: response.email,
        avatar: response.avatar,
        level: response.level,
        focusPoints: response.focusPoints,
        totalSessions: response.totalSessions,
        totalHours: response.totalHours,
        currentStreak: response.currentStreak,
        totalAchievements: response.totalAchievements,
        unlockedAchievements: response.unlockedAchievements,
        globalRank: response.globalRank,
        joinedAt: new Date(response.joinedAt),
        lastActive: new Date(response.lastActive),
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Get user achievements from backend
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const response = await apiCall('/profile/achievements', 'GET') as any;
      
      return response.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        rarity: a.rarity,
        category: a.category,
        unlocked: a.unlocked,
        unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : undefined,
        progress: a.progress,
        requirement: a.requirement,
        currentValue: a.currentValue,
      }));
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  /**
   * Check and unlock achievements via backend
   */
  async checkAndUnlockAchievements(userId: string): Promise<void> {
    try {
      await apiCall('/profile/achievements/check', 'POST');
    } catch (error) {
      console.error('Error checking achievements:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard from backend
   */
  async getLeaderboard(limitCount: number = 50): Promise<{
    userId: string;
    username: string;
    avatar: string;
    level: number;
    focusPoints: number;
    rank: number;
  }[]> {
    try {
      const response = await apiCall(`/profile/leaderboard?limit=${limitCount}`, 'GET') as any;
      
      return response.map((entry: any) => ({
        userId: entry.userId,
        username: entry.username,
        avatar: entry.avatar,
        level: entry.level,
        focusPoints: entry.focusPoints,
        rank: entry.rank,
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  /**
   * Update user profile via backend
   */
  async updateUserProfile(
    userId: string,
    updates: {
      username?: string;
      avatar?: string;
    }
  ): Promise<void> {
    try {
      await apiCall('/profile', 'PUT', updates);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Placeholder methods for backward compatibility
  private getCurrentValue(
    achievement: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress' | 'currentValue'>,
    userStats: any,
    focusStats: any,
    blockingStats: any,
    sessions: any[]
  ): number {
    // Progress is calculated on the backend
    return 0;
  }
}

export const profileService = new ProfileService();
