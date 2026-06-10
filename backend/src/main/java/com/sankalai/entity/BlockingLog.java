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
@Table(name = "blocking_logs")
@EntityListeners(AuditingEntityListener.class)
public class BlockingLog {

    public enum LogAction {
        BLOCK, UNBLOCK, SESSION_START, SESSION_COMPLETE, SESSION_BROKEN
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LogAction action;

    @Column(nullable = false)
    private Integer coinsChange;

    private String sessionId;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    // Constructor
    public BlockingLog() {}
    public BlockingLog(Integer appId, String appName, LogAction action, Integer coinsChange, String sessionId) {
        this.appId = appId;
        this.appName = appName;
        this.action = action;
        this.coinsChange = coinsChange;
        this.sessionId = sessionId;
    }

    public BlockingLog(User user, Integer appId, String appName, LogAction action, Integer coinsChange, String sessionId) {
        this.user = user;
        this.appId = appId;
        this.appName = appName;
        this.action = action;
        this.coinsChange = coinsChange;
        this.sessionId = sessionId;
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

    public LogAction getAction() { return action; }
    public void setAction(LogAction action) { this.action = action; }

    public Integer getCoinsChange() { return coinsChange; }
    public void setCoinsChange(Integer coinsChange) { this.coinsChange = coinsChange; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public LocalDateTime getTimestamp() { return timestamp; }

    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
