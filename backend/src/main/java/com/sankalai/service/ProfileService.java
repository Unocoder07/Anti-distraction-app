package com.sankalai.service;

import com.sankalai.dto.*;
import com.sankalai.entity.*;
import com.sankalai.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final UserStatsRepository userStatsRepository;
    private final AchievementRepository achievementRepository;
    private final HomeService homeService;
    private final FocusService focusService;
    private final BlockingService blockingService;

    public ProfileService(UserRepository userRepository, UserStatsRepository userStatsRepository,
            AchievementRepository achievementRepository, HomeService homeService,
            FocusService focusService, BlockingService blockingService) {
        this.userRepository = userRepository;
        this.userStatsRepository = userStatsRepository;
        this.achievementRepository = achievementRepository;
        this.homeService = homeService;
        this.focusService = focusService;
        this.blockingService = blockingService;
    }

    // Achievement definitions matching frontend
    private static final List<AchievementDefinition> ACHIEVEMENT_DEFINITIONS = List.of(
            // Common Achievements
            new AchievementDefinition("first-session", "First Steps", "Complete your first focus session", "🎯", Achievement.Rarity.COMMON, Achievement.Category.SESSIONS, 1),
            new AchievementDefinition("early-bird", "Early Bird", "Complete a session before 8 AM", "🌅", Achievement.Rarity.COMMON, Achievement.Category.SPECIAL, 1),
            new AchievementDefinition("night-owl", "Night Owl", "Complete a session after 10 PM", "🦉", Achievement.Rarity.COMMON, Achievement.Category.SPECIAL, 1),
            new AchievementDefinition("streak-3", "Getting Started", "Maintain a 3-day streak", "🔥", Achievement.Rarity.COMMON, Achievement.Category.STREAK, 3),
            new AchievementDefinition("sessions-10", "Dedicated Learner", "Complete 10 focus sessions", "📚", Achievement.Rarity.COMMON, Achievement.Category.SESSIONS, 10),
            // Rare Achievements
            new AchievementDefinition("streak-7", "Week Warrior", "Maintain a 7-day streak", "⚡", Achievement.Rarity.RARE, Achievement.Category.STREAK, 7),
            new AchievementDefinition("deep-work-first", "Deep Diver", "Complete your first 90-minute deep work session", "🌊", Achievement.Rarity.RARE, Achievement.Category.FOCUS, 1),
            new AchievementDefinition("sessions-50", "Consistent Scholar", "Complete 50 focus sessions", "🎓", Achievement.Rarity.RARE, Achievement.Category.SESSIONS, 50),
            new AchievementDefinition("level-10", "Rising Star", "Reach Level 10", "⭐", Achievement.Rarity.RARE, Achievement.Category.LEVEL, 10),
            new AchievementDefinition("blocking-master", "Discipline Master", "Complete 20 blocking sessions without breaking", "🛡️", Achievement.Rarity.RARE, Achievement.Category.BLOCKING, 20),
            // Epic Achievements
            new AchievementDefinition("streak-30", "Monthly Master", "Maintain a 30-day streak", "🏆", Achievement.Rarity.EPIC, Achievement.Category.STREAK, 30),
            new AchievementDefinition("sessions-100", "Centurion", "Complete 100 focus sessions", "💯", Achievement.Rarity.EPIC, Achievement.Category.SESSIONS, 100),
            new AchievementDefinition("deep-work-10", "Deep Work Expert", "Complete 10 deep work sessions", "🧠", Achievement.Rarity.EPIC, Achievement.Category.FOCUS, 10),
            new AchievementDefinition("level-50", "Adept Scholar", "Reach Level 50", "🌟", Achievement.Rarity.EPIC, Achievement.Category.LEVEL, 50),
            new AchievementDefinition("perfect-week", "Perfect Week", "Complete sessions 7 days in a row with 90+ focus score", "💎", Achievement.Rarity.EPIC, Achievement.Category.SPECIAL, 7),
            // Legendary Achievements
            new AchievementDefinition("streak-100", "Unstoppable", "Maintain a 100-day streak", "👑", Achievement.Rarity.LEGENDARY, Achievement.Category.STREAK, 100),
            new AchievementDefinition("sessions-500", "Grand Master", "Complete 500 focus sessions", "🎖️", Achievement.Rarity.LEGENDARY, Achievement.Category.SESSIONS, 500),
            new AchievementDefinition("level-100", "Enlightened", "Reach the maximum level (100)", "✨", Achievement.Rarity.LEGENDARY, Achievement.Category.LEVEL, 100),
            new AchievementDefinition("deep-work-50", "Flow State Master", "Complete 50 deep work sessions", "🌌", Achievement.Rarity.LEGENDARY, Achievement.Category.FOCUS, 50),
            new AchievementDefinition("perfect-score", "Perfectionist", "Achieve 100 focus score in 10 sessions", "🏅", Achievement.Rarity.LEGENDARY, Achievement.Category.SPECIAL, 10)
    );

    /**
     * Get user profile
     */
    public UserProfileDTO getUserProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserStats userStats = homeService.getUserStats(userId);
        var focusStats = focusService.getFocusStats(userId);
        var achievements = getUserAchievements(userId);

        long unlockedCount = achievements.stream().filter(AchievementDTO::unlocked).count();

        return new UserProfileDTO(
                userId,
                user.getUsername(),
                user.getEmail(),
                user.getAvatar(),
                user.getExam(),
                user.getExamName(),
                user.getSubjects(),
                user.getEmailVerified(),
                userStats.getCurrentLevel(),
                userStats.getCurrentFocusPoints(),
                userStats.getTotalSessions(),
                userStats.getTotalMinutes() / 60,
                userStats.getCurrentStreak(),
                ACHIEVEMENT_DEFINITIONS.size(),
                (int) unlockedCount,
                0, // globalRank (placeholder)
                user.getJoinedAt(),
                user.getLastActive());
    }

    /**
     * Get user achievements
     */
    public List<AchievementDTO> getUserAchievements(String userId) {
        // Get user's unlocked achievements from database
        List<Achievement> userAchievements = achievementRepository.findByUser_UserId(userId);

        Map<String, LocalDateTime> unlockedIds = userAchievements.stream()
                .filter(a -> a.getUnlocked())
                .collect(Collectors.toMap(
                        Achievement::getAchievementId,
                        Achievement::getUnlockedAt
                ));

        // Get user stats for progress calculation
        UserStats userStats = homeService.getUserStats(userId);
        var focusStats = focusService.getFocusStats(userId);
        var blockingStats = blockingService.getBlockingStats(userId);
        var sessions = focusService.getUserSessions(userId, 100);

        // Map achievements with progress
        return ACHIEVEMENT_DEFINITIONS.stream()
                .map(def -> {
                    boolean unlocked = unlockedIds.containsKey(def.id());
                    int currentValue = getCurrentValue(def, userStats, focusStats, blockingStats, sessions);
                    int progress = unlocked ? 100 : Math.min(100, (currentValue * 100) / def.requirement());

                    return new AchievementDTO(
                            def.id(),
                            def.title(),
                            def.description(),
                            def.icon(),
                            def.rarity().name().toLowerCase(),
                            def.category().name().toLowerCase(),
                            unlocked,
                            unlockedIds.get(def.id()),
                            progress,
                            def.requirement(),
                            currentValue);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get current value for achievement progress
     */
    private int getCurrentValue(
            AchievementDefinition achievement,
            UserStats userStats,
            FocusStatsDTO focusStats,
            com.sankalai.dto.BlockingDTO.BlockingStatsDTO blockingStats,
            List<com.sankalai.entity.FocusSession> sessions
    ) {
        return switch (achievement.id()) {
            case "first-session", "sessions-10", "sessions-50", "sessions-100", "sessions-500" ->
                    userStats.getTotalSessions();
            case "streak-3", "streak-7", "streak-30", "streak-100" ->
                    userStats.getCurrentStreak();
            case "level-10", "level-50", "level-100" ->
                    userStats.getCurrentLevel();
            case "deep-work-first", "deep-work-10", "deep-work-50" ->
                    focusStats.totalDeepWorkSessions();
            case "blocking-master" ->
                    blockingStats.completedSessions();
            case "early-bird" ->
                    (int) sessions.stream()
                            .filter(s -> s.getStartTime().getHour() < 8)
                            .count();
            case "night-owl" ->
                    (int) sessions.stream()
                            .filter(s -> s.getStartTime().getHour() >= 22)
                            .count();
            case "perfect-week" -> {
                LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
                long count = sessions.stream()
                        .filter(s -> s.getStartTime().isAfter(weekAgo) && s.getFocusScore() >= 90)
                        .count();
                yield (int) count;
            }
            case "perfect-score" ->
                    (int) sessions.stream()
                            .filter(s -> s.getFocusScore() != null && s.getFocusScore() == 100)
                            .count();
            default -> 0;
        };
    }

    /**
     * Check and unlock achievements
     */
    @Transactional
    public void checkAndUnlockAchievements(String userId) {
        List<AchievementDTO> achievements = getUserAchievements(userId);

        List<AchievementDTO> toUnlock = achievements.stream()
                .filter(a -> !a.unlocked() && a.currentValue() >= a.requirement())
                .toList();

        if (toUnlock.isEmpty()) return;

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        for (AchievementDTO achievement : toUnlock) {
            Achievement userAchievement = Achievement.builder()
                    .user(user)
                    .achievementId(achievement.id())
                    .title(achievement.title())
                    .description(achievement.description())
                    .icon(achievement.icon())
                    .rarity(Achievement.Rarity.valueOf(achievement.rarity().toUpperCase()))
                    .category(Achievement.Category.valueOf(achievement.category().toUpperCase()))
                    .unlocked(true)
                    .unlockedAt(LocalDateTime.now())
                    .progress(100)
                    .requirement(achievement.requirement())
                    .currentValue(achievement.currentValue())
                    .build();

            achievementRepository.save(userAchievement);
        }

        // Award bonus FP for unlocking achievements
        int bonusFP = toUnlock.size() * 50; // 50 FP per achievement
        if (bonusFP > 0) {
            homeService.awardRewards(userId, bonusFP, 0);
        }
    }

    /**
     * Get leaderboard (top users by level and FP)
     */
    public List<LeaderboardEntryDTO> getLeaderboard(int limitCount) {
        // This would require a more complex query in production
        // For now, return empty array
        // In production, you'd need to:
        // 1. Create a separate leaderboard collection
        // 2. Update it periodically with Cloud Functions
        // 3. Query it here
        return List.of();
    }

    /**
     * Update user profile
     */
    @Transactional
    public void updateUserProfile(String userId, ProfileUpdateRequest updates) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updates.username() != null) {
            user.setUsername(updates.username());
        }
        if (updates.avatar() != null) {
            user.setAvatar(updates.avatar());
        }
        if (updates.exam() != null) {
            user.setExam(updates.exam());
        }
        if (updates.examName() != null) {
            user.setExamName(updates.examName());
        }
        if (updates.subjects() != null) {
            user.setSubjects(updates.subjects());
        }

        userRepository.save(user);
    }

    // Record types
    record AchievementDefinition(
            String id,
            String title,
            String description,
            String icon,
            Achievement.Rarity rarity,
            Achievement.Category category,
            int requirement
    ) {}
}
