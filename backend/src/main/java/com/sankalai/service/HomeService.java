package com.sankalai.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sankalai.dto.HomeDataResponse;
import com.sankalai.dto.SessionCompletionRequest;
import com.sankalai.entity.DailyChallenge;
import com.sankalai.entity.FocusSession;
import com.sankalai.entity.PetStatus;
import com.sankalai.entity.User;
import com.sankalai.entity.UserStats;
import com.sankalai.exception.BadRequestException;
import com.sankalai.exception.ConflictException;
import com.sankalai.exception.ResourceNotFoundException;
import com.sankalai.repository.DailyChallengeRepository;
import com.sankalai.repository.FocusSessionRepository;
import com.sankalai.repository.PetStatusRepository;
import com.sankalai.repository.UserRepository;
import com.sankalai.repository.UserStatsRepository;

@Service
public class HomeService {

    // Inner classes for level calculation
    private static class LevelInfo {
        int level;
        int progress;
        long xpToNextLevel;

        LevelInfo(int level, int progress, long xpToNextLevel) {
            this.level = level;
            this.progress = progress;
            this.xpToNextLevel = xpToNextLevel;
        }
    }

    private static class AchievementInfo {
        int tier;
        String level;
        String name;

        AchievementInfo(int tier, String level, String name) {
            this.tier = tier;
            this.level = level;
            this.name = name;
        }
    }

    private static final int MAX_LEVEL = 100;
    private static final int DAILY_DIRECTIVE_REWARD_FC = 10;
    private final UserRepository userRepository;
    private final UserStatsRepository userStatsRepository;

    private final PetStatusRepository petStatusRepository;

    private final DailyChallengeRepository dailyChallengeRepository;

    private final FocusSessionRepository focusSessionRepository;

    public HomeService(UserRepository userRepository, UserStatsRepository userStatsRepository,
            PetStatusRepository petStatusRepository, DailyChallengeRepository dailyChallengeRepository,
            FocusSessionRepository focusSessionRepository) {
        this.userRepository = userRepository;
        this.userStatsRepository = userStatsRepository;
        this.petStatusRepository = petStatusRepository;
        this.dailyChallengeRepository = dailyChallengeRepository;
        this.focusSessionRepository = focusSessionRepository;
    }

    public HomeDataResponse getHomeData(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserStats userStats = getUserStats(userId);
        PetStatus petStatus = getPetStatus(userId);
        List<DailyChallenge> challenges = getDailyChallenges(userId, user, userStats);

        // Convert to DTOs
        HomeDataResponse.UserStatsDTO statsDTO = mapToUserStatsDTO(userStats);
        HomeDataResponse.PetStatusDTO petDTO = mapToPetStatusDTO(petStatus);
        List<HomeDataResponse.DailyChallengeDTO> challengeDTOs = challenges.stream()
                .map(this::mapToChallengeDTO)
                .collect(Collectors.toList());

        HomeDataResponse.StreakInfoDTO streakInfo = new HomeDataResponse.StreakInfoDTO(
                userStats.getCurrentStreak(),
                userStats.getBestStreak(),
                isTodayDone(userStats.getLastSessionDate()),
                getTodayStudyMinutes(userId));

        return new HomeDataResponse(statsDTO, petDTO, challengeDTOs, streakInfo);
    }

    public UserStats getUserStats(String userId) {
        return userStatsRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User stats not found"));
    }

    public PetStatus getPetStatus(String userId) {
        return petStatusRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet status not found"));
    }

    public List<DailyChallenge> getDailyChallenges(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        UserStats stats = getUserStats(userId);
        return getDailyChallenges(userId, user, stats);
    }

    public List<DailyChallenge> getDailyChallenges(String userId, User user, UserStats stats) {
        LocalDate today = LocalDate.now();
        List<DailyChallenge> challenges = dailyChallengeRepository.findByUser_UserIdAndDate(userId, today);

        if (challenges.isEmpty()) {
            challenges = generateDailyChallenges(user, stats);
        }

        return normalizeDailyChallenges(challenges);
    }

    private Integer getTodayStudyMinutes(String userId) {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime startOfTomorrow = today.plusDays(1).atStartOfDay();

        return focusSessionRepository.findByUser_UserIdAndStartTimeBetween(userId, startOfDay, startOfTomorrow)
                .stream()
                .filter(session -> session.getStatus() == FocusSession.SessionStatus.COMPLETED)
                .mapToInt(session -> session.getActualDuration() != null ? session.getActualDuration() : 0)
                .sum();
    }

    @Transactional
    public List<DailyChallenge> generateDailyChallenges(User user, UserStats stats) {
        LocalDate today = LocalDate.now();
        LocalDateTime endOfDay = LocalDateTime.of(today, LocalTime.MAX);

        // Challenge 1: Complete sessions
        DailyChallenge challenge1 = new DailyChallenge(user,
                stats.getCurrentLevel() < 20 ? "Focus Starter" : "Focus Marathon",
                stats.getCurrentLevel() < 20 ? "Complete 2 focus sessions" : "Complete 4 focus sessions",
                DailyChallenge.ChallengeType.SESSION,
                0,
                stats.getCurrentLevel() < 20 ? 2 : 4,
                "sessions",
                false,
                DAILY_DIRECTIVE_REWARD_FC,
                stats.getCurrentLevel() < 20 ? 50 : 100,
                stats.getCurrentLevel() < 20 ? DailyChallenge.Difficulty.EASY : DailyChallenge.Difficulty.MEDIUM,
                "consistency",
                today,
                endOfDay);

        // Challenge 2: Accumulate time
        DailyChallenge challenge2 = new DailyChallenge(user,
                "Time Investment",
                String.format("Focus for %d minutes total", stats.getCurrentLevel() < 30 ? 60 : 120),
                DailyChallenge.ChallengeType.TIME,
                0,
                stats.getCurrentLevel() < 30 ? 60 : 120,
                "min",
                false,
                DAILY_DIRECTIVE_REWARD_FC,
                stats.getCurrentLevel() < 30 ? 60 : 120,
                stats.getCurrentLevel() < 30 ? DailyChallenge.Difficulty.MEDIUM : DailyChallenge.Difficulty.HARD,
                "dedication",
                today,
                endOfDay);

        dailyChallengeRepository.save(challenge1);
        dailyChallengeRepository.save(challenge2);

        // Challenge 3: Deep work (if level 10+)
        if (stats.getCurrentLevel() >= 10) {
            DailyChallenge challenge3 = new DailyChallenge(user,
                    "Deep Work Protocol",
                    "Complete one 90-minute deep work session",
                    DailyChallenge.ChallengeType.DEEP_WORK,
                    0,
                    1,
                    "session",
                    false,
                    DAILY_DIRECTIVE_REWARD_FC,
                    150,
                    DailyChallenge.Difficulty.HARD,
                    "mastery",
                    today,
                    endOfDay);

            dailyChallengeRepository.save(challenge3);
            return List.of(challenge1, challenge2, challenge3);
        }

        return List.of(challenge1, challenge2);
    }

    @Transactional
    public void recordSessionCompletion(String userId, SessionCompletionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserStats stats = getUserStats(userId);
        PetStatus pet = getPetStatus(userId);

        // Calculate rewards
        int fpEarned = calculateFP(request.getDurationMinutes(), request.getFocusScore());
        int xpEarned = calculateXP(request.getDurationMinutes(), request.getFocusScore());

        // Check if deep work
        boolean isDeepWork = request.getDurationMinutes() >= 90;

        // Create focus session
        FocusSession session = new FocusSession(user,
                LocalDateTime.now().minusMinutes(request.getDurationMinutes()),
                request.getDurationMinutes(),
                isDeepWork ? FocusSession.SessionType.DEEP_WORK : FocusSession.SessionType.CUSTOM,
                1,
                1,
                FocusSession.SessionStatus.COMPLETED,
                fpEarned,
                xpEarned,
                0,
                request.getFocusScore(),
                0);

        // Set legacy fields for backward compatibility
        session.setDurationMinutes(request.getDurationMinutes());
        session.setCompleted(true);
        session.setIsDeepWork(isDeepWork);
        session.setSessionType(FocusSession.LegacySessionType
                .valueOf(request.getSessionType() != null ? request.getSessionType().toUpperCase() : "STUDY"));

        focusSessionRepository.save(session);

        // Update stats
        int newTotalSessions = stats.getTotalSessions() + 1;
        int newTotalMinutes = stats.getTotalMinutes() + request.getDurationMinutes();
        int newAverageLength = newTotalMinutes / newTotalSessions;
        double newDeepWorkHours = isDeepWork
                ? stats.getTotalDeepWorkHours() + (request.getDurationMinutes() / 60.0)
                : stats.getTotalDeepWorkHours();

        stats.setTotalSessions(newTotalSessions);
        stats.setTotalMinutes(newTotalMinutes);
        stats.setAverageSessionLength(newAverageLength);
        stats.setTotalDeepWorkHours(newDeepWorkHours);

        // Award rewards
        awardRewardsInternal(stats, fpEarned, xpEarned);

        // Update streak
        updateStreakInternal(stats);

        // Update pet
        feedPetInternal(pet, stats);

        userStatsRepository.save(stats);
        petStatusRepository.save(pet);

        // Update challenges
        updateChallengeProgressInternal(userId, user, stats, DailyChallenge.ChallengeType.SESSION, 1);
        updateChallengeProgressInternal(userId, user, stats, DailyChallenge.ChallengeType.TIME, request.getDurationMinutes());
        if (isDeepWork) {
            updateChallengeProgressInternal(userId, user, stats, DailyChallenge.ChallengeType.DEEP_WORK, 1);
        }
    }

    @Transactional
    public void awardRewards(String userId, int focusPoints, int xp) {
        UserStats stats = getUserStats(userId);
        awardRewardsInternal(stats, focusPoints, xp);
        userStatsRepository.save(stats);
    }

    private void awardRewardsInternal(UserStats stats, int focusPoints, int xp) {
        long newTotalFP = stats.getTotalFocusPoints() + focusPoints;
        long newCurrentFP = stats.getCurrentFocusPoints() + focusPoints;
        long newTotalXP = stats.getTotalXP() + xp;

        // Calculate new level
        LevelInfo levelInfo = calculateLevel(newTotalXP);
        AchievementInfo achievementInfo = getAchievementTier(levelInfo.level);

        stats.setTotalFocusPoints(newTotalFP);
        stats.setCurrentFocusPoints(newCurrentFP);
        stats.setTotalXP(newTotalXP);
        stats.setCurrentLevel(levelInfo.level);
        stats.setXpToNextLevel(levelInfo.xpToNextLevel);
        stats.setLevelProgress(levelInfo.progress);
        stats.setAchievementLevel(achievementInfo.level);
        stats.setAchievementName(achievementInfo.name);
        stats.setAchievementTier(achievementInfo.tier);
    }

    @Transactional
    public void updateStreak(String userId) {
        UserStats stats = getUserStats(userId);
        updateStreakInternal(stats);
        userStatsRepository.save(stats);
    }

    private void updateStreakInternal(UserStats stats) {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        int newStreak = stats.getCurrentStreak();

        if (stats.getLastSessionDate() == null) {
            newStreak = 1;
        } else if (stats.getLastSessionDate().equals(yesterday)) {
            newStreak = stats.getCurrentStreak() + 1;
        } else if (stats.getLastSessionDate().equals(today)) {
            newStreak = stats.getCurrentStreak();
        } else {
            newStreak = 1;
        }

        int newBestStreak = Math.max(stats.getBestStreak(), newStreak);

        stats.setCurrentStreak(newStreak);
        stats.setBestStreak(newBestStreak);
        stats.setLastSessionDate(today);
        stats.setStreakUpdatedAt(LocalDateTime.now());
    }

    @Transactional
    public void feedPet(String userId) {
        PetStatus pet = getPetStatus(userId);
        UserStats stats = getUserStats(userId);
        feedPetInternal(pet, stats);
        petStatusRepository.save(pet);
    }

    private void feedPetInternal(PetStatus pet, UserStats stats) {
        // Calculate mood based on streak
        PetStatus.PetMood mood = PetStatus.PetMood.HAPPY;
        if (stats.getCurrentStreak() >= 7) {
            mood = PetStatus.PetMood.OPTIMAL;
        } else if (stats.getCurrentStreak() >= 3) {
            mood = PetStatus.PetMood.HAPPY;
        } else {
            mood = PetStatus.PetMood.TIRED;
        }

        int loyalty = Math.min(100, 50 + stats.getCurrentStreak() * 3);

        pet.setMood(mood);
        pet.setLoyalty(loyalty);
        pet.setHealth(100);
        pet.setEnergy(100);
        pet.setLastFed(LocalDateTime.now());
        pet.setLevel(stats.getCurrentLevel());
    }

    @Transactional
    public void updateChallengeProgress(String userId, DailyChallenge.ChallengeType type, int amount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        UserStats stats = getUserStats(userId);
        updateChallengeProgressInternal(userId, user, stats, type, amount);
    }

    @Transactional
    public void createCustomChallenge(String userId, String title, String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        UserStats stats = getUserStats(userId);

        String trimmedTitle = title == null ? "" : title.trim();
        if (trimmedTitle.isEmpty()) {
            throw new BadRequestException("Target title is required");
        }

        LocalDate today = LocalDate.now();
        List<DailyChallenge> challenges = getDailyChallenges(userId, user, stats);
        String newKey = getChallengeUniqueKey(DailyChallenge.ChallengeType.CUSTOM, trimmedTitle);
        boolean alreadyExists = challenges.stream()
                .anyMatch(challenge -> getChallengeUniqueKey(challenge).equals(newKey));

        if (alreadyExists) {
            throw new ConflictException("You already have this custom target today");
        }

        String trimmedDescription = description == null ? "" : description.trim();
        DailyChallenge customChallenge = new DailyChallenge(user,
                trimmedTitle,
                trimmedDescription.isEmpty() ? "Custom target" : trimmedDescription,
                DailyChallenge.ChallengeType.CUSTOM,
                0,
                1,
                "target",
                false,
                DAILY_DIRECTIVE_REWARD_FC,
                0,
                DailyChallenge.Difficulty.EASY,
                "custom",
                today,
                LocalDateTime.of(today, LocalTime.MAX));

        dailyChallengeRepository.save(customChallenge);
    }

    @Transactional
    public void completeChallenge(String userId, String challengeId) {
        UserStats stats = getUserStats(userId);
        DailyChallenge challenge = dailyChallengeRepository.findById(challengeId)
                .orElseThrow(() -> new ResourceNotFoundException("Target not found"));

        if (!challenge.getUser().getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Target not found");
        }

        if (!challenge.getDate().equals(LocalDate.now())) {
            throw new BadRequestException("Only today's targets can be completed");
        }

        normalizeChallengeReward(challenge);

        if (!Boolean.TRUE.equals(challenge.getCompleted())) {
            challenge.setProgress(challenge.getTotal());
            challenge.setCompleted(true);
            challenge.setCompletedAt(LocalDateTime.now());

            awardRewardsInternal(stats, DAILY_DIRECTIVE_REWARD_FC, challenge.getRewardXP());
            userStatsRepository.save(stats);
            dailyChallengeRepository.save(challenge);
        }
    }

    private void updateChallengeProgressInternal(String userId, User user, UserStats stats, DailyChallenge.ChallengeType type, int amount) {
        List<DailyChallenge> challenges = getDailyChallenges(userId, user, stats);

        for (DailyChallenge challenge : challenges) {
            if (challenge.getType().equals(type) && !challenge.getCompleted()) {
                int newProgress = challenge.getProgress() + amount;
                boolean completed = newProgress >= challenge.getTotal();

                challenge.setProgress(Math.min(newProgress, challenge.getTotal()));
                challenge.setCompleted(completed);

                if (completed && challenge.getCompletedAt() == null) {
                    challenge.setCompletedAt(LocalDateTime.now());
                    // Award challenge rewards
                    awardRewardsInternal(stats, DAILY_DIRECTIVE_REWARD_FC, challenge.getRewardXP());
                    userStatsRepository.save(stats);
                }

                dailyChallengeRepository.save(challenge);
            }
        }
    }

    private List<DailyChallenge> normalizeDailyChallenges(List<DailyChallenge> challenges) {
        Map<String, DailyChallenge> uniqueChallenges = new LinkedHashMap<>();
        List<DailyChallenge> duplicateChallenges = new ArrayList<>();

        for (DailyChallenge challenge : challenges) {
            normalizeChallengeReward(challenge);
            String key = getChallengeUniqueKey(challenge);
            DailyChallenge primary = uniqueChallenges.get(key);

            if (primary == null) {
                uniqueChallenges.put(key, challenge);
                continue;
            }

            mergeChallengeProgress(primary, challenge);
            duplicateChallenges.add(challenge);
        }

        dailyChallengeRepository.saveAll(uniqueChallenges.values());
        if (!duplicateChallenges.isEmpty()) {
            dailyChallengeRepository.deleteAll(duplicateChallenges);
        }

        return new ArrayList<>(uniqueChallenges.values());
    }

    private void normalizeChallengeReward(DailyChallenge challenge) {
        if (challenge.getRewardFP() == null || challenge.getRewardFP() != DAILY_DIRECTIVE_REWARD_FC) {
            challenge.setRewardFP(DAILY_DIRECTIVE_REWARD_FC);
        }
    }

    private void mergeChallengeProgress(DailyChallenge primary, DailyChallenge duplicate) {
        if (Boolean.TRUE.equals(duplicate.getCompleted())) {
            primary.setCompleted(true);
            primary.setProgress(primary.getTotal());
            if (primary.getCompletedAt() == null) {
                primary.setCompletedAt(duplicate.getCompletedAt());
            }
            return;
        }

        int mergedProgress = Math.max(primary.getProgress(), duplicate.getProgress());
        boolean completed = mergedProgress >= primary.getTotal();
        primary.setProgress(Math.min(mergedProgress, primary.getTotal()));

        if (completed) {
            primary.setCompleted(true);
            if (primary.getCompletedAt() == null) {
                primary.setCompletedAt(LocalDateTime.now());
            }
        }
    }

    private String getChallengeUniqueKey(DailyChallenge challenge) {
        return getChallengeUniqueKey(challenge.getType(), challenge.getTitle());
    }

    private String getChallengeUniqueKey(DailyChallenge.ChallengeType type, String title) {
        if (type == DailyChallenge.ChallengeType.CUSTOM) {
            return type.name() + ":" + normalizeKeyText(title);
        }

        return type.name();
    }

    private String normalizeKeyText(String text) {
        return text == null ? "" : text.trim().toLowerCase();
    }

    // Helper methods
    private int calculateFP(int durationMinutes, int focusScore) {
        return (int) (durationMinutes * (focusScore / 100.0) * 1.5);
    }

    private int calculateXP(int durationMinutes, int focusScore) {
        return (int) (durationMinutes * (focusScore / 100.0) * 2);
    }

    private LevelInfo calculateLevel(long totalXP) {
        int level = 1;
        long xpAccumulated = 0;

        while (level < MAX_LEVEL && totalXP >= xpAccumulated + getXPForLevel(level)) {
            xpAccumulated += getXPForLevel(level);
            level++;
        }

        if (level >= MAX_LEVEL) {
            return new LevelInfo(MAX_LEVEL, 100, 0);
        }

        long xpInCurrentLevel = totalXP - xpAccumulated;
        long xpForNextLevel = getXPForLevel(level);
        int progress = Math.min(100, (int) ((xpInCurrentLevel * 100) / xpForNextLevel));
        long xpToNextLevel = xpForNextLevel - xpInCurrentLevel;

        return new LevelInfo(level, progress, xpToNextLevel);
    }

    private long getXPForLevel(int level) {
        if (level >= MAX_LEVEL)
            return 0;
        return (long) (100 * Math.pow(1.5, level - 1));
    }

    private AchievementInfo getAchievementTier(int level) {
        if (level >= 90)
            return new AchievementInfo(10, "Master X", "Enlightened Master");
        if (level >= 80)
            return new AchievementInfo(9, "Master IX", "Grand Master");
        if (level >= 70)
            return new AchievementInfo(8, "Expert VIII", "Expert Scholar");
        if (level >= 60)
            return new AchievementInfo(7, "Expert VII", "Advanced Expert");
        if (level >= 50)
            return new AchievementInfo(6, "Adept VI", "Skilled Adept");
        if (level >= 40)
            return new AchievementInfo(5, "Adept V", "Rising Adept");
        if (level >= 30)
            return new AchievementInfo(4, "Apprentice IV", "Senior Apprentice");
        if (level >= 20)
            return new AchievementInfo(3, "Apprentice III", "Dedicated Apprentice");
        if (level >= 10)
            return new AchievementInfo(2, "Novice II", "Focused Student");
        return new AchievementInfo(1, "Novice I", "Beginner");
    }

    private boolean isTodayDone(LocalDate lastSessionDate) {
        return lastSessionDate != null && lastSessionDate.equals(LocalDate.now());
    }

    // DTOs for mapping
    private HomeDataResponse.UserStatsDTO mapToUserStatsDTO(UserStats stats) {
        HomeDataResponse.UserStatsDTO dto = new HomeDataResponse.UserStatsDTO();
        dto.setUserId(stats.getUserId());
        dto.setTotalFocusPoints(stats.getTotalFocusPoints());
        dto.setCurrentFocusPoints(stats.getCurrentFocusPoints());
        dto.setCurrentLevel(stats.getCurrentLevel());
        dto.setTotalXP(stats.getTotalXP());
        dto.setXpToNextLevel(stats.getXpToNextLevel());
        dto.setLevelProgress(stats.getLevelProgress());
        dto.setTotalSessions(stats.getTotalSessions());
        dto.setTotalMinutes(stats.getTotalMinutes());
        dto.setTotalDeepWorkHours(stats.getTotalDeepWorkHours());
        dto.setAverageSessionLength(stats.getAverageSessionLength());
        dto.setCurrentStreak(stats.getCurrentStreak());
        dto.setBestStreak(stats.getBestStreak());
        dto.setLastSessionDate(stats.getLastSessionDate());
        dto.setAchievementLevel(stats.getAchievementLevel());
        dto.setAchievementName(stats.getAchievementName());
        dto.setAchievementTier(stats.getAchievementTier());
        dto.setCreatedAt(stats.getCreatedAt());
        dto.setUpdatedAt(stats.getUpdatedAt());
        return dto;
    }

    private HomeDataResponse.PetStatusDTO mapToPetStatusDTO(PetStatus pet) {
        HomeDataResponse.PetStatusDTO dto = new HomeDataResponse.PetStatusDTO();
        dto.setUserId(pet.getUserId());
        dto.setMood(pet.getMood().name().toLowerCase());
        dto.setLoyalty(pet.getLoyalty());
        dto.setHealth(pet.getHealth());
        dto.setEnergy(pet.getEnergy());
        dto.setName(pet.getName());
        dto.setType(pet.getType());
        dto.setLevel(pet.getLevel());
        dto.setLastFed(pet.getLastFed());
        dto.setLastPlayed(pet.getLastPlayed());
        dto.setUpdatedAt(pet.getUpdatedAt());
        return dto;
    }

    private HomeDataResponse.DailyChallengeDTO mapToChallengeDTO(DailyChallenge challenge) {
        HomeDataResponse.DailyChallengeDTO dto = new HomeDataResponse.DailyChallengeDTO();
        dto.setId(challenge.getId());
        dto.setTitle(challenge.getTitle());
        dto.setDescription(challenge.getDescription());
        dto.setType(challenge.getType().name().toLowerCase());
        dto.setProgress(challenge.getProgress());
        dto.setTotal(challenge.getTotal());
        dto.setUnit(challenge.getUnit());
        dto.setCompleted(challenge.getCompleted());
        dto.setRewardFP(challenge.getRewardFP());
        dto.setRewardXP(challenge.getRewardXP());
        dto.setDifficulty(challenge.getDifficulty().name().toLowerCase());
        dto.setCategory(challenge.getCategory());
        dto.setDate(challenge.getDate());
        dto.setCreatedAt(challenge.getCreatedAt());
        dto.setCompletedAt(challenge.getCompletedAt());
        dto.setExpiresAt(challenge.getExpiresAt());
        return dto;
    }
}
