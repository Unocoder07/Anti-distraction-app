// Analytics Service - Calculate and track all analytics data
import { focusService, type FocusSession } from './focusService';
import { homeService } from './homeService';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface WeeklyData {
  day: string;
  hours: number;
  sessions: number;
  date: string;
}

export interface TrendData {
  label: string;
  value: number; // 0-100 focus score
  hour: number;
}

export interface AnalyticsOverview {
  // This Week
  weeklyFocusScore: number;      // 0-100
  weeklyHours: number;
  weeklyDeepWorkHours: number;
  weeklySessionCount: number;
  
  // All Time
  totalSessions: number;
  totalHours: number;
  totalDeepWorkHours: number;
  currentStreak: number;
  bestStreak: number;
  
  // Charts Data
  weeklyChart: WeeklyData[];
  trendChart: TrendData[];
  
  // Blocking Stats
  blockingSuccessRate: number;
  totalCoinsEarned: number;
  totalCoinsLost: number;
}

// ═══════════════════════════════════════════════════════════
// ANALYTICS SERVICE CLASS
// ═══════════════════════════════════════════════════════════

class AnalyticsService {
  /**
   * Get complete analytics overview
   */
  async getAnalyticsOverview(userId: string): Promise<AnalyticsOverview> {
    try {
      // Fetch all data in parallel
      const [sessions, userStats] = await Promise.all([
        focusService.getUserSessions(userId, 90), // Last 90 days
        homeService.getUserStats(userId),
      ]);

      // Note: Blocking stats temporarily disabled during Shield refactor
      // You can integrate with new Shield store later if needed
      const blockingStats = {
        successRate: 0,
        totalCoinsEarned: 0,
        totalCoinsLost: 0,
      };

      // Calculate weekly data
      const weeklyData = this.calculateWeeklyData(sessions);
      const weeklyFocusScore = this.calculateWeeklyFocusScore(sessions);
      const weeklyHours = weeklyData.reduce((sum, d) => sum + d.hours, 0);
      const weeklyDeepWorkHours = this.calculateWeeklyDeepWork(sessions);
      const weeklySessionCount = weeklyData.reduce((sum, d) => sum + d.sessions, 0);

      // Calculate trend data
      const trendData = this.calculateTrendData(sessions);

      // All time stats
      const totalSessions = userStats.totalSessions;
      const totalHours = userStats.totalMinutes / 60;
      const totalDeepWorkHours = userStats.totalDeepWorkHours;

      return {
        weeklyFocusScore,
        weeklyHours,
        weeklyDeepWorkHours,
        weeklySessionCount,
        totalSessions,
        totalHours,
        totalDeepWorkHours,
        currentStreak: userStats.currentStreak,
        bestStreak: userStats.bestStreak,
        weeklyChart: weeklyData,
        trendChart: trendData,
        blockingSuccessRate: blockingStats.successRate,
        totalCoinsEarned: blockingStats.totalCoinsEarned,
        totalCoinsLost: blockingStats.totalCoinsLost,
      };
    } catch (error) {
      console.error('Error getting analytics overview:', error);
      throw error;
    }
  }

  /**
   * Calculate weekly data (last 7 days)
   */
  private calculateWeeklyData(sessions: FocusSession[]): WeeklyData[] {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weeklyData: WeeklyData[] = [];

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayName = days[date.getDay()];
      const dateString = date.toISOString().split('T')[0];

      // Filter sessions for this day
      const daySessions = sessions.filter((s) => {
        const sessionDate = new Date(s.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === date.getTime() && s.status === 'completed';
      });

      const totalMinutes = daySessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0);
      const hours = totalMinutes / 60;

      weeklyData.push({
        day: dayName,
        hours: Math.round(hours * 10) / 10, // Round to 1 decimal
        sessions: daySessions.length,
        date: dateString,
      });
    }

    return weeklyData;
  }

  /**
   * Calculate weekly focus score (average of last 7 days)
   */
  private calculateWeeklyFocusScore(sessions: FocusSession[]): number {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklySessions = sessions.filter((s) => {
      const sessionDate = new Date(s.startTime);
      return sessionDate >= weekAgo && s.status === 'completed';
    });

    if (weeklySessions.length === 0) return 0;

    const totalScore = weeklySessions.reduce((sum, s) => sum + s.focusScore, 0);
    return Math.round(totalScore / weeklySessions.length);
  }

  /**
   * Calculate weekly deep work hours
   */
  private calculateWeeklyDeepWork(sessions: FocusSession[]): number {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const deepWorkSessions = sessions.filter((s) => {
      const sessionDate = new Date(s.startTime);
      return (
        sessionDate >= weekAgo &&
        s.status === 'completed' &&
        s.type === 'deep-work'
      );
    });

    const totalMinutes = deepWorkSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0);
    return Math.round((totalMinutes / 60) * 10) / 10;
  }

  /**
   * Calculate trend data (focus score by hour of day)
   */
  private calculateTrendData(sessions: FocusSession[]): TrendData[] {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Filter to last 7 days
    const recentSessions = sessions.filter((s) => {
      const sessionDate = new Date(s.startTime);
      return sessionDate >= weekAgo && s.status === 'completed';
    });

    // Group by hour
    const hourlyData: Record<number, { scores: number[]; count: number }> = {};

    recentSessions.forEach((session) => {
      const hour = new Date(session.startTime).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { scores: [], count: 0 };
      }
      hourlyData[hour].scores.push(session.focusScore);
      hourlyData[hour].count++;
    });

    // Calculate average for each hour
    const trendData: TrendData[] = [];

    // Common study hours: 6am to 11pm
    for (let hour = 6; hour <= 23; hour++) {
      const data = hourlyData[hour];
      const avgScore = data
        ? Math.round(data.scores.reduce((sum, s) => sum + s, 0) / data.count)
        : 0;

      // Format hour label
      const label = hour === 12 ? '12pm' : hour > 12 ? `${hour - 12}pm` : `${hour}am`;

      trendData.push({
        label,
        value: avgScore,
        hour,
      });
    }

    // If no data, return sample data
    if (trendData.every((d) => d.value === 0)) {
      return [
        { label: '8am', value: 0, hour: 8 },
        { label: '10am', value: 0, hour: 10 },
        { label: '12pm', value: 0, hour: 12 },
        { label: '2pm', value: 0, hour: 14 },
        { label: '4pm', value: 0, hour: 16 },
        { label: '6pm', value: 0, hour: 18 },
        { label: '8pm', value: 0, hour: 20 },
      ];
    }

    // Return only hours with data or key hours
    return trendData.filter((d) => d.value > 0 || [8, 10, 12, 14, 16, 18, 20].includes(d.hour));
  }

  /**
   * Get productivity insights
   */
  async getProductivityInsights(userId: string): Promise<{
    bestStudyTime: string;
    mostProductiveDay: string;
    averageSessionLength: number;
    consistencyScore: number;
    improvementTip: string;
  }> {
    try {
      const sessions = await focusService.getUserSessions(userId, 90);
      const completedSessions = sessions.filter((s) => s.status === 'completed');

      if (completedSessions.length === 0) {
        return {
          bestStudyTime: 'Not enough data',
          mostProductiveDay: 'Not enough data',
          averageSessionLength: 0,
          consistencyScore: 0,
          improvementTip: 'Complete more sessions to get personalized insights!',
        };
      }

      // Best study time (hour with highest focus score)
      const hourlyScores: Record<number, number[]> = {};
      completedSessions.forEach((s) => {
        const hour = new Date(s.startTime).getHours();
        if (!hourlyScores[hour]) hourlyScores[hour] = [];
        hourlyScores[hour].push(s.focusScore);
      });

      let bestHour = 0;
      let bestScore = 0;
      Object.entries(hourlyScores).forEach(([hour, scores]) => {
        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        if (avg > bestScore) {
          bestScore = avg;
          bestHour = parseInt(hour);
        }
      });

      const bestStudyTime =
        bestHour === 12 ? '12pm' : bestHour > 12 ? `${bestHour - 12}pm` : `${bestHour}am`;

      // Most productive day
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayScores: Record<number, number[]> = {};
      completedSessions.forEach((s) => {
        const day = new Date(s.startTime).getDay();
        if (!dayScores[day]) dayScores[day] = [];
        dayScores[day].push(s.focusScore);
      });

      let bestDay = 0;
      let bestDayScore = 0;
      Object.entries(dayScores).forEach(([day, scores]) => {
        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        if (avg > bestDayScore) {
          bestDayScore = avg;
          bestDay = parseInt(day);
        }
      });

      const mostProductiveDay = days[bestDay];

      // Average session length
      const totalMinutes = completedSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0);
      const averageSessionLength = Math.round(totalMinutes / completedSessions.length);

      // Consistency score (sessions per week)
      const weeklyAvg = (completedSessions.length / 90) * 7;
      const consistencyScore = Math.min(100, Math.round(weeklyAvg * 20)); // 5 sessions/week = 100

      // Improvement tip
      let improvementTip = '';
      if (consistencyScore < 50) {
        improvementTip = 'Try to study at least 3 times per week for better consistency!';
      } else if (averageSessionLength < 30) {
        improvementTip = 'Aim for longer sessions (45+ minutes) for deeper focus!';
      } else if (bestScore < 80) {
        improvementTip = 'Reduce distractions to improve your focus score!';
      } else {
        improvementTip = "You're doing great! Keep up the excellent work!";
      }

      return {
        bestStudyTime,
        mostProductiveDay,
        averageSessionLength,
        consistencyScore,
        improvementTip,
      };
    } catch (error) {
      console.error('Error getting productivity insights:', error);
      return {
        bestStudyTime: 'Error',
        mostProductiveDay: 'Error',
        averageSessionLength: 0,
        consistencyScore: 0,
        improvementTip: 'Unable to calculate insights',
      };
    }
  }
}

export const analyticsService = new AnalyticsService();
