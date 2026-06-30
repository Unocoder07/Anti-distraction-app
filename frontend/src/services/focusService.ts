// Focus Service - Complete focus session management with backend API integration
import { apiCall } from "../config/api";
import { nativeBlockingService } from "./nativeBlockingService";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface FocusSession {
  id: string;
  userId: string;

  // Session Details
  startTime: Date;
  endTime?: Date;
  duration: number; // Planned duration (minutes)
  actualDuration?: number; // Actual duration (minutes)

  // Session Type
  type: "pomodoro" | "deep-work" | "custom";
  origin?: "manual" | "planned" | "custom-target";
  cycles: number;
  cyclesCompleted: number;

  // Subject
  subject?: string;
  subjectId?: string;
  subjectIcon?: string;
  subjectColor?: string;

  // Status
  status: "active" | "completed" | "broken" | "paused";

  // Rewards
  focusPointsEarned: number;
  xpEarned: number;

  // Quality Metrics
  distractionCount: number; // Times user tried to access blocked apps
  focusScore: number; // 0-100 quality score
  pauseCount: number;

  // Timestamps
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

export interface SubjectStudyData {
  subjectId: string;
  subjectName: string;
  icon: string;
  color: string;
  totalMinutes: number;
  totalSessions: number;
  lastStudied: Date;
  averageSessionLength: number;
}

// ═══════════════════════════════════════════════════════════
// FOCUS SERVICE CLASS
// ═══════════════════════════════════════════════════════════

class FocusService {
  /**
   * Start a new focus session via backend
   */
  async startFocusSession(
    userId: string,
    duration: number,
    cycles: number,
    subject?: {
      id: string;
      name: string;
      icon: string;
      color: string;
    },
    origin: "manual" | "planned" | "custom-target" = "manual",
  ): Promise<FocusSession> {
    let createdSessionId: string | null = null;

    try {
      // Note: Focus sessions are independent of Shield blocking
      // If you want to integrate Shield blocking with focus sessions,
      // you can add that logic here
      const blockedPackages: { packageName: string; appName: string }[] = [];

      const protectionReady =
        await nativeBlockingService.prepareForFocusSession(blockedPackages);
      if (!protectionReady) {
        throw new Error(
          "Focus Protection permission is required to start a protected study session.",
        );
      }

      const response: any = await apiCall("/focus/sessions/start", "POST", {
        duration,
        cycles,
        subjectId: subject?.id,
        subjectName: subject?.name,
        subjectIcon: subject?.icon,
        subjectColor: subject?.color,
        origin,
      });

      createdSessionId = response.id;

      const createdAt = response.createdAt
        ? new Date(response.createdAt)
        : new Date();
      const updatedAt = response.updatedAt
        ? new Date(response.updatedAt)
        : createdAt;

      const session: FocusSession = {
        id: response.id,
        userId,
        startTime: new Date(response.startTime),
        duration: response.duration,
        actualDuration: response.actualDuration,
        type: response.type,
        origin: response.origin,
        cycles: response.cycles,
        cyclesCompleted: response.cyclesCompleted,
        subject: response.subject,
        subjectId: response.subjectId,
        subjectIcon: response.subjectIcon,
        subjectColor: response.subjectColor,
        status: response.status,
        focusPointsEarned: response.focusPointsEarned,
        xpEarned: response.xpEarned,
        distractionCount: response.distractionCount,
        focusScore: response.focusScore,
        pauseCount: response.pauseCount,
        createdAt,
        completedAt: response.completedAt
          ? new Date(response.completedAt)
          : undefined,
        updatedAt,
      };

      if (blockedPackages.length > 0) {
        const started = await nativeBlockingService.startNativeSession(
          session,
          blockedPackages,
        );
        if (!started) {
          throw new Error(
            "Focus Protection could not be activated for this study session.",
          );
        }
      } else {
        await nativeBlockingService.stopNativeSession();
      }

      return session;
    } catch (error) {
      await nativeBlockingService.stopNativeSession();

      if (createdSessionId) {
        try {
          await apiCall(`/focus/sessions/${createdSessionId}/break`, "POST", {
            actualDuration: 0,
          });
        } catch (cleanupError) {
          console.error(
            "Error rolling back failed focus session start:",
            cleanupError,
          );
        }
      }

      console.error("Error starting focus session:", error);
      throw error;
    }
  }

  /**
   * Complete a focus session via backend
   */
  async completeFocusSession(
    sessionId: string,
    userId: string,
    actualDuration: number,
    cyclesCompleted: number,
    distractionCount: number = 0,
    pauseCount: number = 0,
  ): Promise<{ fp: number; xp: number }> {
    try {
      await nativeBlockingService.stopNativeSession();

      const response: any = await apiCall(
        `/focus/sessions/${sessionId}/complete`,
        "POST",
        {
          actualDuration,
          cyclesCompleted,
          distractionCount,
          pauseCount,
        },
      );

      return { fp: response.fp, xp: response.xp };
    } catch (error) {
      console.error("Error completing focus session:", error);
      throw error;
    }
  }

  /**
   * Break a focus session via backend
   */
  async breakFocusSession(
    sessionId: string,
    userId: string,
    actualDuration: number,
  ): Promise<void> {
    try {
      await nativeBlockingService.stopNativeSession();

      await apiCall(`/focus/sessions/${sessionId}/break`, "POST", {
        actualDuration,
      });
    } catch (error) {
      console.error("Error breaking focus session:", error);
      throw error;
    }
  }

  /**
   * Pause a focus session via backend
   */
  async pauseFocusSession(sessionId: string): Promise<void> {
    try {
      await apiCall(`/focus/sessions/${sessionId}/pause`, "POST");
    } catch (error) {
      console.error("Error pausing focus session:", error);
    }
  }

  /**
   * Resume a focus session via backend
   */
  async resumeFocusSession(sessionId: string): Promise<void> {
    try {
      await apiCall(`/focus/sessions/${sessionId}/resume`, "POST");
    } catch (error) {
      console.error("Error resuming focus session:", error);
    }
  }

  /**
   * Record distraction via backend
   */
  async recordDistraction(sessionId: string): Promise<void> {
    try {
      await apiCall(`/focus/sessions/${sessionId}/distraction`, "POST");
    } catch (error) {
      console.error("Error recording distraction:", error);
    }
  }

  /**
   * Get user's focus sessions from backend
   */
  async getUserSessions(
    userId: string,
    limitCount: number = 30,
  ): Promise<FocusSession[]> {
    try {
      const response = (await apiCall(
        `/focus/sessions?limit=${limitCount}`,
        "GET",
      )) as any[];

      return response.map((s: any) => ({
        createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
        id: s.id,
        userId: s.userId,
        startTime: new Date(s.startTime),
        endTime: s.endTime ? new Date(s.endTime) : undefined,
        duration: s.duration,
        actualDuration: s.actualDuration,
        type: s.type,
        origin: s.origin,
        cycles: s.cycles,
        cyclesCompleted: s.cyclesCompleted,
        subject: s.subject,
        subjectId: s.subjectId,
        subjectIcon: s.subjectIcon,
        subjectColor: s.subjectColor,
        status: s.status,
        focusPointsEarned: s.focusPointsEarned,
        xpEarned: s.xpEarned,
        distractionCount: s.distractionCount,
        focusScore: s.focusScore,
        pauseCount: s.pauseCount,
        completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
        updatedAt: s.updatedAt
          ? new Date(s.updatedAt)
          : s.createdAt
            ? new Date(s.createdAt)
            : new Date(),
      }));
    } catch (error) {
      console.error("Error getting user sessions:", error);
      return [];
    }
  }

  /**
   * Delete a focus session from backend
   */
  async deleteSession(sessionId: string): Promise<void> {
    await apiCall(`/focus/sessions/${sessionId}`, "DELETE");
  }

  /**
   * Get subject study data from backend
   */
  async getSubjectStudyData(userId: string): Promise<SubjectStudyData[]> {
    try {
      const response = (await apiCall("/focus/subjects", "GET")) as any[];

      return response.map((s: any) => ({
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        icon: s.icon,
        color: s.color,
        totalMinutes: s.totalMinutes,
        totalSessions: s.totalSessions,
        lastStudied: new Date(s.lastStudied),
        averageSessionLength: s.averageSessionLength,
      }));
    } catch (error) {
      console.error("Error getting subject study data:", error);
      return [];
    }
  }

  /**
   * Get focus statistics from backend
   */
  async getFocusStats(userId: string): Promise<{
    totalSessions: number;
    totalMinutes: number;
    totalDeepWorkSessions: number;
    averageFocusScore: number;
    totalFPEarned: number;
    totalXPEarned: number;
  }> {
    try {
      const response: any = await apiCall("/focus/stats", "GET");

      return {
        totalSessions: response.totalSessions,
        totalMinutes: response.totalMinutes,
        totalDeepWorkSessions: response.totalDeepWorkSessions,
        averageFocusScore: response.averageFocusScore,
        totalFPEarned: response.totalFPEarned,
        totalXPEarned: response.totalXPEarned,
      };
    } catch (error) {
      console.error("Error getting focus stats:", error);
      return {
        totalSessions: 0,
        totalMinutes: 0,
        totalDeepWorkSessions: 0,
        averageFocusScore: 0,
        totalFPEarned: 0,
        totalXPEarned: 0,
      };
    }
  }

  // Placeholder methods for backward compatibility
  private async updateSubjectStudyData(
    userId: string,
    subjectId: string,
    subjectName: string,
    icon: string,
    color: string,
    minutes: number,
  ): Promise<void> {
    // Subject study data is handled by backend
    console.log("Subject study data handled by backend");
  }

  private calculateFocusScore(
    actualDuration: number,
    plannedDuration: number,
    distractionCount: number,
    pauseCount: number,
  ): number {
    let score = 100;

    const completionRate = actualDuration / plannedDuration;
    if (completionRate < 1) {
      score -= (1 - completionRate) * 30;
    }

    score -= Math.min(distractionCount * 5, 30);
    score -= Math.min(pauseCount * 3, 20);

    return Math.max(0, Math.round(score));
  }

  private calculateRewards(
    duration: number,
    focusScore: number,
    type: string,
  ): { fp: number; xp: number } {
    let baseFP = Math.floor(duration * 0.5);
    let baseXP = Math.floor(duration * 1.0);

    if (type === "deep-work") {
      baseFP += 50;
      baseXP += 100;
    }

    const multiplier = focusScore / 100;
    const fp = Math.round(baseFP * multiplier);
    const xp = Math.round(baseXP * multiplier);

    return { fp, xp };
  }

  private async startBlockingForSession(
    userId: string,
    duration: number,
  ): Promise<void> {
    // Note: Focus sessions are now independent of Shield blocking
    // If you want to integrate, use the new Shield store and session manager
    try {
      console.log('[FocusService] Focus session started without Shield integration');
    } catch (error) {
      console.error("Error starting blocking for session:", error);
    }
  }

  private async completeBlockingForSession(userId: string): Promise<void> {
    // Note: Focus sessions are now independent of Shield blocking
    try {
      console.log('[FocusService] Focus session completed without Shield integration');
    } catch (error) {
      console.error("Error completing blocking for session:", error);
    }
  }

  private async breakBlockingForSession(userId: string): Promise<void> {
    // Note: Focus sessions are now independent of Shield blocking
    try {
      console.log('[FocusService] Focus session broken without Shield integration');
    } catch (error) {
      console.error("Error breaking blocking for session:", error);
    }
  }
}

export const focusService = new FocusService();
