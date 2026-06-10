package com.sankalai.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class SessionCompletionRequest {

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer durationMinutes;

    @NotNull(message = "Focus score is required")
    @Min(value = 0, message = "Focus score must be between 0 and 100")
    private Integer focusScore;

    private String sessionType;
    
    private String subject;

    // Constructor
    public SessionCompletionRequest() {}
    public SessionCompletionRequest(Integer durationMinutes, Integer focusScore, String sessionType, String subject) {
        this.durationMinutes = durationMinutes;
        this.focusScore = focusScore;
        this.sessionType = sessionType;
        this.subject = subject;
    }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public Integer getFocusScore() { return focusScore; }
    public void setFocusScore(Integer focusScore) { this.focusScore = focusScore; }

    public String getSessionType() { return sessionType; }
    public void setSessionType(String sessionType) { this.sessionType = sessionType; }

    public String getSubject() { return subject; }

    public void setSubject(String subject) { this.subject = subject; }
}
