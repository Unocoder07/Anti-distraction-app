package com.sankalai.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class HomeDataResponse {

    public static class UserStatsDTO {
        private String userId;
        private Long totalFocusPoints;
        private Long currentFocusPoints;
        private Integer currentLevel;
        private Long totalXP;
        private Long xpToNextLevel;
        private Integer levelProgress;
        private Integer totalSessions;
        private Integer totalMinutes;
        private Double totalDeepWorkHours;
        private Integer averageSessionLength;
        private Integer currentStreak;
        private Integer bestStreak;
        private LocalDate lastSessionDate;
        private String achievementLevel;
        private String achievementName;
        private Integer achievementTier;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        // Constructor
        public UserStatsDTO() {}
        // Getters and Setters
        public String getUserId() { return userId; }

        public void setUserId(String userId) { this.userId = userId; }
        public Long getTotalFocusPoints() { return totalFocusPoints; }

        public void setTotalFocusPoints(Long totalFocusPoints) { this.totalFocusPoints = totalFocusPoints; }
        public Long getCurrentFocusPoints() { return currentFocusPoints; }

        public void setCurrentFocusPoints(Long currentFocusPoints) { this.currentFocusPoints = currentFocusPoints; }
        public Integer getCurrentLevel() { return currentLevel; }

        public void setCurrentLevel(Integer currentLevel) { this.currentLevel = currentLevel; }
        public Long getTotalXP() { return totalXP; }

        public void setTotalXP(Long totalXP) { this.totalXP = totalXP; }
        public Long getXpToNextLevel() { return xpToNextLevel; }

        public void setXpToNextLevel(Long xpToNextLevel) { this.xpToNextLevel = xpToNextLevel; }
        public Integer getLevelProgress() { return levelProgress; }

        public void setLevelProgress(Integer levelProgress) { this.levelProgress = levelProgress; }
        public Integer getTotalSessions() { return totalSessions; }

        public void setTotalSessions(Integer totalSessions) { this.totalSessions = totalSessions; }
        public Integer getTotalMinutes() { return totalMinutes; }

        public void setTotalMinutes(Integer totalMinutes) { this.totalMinutes = totalMinutes; }
        public Double getTotalDeepWorkHours() { return totalDeepWorkHours; }

        public void setTotalDeepWorkHours(Double totalDeepWorkHours) { this.totalDeepWorkHours = totalDeepWorkHours; }
        public Integer getAverageSessionLength() { return averageSessionLength; }

        public void setAverageSessionLength(Integer averageSessionLength) { this.averageSessionLength = averageSessionLength; }
        public Integer getCurrentStreak() { return currentStreak; }

        public void setCurrentStreak(Integer currentStreak) { this.currentStreak = currentStreak; }
        public Integer getBestStreak() { return bestStreak; }

        public void setBestStreak(Integer bestStreak) { this.bestStreak = bestStreak; }
        public LocalDate getLastSessionDate() { return lastSessionDate; }

        public void setLastSessionDate(LocalDate lastSessionDate) { this.lastSessionDate = lastSessionDate; }
        public String getAchievementLevel() { return achievementLevel; }

        public void setAchievementLevel(String achievementLevel) { this.achievementLevel = achievementLevel; }
        public String getAchievementName() { return achievementName; }

        public void setAchievementName(String achievementName) { this.achievementName = achievementName; }
        public Integer getAchievementTier() { return achievementTier; }

        public void setAchievementTier(Integer achievementTier) { this.achievementTier = achievementTier; }
        public LocalDateTime getCreatedAt() { return createdAt; }

        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public LocalDateTime getUpdatedAt() { return updatedAt; }

        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    }
    public static class PetStatusDTO {
        private String userId;
        private String mood;
        private Integer loyalty;
        private Integer health;
        private Integer energy;
        private String name;
        private String type;
        private Integer level;
        private LocalDateTime lastFed;
        private LocalDateTime lastPlayed;
        private LocalDateTime updatedAt;

        // Constructor
        public PetStatusDTO() {}
        // Getters and Setters
        public String getUserId() { return userId; }

        public void setUserId(String userId) { this.userId = userId; }
        public String getMood() { return mood; }

        public void setMood(String mood) { this.mood = mood; }
        public Integer getLoyalty() { return loyalty; }

        public void setLoyalty(Integer loyalty) { this.loyalty = loyalty; }
        public Integer getHealth() { return health; }

        public void setHealth(Integer health) { this.health = health; }
        public Integer getEnergy() { return energy; }

        public void setEnergy(Integer energy) { this.energy = energy; }
        public String getName() { return name; }

        public void setName(String name) { this.name = name; }
        public String getType() { return type; }

        public void setType(String type) { this.type = type; }
        public Integer getLevel() { return level; }

        public void setLevel(Integer level) { this.level = level; }
        public LocalDateTime getLastFed() { return lastFed; }

        public void setLastFed(LocalDateTime lastFed) { this.lastFed = lastFed; }
        public LocalDateTime getLastPlayed() { return lastPlayed; }

        public void setLastPlayed(LocalDateTime lastPlayed) { this.lastPlayed = lastPlayed; }
        public LocalDateTime getUpdatedAt() { return updatedAt; }

        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    }
    public static class DailyChallengeDTO {
        private String id;
        private String title;
        private String description;
        private String type;
        private Integer progress;
        private Integer total;
        private String unit;
        private Boolean completed;
        private Integer rewardFP;
        private Integer rewardXP;
        private String difficulty;
        private String category;
        private LocalDate date;
        private LocalDateTime createdAt;
        private LocalDateTime completedAt;
        private LocalDateTime expiresAt;

        // Constructor
        public DailyChallengeDTO() {}
        // Getters and Setters
        public String getId() { return id; }

        public void setId(String id) { this.id = id; }
        public String getTitle() { return title; }

        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }

        public void setDescription(String description) { this.description = description; }
        public String getType() { return type; }

        public void setType(String type) { this.type = type; }
        public Integer getProgress() { return progress; }

        public void setProgress(Integer progress) { this.progress = progress; }
        public Integer getTotal() { return total; }

        public void setTotal(Integer total) { this.total = total; }
        public String getUnit() { return unit; }

        public void setUnit(String unit) { this.unit = unit; }
        public Boolean getCompleted() { return completed; }

        public void setCompleted(Boolean completed) { this.completed = completed; }
        public Integer getRewardFP() { return rewardFP; }

        public void setRewardFP(Integer rewardFP) { this.rewardFP = rewardFP; }
        public Integer getRewardXP() { return rewardXP; }

        public void setRewardXP(Integer rewardXP) { this.rewardXP = rewardXP; }
        public String getDifficulty() { return difficulty; }

        public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
        public String getCategory() { return category; }

        public void setCategory(String category) { this.category = category; }
        public LocalDate getDate() { return date; }

        public void setDate(LocalDate date) { this.date = date; }
        public LocalDateTime getCreatedAt() { return createdAt; }

        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public LocalDateTime getCompletedAt() { return completedAt; }

        public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
        public LocalDateTime getExpiresAt() { return expiresAt; }

        public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    }
    public static class StreakInfoDTO {
        private Integer currentStreak;
        private Integer bestStreak;
        private Boolean todayDone;

        // Constructor
        public StreakInfoDTO() {}
        public StreakInfoDTO(Integer currentStreak, Integer bestStreak, Boolean todayDone) {
            this.currentStreak = currentStreak;
            this.bestStreak = bestStreak;
            this.todayDone = todayDone;
        }

        // Getters and Setters
        public Integer getCurrentStreak() { return currentStreak; }
        public void setCurrentStreak(Integer currentStreak) { this.currentStreak = currentStreak; }

        public Integer getBestStreak() { return bestStreak; }
        public void setBestStreak(Integer bestStreak) { this.bestStreak = bestStreak; }

        public Boolean getTodayDone() { return todayDone; }

        public void setTodayDone(Boolean todayDone) { this.todayDone = todayDone; }
    }

    private UserStatsDTO userStats;
    private PetStatusDTO petStatus;

    private List<DailyChallengeDTO> dailyChallenges;
    private StreakInfoDTO streakInfo;

    // Constructor
    public HomeDataResponse() {}
    public HomeDataResponse(UserStatsDTO userStats, PetStatusDTO petStatus, List<DailyChallengeDTO> dailyChallenges, StreakInfoDTO streakInfo) {
        this.userStats = userStats;
        this.petStatus = petStatus;
        this.dailyChallenges = dailyChallenges;
        this.streakInfo = streakInfo;
    }

    // Getters and Setters
    public UserStatsDTO getUserStats() { return userStats; }
    public void setUserStats(UserStatsDTO userStats) { this.userStats = userStats; }

    public PetStatusDTO getPetStatus() { return petStatus; }

    public void setPetStatus(PetStatusDTO petStatus) { this.petStatus = petStatus; }

    public List<DailyChallengeDTO> getDailyChallenges() { return dailyChallenges; }

    public void setDailyChallenges(List<DailyChallengeDTO> dailyChallenges) { this.dailyChallenges = dailyChallenges; }

    public StreakInfoDTO getStreakInfo() { return streakInfo; }

    public void setStreakInfo(StreakInfoDTO streakInfo) { this.streakInfo = streakInfo; }
}
