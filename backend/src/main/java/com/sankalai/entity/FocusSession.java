package com.sankalai.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
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
@Table(name = "focus_sessions")
@EntityListeners(AuditingEntityListener.class)
public class FocusSession {

    public enum SessionType {
        POMODORO, DEEP_WORK, CUSTOM
    }

    public enum SessionStatus {
        ACTIVE, COMPLETED, BROKEN, PAUSED
    }

    public enum LegacySessionType {
        STUDY, WORK, READING, MEDITATION, OTHER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @Column(nullable = false)
    private Integer duration;

    private Integer actualDuration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionType type = SessionType.CUSTOM;

    @Column(nullable = false)
    private Integer cycles = 1;

    @Column(nullable = false)
    private Integer cyclesCompleted = 0;

    private String subject;

    private String subjectId;

    private String subjectIcon;

    private String subjectColor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.ACTIVE;

    @Column(nullable = false)
    private Integer focusPointsEarned = 0;

    @Column(nullable = false)
    private Integer xpEarned = 0;

    @Column(nullable = false)
    private Integer distractionCount = 0;

    @Column(nullable = false)
    private Integer focusScore = 100;

    @Column(nullable = false)
    private Integer pauseCount = 0;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // Legacy fields for backward compatibility
    @Column(nullable = false)
    private Boolean isDeepWork = false;

    @Column(nullable = false)
    private Boolean completed = false;

    @Column(nullable = false)
    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LegacySessionType sessionType = LegacySessionType.STUDY;

    // Constructor
    public FocusSession() {}
    public FocusSession(User user, LocalDateTime startTime, Integer duration, SessionType type,
                        Integer cycles, Integer cyclesCompleted, SessionStatus status,
                        Integer focusPointsEarned, Integer xpEarned, Integer distractionCount,
                        Integer focusScore, Integer pauseCount) {
        this.user = user;
        this.startTime = startTime;
        this.duration = duration;
        this.type = type;
        this.cycles = cycles;
        this.cyclesCompleted = cyclesCompleted;
        this.status = status;
        this.focusPointsEarned = focusPointsEarned;
        this.xpEarned = xpEarned;
        this.distractionCount = distractionCount;
        this.focusScore = focusScore;
        this.pauseCount = pauseCount;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }

    public Integer getActualDuration() { return actualDuration; }
    public void setActualDuration(Integer actualDuration) { this.actualDuration = actualDuration; }

    public SessionType getType() { return type; }
    public void setType(SessionType type) { this.type = type; }

    public Integer getCycles() { return cycles; }
    public void setCycles(Integer cycles) { this.cycles = cycles; }

    public Integer getCyclesCompleted() { return cyclesCompleted; }
    public void setCyclesCompleted(Integer cyclesCompleted) { this.cyclesCompleted = cyclesCompleted; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }

    public String getSubjectIcon() { return subjectIcon; }
    public void setSubjectIcon(String subjectIcon) { this.subjectIcon = subjectIcon; }

    public String getSubjectColor() { return subjectColor; }
    public void setSubjectColor(String subjectColor) { this.subjectColor = subjectColor; }

    public SessionStatus getStatus() { return status; }
    public void setStatus(SessionStatus status) { this.status = status; }

    public Integer getFocusPointsEarned() { return focusPointsEarned; }
    public void setFocusPointsEarned(Integer focusPointsEarned) { this.focusPointsEarned = focusPointsEarned; }

    public Integer getXpEarned() { return xpEarned; }
    public void setXpEarned(Integer xpEarned) { this.xpEarned = xpEarned; }

    public Integer getDistractionCount() { return distractionCount; }
    public void setDistractionCount(Integer distractionCount) { this.distractionCount = distractionCount; }

    public Integer getFocusScore() { return focusScore; }
    public void setFocusScore(Integer focusScore) { this.focusScore = focusScore; }

    public Integer getPauseCount() { return pauseCount; }
    public void setPauseCount(Integer pauseCount) { this.pauseCount = pauseCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getIsDeepWork() { return isDeepWork; }
    public void setIsDeepWork(Boolean isDeepWork) { this.isDeepWork = isDeepWork; }

    public Boolean getCompleted() { return completed; }
    public void setCompleted(Boolean completed) { this.completed = completed; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public LegacySessionType getSessionType() { return sessionType; }

    public void setSessionType(LegacySessionType sessionType) { this.sessionType = sessionType; }
}
