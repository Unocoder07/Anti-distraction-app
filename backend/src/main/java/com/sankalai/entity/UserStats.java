package com.sankalai.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_stats")
@EntityListeners(AuditingEntityListener.class)
public class UserStats {

    @Id
    @Column(name = "user_id")
    private String userId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    // Focus Points & Level
    @Column(nullable = false)
    private Long totalFocusPoints = 100L;

    @Column(nullable = false)
    private Long currentFocusPoints = 100L;

    @Column(nullable = false)
    private Integer currentLevel = 1;

    @Column(nullable = false)
    private Long totalXP = 0L;

    @Column(nullable = false)
    private Long xpToNextLevel = 100L;

    @Column(nullable = false)
    private Integer levelProgress = 0;

    // Sessions
    @Column(nullable = false)
    private Integer totalSessions = 0;

    @Column(nullable = false)
    private Integer totalMinutes = 0;

    @Column(nullable = false)
    private Double totalDeepWorkHours = 0.0;

    @Column(nullable = false)
    private Integer averageSessionLength = 0;

    // Streaks
    @Column(nullable = false)
    private Integer currentStreak = 0;

    @Column(nullable = false)
    private Integer bestStreak = 0;

    private LocalDate lastSessionDate;

    private LocalDateTime streakUpdatedAt;

    // Achievement
    @Column(nullable = false)
    private String achievementLevel = "Novice I";

    @Column(nullable = false)
    private String achievementName = "Beginner";

    @Column(nullable = false)
    private Integer achievementTier = 1;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // Constructor
    public UserStats() {}
    public UserStats(String userId, Long totalFocusPoints, Long currentFocusPoints, Integer currentLevel,
                    Long totalXP, Long xpToNextLevel, Integer levelProgress, Integer totalSessions,
                    Integer totalMinutes, Double totalDeepWorkHours, Integer averageSessionLength,
                    Integer currentStreak, Integer bestStreak, String achievementLevel,
                    String achievementName, Integer achievementTier) {
        this.userId = userId;
        this.totalFocusPoints = totalFocusPoints;
        this.currentFocusPoints = currentFocusPoints;
        this.currentLevel = currentLevel;
        this.totalXP = totalXP;
        this.xpToNextLevel = xpToNextLevel;
        this.levelProgress = levelProgress;
        this.totalSessions = totalSessions;
        this.totalMinutes = totalMinutes;
        this.totalDeepWorkHours = totalDeepWorkHours;
        this.averageSessionLength = averageSessionLength;
        this.currentStreak = currentStreak;
        this.bestStreak = bestStreak;
        this.achievementLevel = achievementLevel;
        this.achievementName = achievementName;
        this.achievementTier = achievementTier;
    }

    // Getters and Setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

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

    public LocalDateTime getStreakUpdatedAt() { return streakUpdatedAt; }
    public void setStreakUpdatedAt(LocalDateTime streakUpdatedAt) { this.streakUpdatedAt = streakUpdatedAt; }

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
