package com.sankalai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FocusSessionDTO {
    private String id;
    private String userId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer duration;
    private Integer actualDuration;
    private String type;
    private Integer cycles;
    private Integer cyclesCompleted;
    private String subject;
    private String subjectId;
    private String subjectIcon;
    private String subjectColor;
    private String origin;
    private String status;
    private Integer focusPointsEarned;
    private Integer xpEarned;
    private Integer distractionCount;
    private Integer focusScore;
    private Integer pauseCount;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private LocalDateTime updatedAt;
}
