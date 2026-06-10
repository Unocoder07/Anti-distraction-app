package com.sankalai.entity;

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
@Table(name = "blocking_sessions")
@EntityListeners(AuditingEntityListener.class)
public class BlockingSession {

    public enum SessionStatus {
        ACTIVE, COMPLETED, BROKEN
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer appId;

    @Column(nullable = false)
    private String appName;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private Integer duration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.ACTIVE;

    @Column(nullable = false)
    private Integer coinsEarned = 0;

    @Column(nullable = false)
    private Integer coinsLost = 0;

    private LocalDateTime completedAt;

    private LocalDateTime brokenAt;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Constructor
    public BlockingSession() {}
    public BlockingSession(Integer appId, String appName, LocalDateTime startTime, Integer duration, SessionStatus status, Integer coinsEarned, Integer coinsLost) {
        this.appId = appId;
        this.appName = appName;
        this.startTime = startTime;
        this.duration = duration;
        this.status = status;
        this.coinsEarned = coinsEarned;
        this.coinsLost = coinsLost;
    }

    public BlockingSession(User user, Integer appId, String appName, LocalDateTime startTime, Integer duration, SessionStatus status, Integer coinsEarned, Integer coinsLost) {
        this.user = user;
        this.appId = appId;
        this.appName = appName;
        this.startTime = startTime;
        this.duration = duration;
        this.status = status;
        this.coinsEarned = coinsEarned;
        this.coinsLost = coinsLost;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Integer getAppId() { return appId; }
    public void setAppId(Integer appId) { this.appId = appId; }

    public String getAppName() { return appName; }
    public void setAppName(String appName) { this.appName = appName; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }

    public SessionStatus getStatus() { return status; }
    public void setStatus(SessionStatus status) { this.status = status; }

    public Integer getCoinsEarned() { return coinsEarned; }
    public void setCoinsEarned(Integer coinsEarned) { this.coinsEarned = coinsEarned; }

    public Integer getCoinsLost() { return coinsLost; }
    public void setCoinsLost(Integer coinsLost) { this.coinsLost = coinsLost; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getBrokenAt() { return brokenAt; }
    public void setBrokenAt(LocalDateTime brokenAt) { this.brokenAt = brokenAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
