package com.sankalai.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "daily_challenges")
@EntityListeners(AuditingEntityListener.class)
public class DailyChallenge {

    public enum ChallengeType {
        SESSION, TIME, STREAK, BLOCKING, DEEP_WORK, CUSTOM
    }

    public enum Difficulty {
        EASY, MEDIUM, HARD
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChallengeType type;

    @Column(nullable = false)
    private Integer progress = 0;

    @Column(nullable = false)
    private Integer total;

    @Column(nullable = false)
    private String unit;

    @Column(nullable = false)
    private Boolean completed = false;

    @Column(nullable = false)
    private Integer rewardFP;

    @Column(nullable = false)
    private Integer rewardXP;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private LocalDate date;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    // Constructor
    public DailyChallenge() {}
    public DailyChallenge(User user, String title, String description, ChallengeType type,
                         Integer progress, Integer total, String unit, Boolean completed,
                         Integer rewardFP, Integer rewardXP, Difficulty difficulty,
                         String category, LocalDate date, LocalDateTime expiresAt) {
        this.user = user;
        this.title = title;
        this.description = description;
        this.type = type;
        this.progress = progress;
        this.total = total;
        this.unit = unit;
        this.completed = completed;
        this.rewardFP = rewardFP;
        this.rewardXP = rewardXP;
        this.difficulty = difficulty;
        this.category = category;
        this.date = date;
        this.expiresAt = expiresAt;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ChallengeType getType() { return type; }
    public void setType(ChallengeType type) { this.type = type; }

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

    public Difficulty getDifficulty() { return difficulty; }
    public void setDifficulty(Difficulty difficulty) { this.difficulty = difficulty; }

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
