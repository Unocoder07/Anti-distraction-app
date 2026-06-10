package com.sankalai.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sankalai.dto.*;
import com.sankalai.entity.FocusSession;
import com.sankalai.entity.User;
import com.sankalai.repository.FocusSessionRepository;
import com.sankalai.repository.UserRepository;
import com.sankalai.repository.UserStatsRepository;

@Service
public class FocusService {

    // Record types
    public record SubjectInfo(String id, String name, String icon, String color) {
    }

    public record RewardCalculation(int fp, int xp) {
    }

    private static final int DEEP_WORK_MINUTES = 90;

    private static final int POMODORO_MINUTES = 25;

    private final UserRepository userRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final UserStatsRepository userStatsRepository;
    private final BlockingService blockingService;
    private final HomeService homeService;

    public FocusService(UserRepository userRepository, FocusSessionRepository focusSessionRepository,
            UserStatsRepository userStatsRepository, BlockingService blockingService,
            HomeService homeService) {
        this.userRepository = userRepository;
        this.focusSessionRepository = focusSessionRepository;
        this.userStatsRepository = userStatsRepository;
        this.blockingService = blockingService;
        this.homeService = homeService;
    }

    /**
     * Start a new focus session
     */
    @Transactional
    public FocusSession startFocusSession(
            String userId,
            Integer duration,
            Integer cycles,
            SubjectInfo subject) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Determine session type
        FocusSession.SessionType type;
        if (duration >= DEEP_WORK_MINUTES) {
            type = FocusSession.SessionType.DEEP_WORK;
        } else if (duration == POMODORO_MINUTES) {
            type = FocusSession.SessionType.POMODORO;
        } else {
            type = FocusSession.SessionType.CUSTOM;
        }

        FocusSession session = new FocusSession(user, LocalDateTime.now(), duration, type,
                cycles != null ? cycles : 1, 0, FocusSession.SessionStatus.ACTIVE,
                0, 0, 0, 100, 0);

        // Set legacy fields for backward compatibility
        session.setDurationMinutes(duration);
        session.setIsDeepWork(type == FocusSession.SessionType.DEEP_WORK);
        session.setCompleted(false);
        session.setSessionType(FocusSession.LegacySessionType.STUDY);

        FocusSession savedSession = focusSessionRepository.save(session);

        // Start blocking sessions for all blocked apps
        startBlockingForSession(userId, duration);

        return savedSession;
    }

    /**
     * Complete a focus session
     */
    @Transactional
    public SessionCompletionResponse completeFocusSession(
            String sessionId,
            String userId,
            Integer actualDuration,
            Integer cyclesCompleted,
            Integer distractionCount,
            Integer pauseCount) {
        FocusSession session = focusSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        // Calculate focus score (0-100)
        int focusScore = calculateFocusScore(
                actualDuration,
                session.getDuration(),
                distractionCount != null ? distractionCount : 0,
                pauseCount != null ? pauseCount : 0);

        // Calculate rewards
        RewardCalculation rewards = calculateRewards(actualDuration, focusScore, session.getType());

        // Update session
        session.setActualDuration(actualDuration);
        session.setCyclesCompleted(cyclesCompleted != null ? cyclesCompleted : 0);
        session.setDistractionCount(distractionCount != null ? distractionCount : 0);
        session.setPauseCount(pauseCount != null ? pauseCount : 0);
        session.setFocusScore(focusScore);
        session.setFocusPointsEarned(rewards.fp());
        session.setXpEarned(rewards.xp());
        session.setStatus(FocusSession.SessionStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());
        session.setEndTime(LocalDateTime.now());

        // Set legacy fields
        session.setCompleted(true);
        session.setIsDeepWork(session.getType() == FocusSession.SessionType.DEEP_WORK);

        focusSessionRepository.save(session);

        // Record in home service (updates stats, streak, pet, challenges)
        homeService.recordSessionCompletion(userId,
                new com.sankalai.dto.SessionCompletionRequest(
                        actualDuration,
                        focusScore,
                        session.getType().name(),
                        session.getSubject()));

        // Update subject study data
        if (session.getSubjectId() != null) {
            updateSubjectStudyData(
                    userId,
                    session.getSubjectId(),
                    session.getSubject(),
                    session.getSubjectIcon(),
                    session.getSubjectColor(),
                    actualDuration);
        }

        // Complete blocking sessions
        completeBlockingForSession(userId);

        return new SessionCompletionResponse(rewards.fp(), rewards.xp(), "Session completed successfully");
    }

    /**
     * Break a focus session
     */
    @Transactional
    public void breakFocusSession(String sessionId, String userId, Integer actualDuration) {
        FocusSession session = focusSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        session.setActualDuration(actualDuration);
        session.setStatus(FocusSession.SessionStatus.BROKEN);
        session.setCompletedAt(LocalDateTime.now());
        session.setEndTime(LocalDateTime.now());

        // Set legacy fields
        session.setCompleted(false);

        focusSessionRepository.save(session);

        // Break all blocking sessions (apply penalties)
        breakBlockingForSession(userId);
    }

    /**
     * Pause a focus session
     */
    @Transactional
    public void pauseFocusSession(String sessionId) {
        FocusSession session = focusSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        session.setStatus(FocusSession.SessionStatus.PAUSED);
        focusSessionRepository.save(session);
    }

    /**
     * Resume a focus session
     */
    @Transactional
    public void resumeFocusSession(String sessionId) {
        FocusSession session = focusSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        session.setStatus(FocusSession.SessionStatus.ACTIVE);
        focusSessionRepository.save(session);
    }

    /**
     * Record distraction (user tried to access blocked app)
     */
    @Transactional
    public void recordDistraction(String sessionId) {
        FocusSession session = focusSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        session.setDistractionCount((session.getDistractionCount() != null ? session.getDistractionCount() : 0) + 1);
        focusSessionRepository.save(session);
    }

    /**
     * Get user's focus sessions
     */
    public List<FocusSession> getUserSessions(String userId, Integer limit) {
        int actualLimit = limit != null ? limit : 30;
        return focusSessionRepository.findByUser_UserIdOrderByStartTimeDesc(userId,
                org.springframework.data.domain.PageRequest.of(0, actualLimit));
    }

    /**
     * Get subject study data
     */
    public List<SubjectStudyDataDTO> getSubjectStudyData(String userId) {
        // This would require a SubjectStudyData entity
        // For now, return empty list
        return List.of();
    }

    /**
     * Get focus statistics
     */
    public FocusStatsDTO getFocusStats(String userId) {
        List<FocusSession> sessions = getUserSessions(userId, 1000);

        var completedSessions = sessions.stream()
                .filter(s -> s.getStatus() == FocusSession.SessionStatus.COMPLETED)
                .toList();

        int totalSessions = completedSessions.size();
        int totalMinutes = completedSessions.stream()
                .mapToInt(s -> s.getActualDuration() != null ? s.getActualDuration() : 0)
                .sum();
        int totalDeepWorkSessions = (int) completedSessions.stream()
                .filter(s -> s.getType() == FocusSession.SessionType.DEEP_WORK)
                .count();
        double averageFocusScore = totalSessions > 0
                ? completedSessions.stream()
                        .mapToInt(s -> s.getFocusScore() != null ? s.getFocusScore() : 0)
                        .average()
                        .orElse(0)
                : 0;
        int totalFPEarned = completedSessions.stream()
                .mapToInt(s -> s.getFocusPointsEarned() != null ? s.getFocusPointsEarned() : 0)
                .sum();
        int totalXPEarned = completedSessions.stream()
                .mapToInt(s -> s.getXpEarned() != null ? s.getXpEarned() : 0)
                .sum();

        return new FocusStatsDTO(
                totalSessions,
                totalMinutes,
                totalDeepWorkSessions,
                (int) Math.round(averageFocusScore),
                totalFPEarned,
                totalXPEarned);
    }

    /**
     * Update subject study data
     */
    @Transactional
    private void updateSubjectStudyData(
            String userId,
            String subjectId,
            String subjectName,
            String icon,
            String color,
            Integer minutes) {
        // This would require a SubjectStudyData entity
        // For now, just log
        System.out.println("Updating subject study data for " + subjectName + ": " + minutes + " minutes");
    }

    /**
     * Calculate focus score (0-100)
     */
    private int calculateFocusScore(
            Integer actualDuration,
            Integer plannedDuration,
            int distractionCount,
            int pauseCount) {
        int score = 100;

        // Deduct for not completing full duration
        if (actualDuration != null && plannedDuration != null) {
            double completionRate = (double) actualDuration / plannedDuration;
            if (completionRate < 1) {
                score -= (int) ((1 - completionRate) * 30); // Max -30 points
            }
        }

        // Deduct for distractions (5 points each, max -30)
        score -= Math.min(distractionCount * 5, 30);

        // Deduct for pauses (3 points each, max -20)
        score -= Math.min(pauseCount * 3, 20);

        return Math.max(0, score);
    }

    /**
     * Calculate rewards (FP and XP)
     */
    private RewardCalculation calculateRewards(Integer duration, int focusScore, FocusSession.SessionType type) {
        int actualDuration = duration != null ? duration : 0;

        // Base rewards
        int baseFP = (int) (actualDuration * 0.5); // 0.5 FP per minute
        int baseXP = (int) (actualDuration * 1.0); // 1 XP per minute

        // Bonus for deep work (90+ minutes)
        if (type == FocusSession.SessionType.DEEP_WORK) {
            baseFP += 50;
            baseXP += 100;
        }

        // Apply focus score multiplier
        double multiplier = focusScore / 100.0;
        int fp = (int) Math.round(baseFP * multiplier);
        int xp = (int) Math.round(baseXP * multiplier);

        return new RewardCalculation(fp, xp);
    }

    /**
     * Start blocking sessions for all blocked apps
     */
    private void startBlockingForSession(String userId, Integer duration) {
        try {
            var blockedApps = blockingService.getUserBlockedApps(userId);
            for (var app : blockedApps) {
                if (app.getBlocked()) {
                    blockingService.startBlockingSession(userId,
                            new com.sankalai.dto.BlockingDTO.StartSessionRequest(
                                    app.getAppId(),
                                    app.getAppName(),
                                    duration));
                }
            }
        } catch (Exception e) {
            System.err.println("Error starting blocking for session: " + e.getMessage());
        }
    }

    /**
     * Complete blocking sessions
     */
    private void completeBlockingForSession(String userId) {
        try {
            var activeSessions = blockingService.getActiveBlockingSessions(userId);
            for (var session : activeSessions) {
                blockingService.completeBlockingSession(userId, session.getId());
            }
        } catch (Exception e) {
            System.err.println("Error completing blocking for session: " + e.getMessage());
        }
    }

    /**
     * Break blocking sessions (apply penalties)
     */
    private void breakBlockingForSession(String userId) {
        try {
            var activeSessions = blockingService.getActiveBlockingSessions(userId);
            for (var session : activeSessions) {
                blockingService.breakBlockingSession(userId, session.getId());
            }
        } catch (Exception e) {
            System.err.println("Error breaking blocking for session: " + e.getMessage());
        }
    }
}
