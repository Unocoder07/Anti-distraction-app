import { apiCall } from '../config/api';

export interface UserStats {
  userId: string;
  totalFocusPoints: number;
  currentFocusPoints: number;
  currentLevel: number;
  totalXP: number;
  xpToNextLevel: number;
  levelProgress: number;
  totalSessions: number;
  totalMinutes: number;
  totalDeepWorkHours: number;
  averageSessionLength: number;
  currentStreak: number;
  bestStreak: number;
  lastSessionDate: string;
  streakUpdatedAt: Date;
  achievementLevel: string;
  achievementName: string;
  achievementTier: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyChallenge {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: 'session' | 'time' | 'streak' | 'blocking' | 'deep-work' | 'custom';
  progress: number;
  total: number;
  unit: string;
  completed: boolean;
  rewardFP: number;
  rewardXP: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  date: string;
  createdAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

export interface HomeData {
  userStats: UserStats;
  dailyChallenges: DailyChallenge[];
  streakInfo: {
    currentStreak: number;
    bestStreak: number;
    todayDone: boolean;
    todayStudyMinutes: number;
  };
}

type HomeApiResponse = {
  userStats: any;
  dailyChallenges: any[];
  streakInfo: {
    currentStreak: number;
    bestStreak: number;
    todayDone: boolean;
    todayStudyMinutes?: number;
  };
};

class HomeService {
  async getHomeData(_userId: string): Promise<HomeData> {
    try {
      const response = (await apiCall('/home', 'GET')) as HomeApiResponse;

      return {
        userStats: this.mapUserStats(response.userStats),
        dailyChallenges: response.dailyChallenges.map(this.mapDailyChallenge),
        streakInfo: {
          currentStreak: response.streakInfo.currentStreak,
          bestStreak: response.streakInfo.bestStreak,
          todayDone: response.streakInfo.todayDone,
          todayStudyMinutes: response.streakInfo.todayStudyMinutes || 0,
        },
      };
    } catch (error) {
      console.error('Error getting home data:', error);
      throw error;
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const homeData = await this.getHomeData(userId);
    return homeData.userStats;
  }

  async completeDailyChallenge(_userId: string, challengeId: string): Promise<void> {
    try {
      await apiCall(`/home/challenges/${challengeId}/complete`, 'POST');
    } catch (error) {
      console.error('Error completing daily challenge:', error);
      throw error;
    }
  }

  async createCustomChallenge(
    _userId: string,
    title: string,
    description?: string,
  ): Promise<void> {
    try {
      await apiCall('/home/challenges/custom', 'POST', {
        title,
        description,
      });
    } catch (error) {
      console.error('Error creating custom challenge:', error);
      throw error;
    }
  }

  private mapUserStats(stats: any): UserStats {
    return {
      userId: stats.userId,
      totalFocusPoints: stats.totalFocusPoints,
      currentFocusPoints: stats.currentFocusPoints,
      currentLevel: stats.currentLevel,
      totalXP: stats.totalXP,
      xpToNextLevel: stats.xpToNextLevel,
      levelProgress: stats.levelProgress,
      totalSessions: stats.totalSessions,
      totalMinutes: stats.totalMinutes,
      totalDeepWorkHours: stats.totalDeepWorkHours,
      averageSessionLength: stats.averageSessionLength,
      currentStreak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      lastSessionDate: stats.lastSessionDate,
      streakUpdatedAt: new Date(stats.streakUpdatedAt),
      achievementLevel: stats.achievementLevel,
      achievementName: stats.achievementName,
      achievementTier: stats.achievementTier,
      createdAt: new Date(stats.createdAt),
      updatedAt: new Date(stats.updatedAt),
    };
  }

  private mapDailyChallenge(challenge: any): DailyChallenge {
    return {
      id: challenge.id,
      userId: challenge.userId,
      title: challenge.title,
      description: challenge.description,
      type: challenge.type,
      progress: challenge.progress,
      total: challenge.total,
      unit: challenge.unit,
      completed: challenge.completed,
      rewardFP: challenge.rewardFP,
      rewardXP: challenge.rewardXP,
      difficulty: challenge.difficulty,
      category: challenge.category,
      date: challenge.date,
      createdAt: new Date(challenge.createdAt),
      completedAt: challenge.completedAt ? new Date(challenge.completedAt) : undefined,
      expiresAt: new Date(challenge.expiresAt),
    };
  }
}

export const homeService = new HomeService();
