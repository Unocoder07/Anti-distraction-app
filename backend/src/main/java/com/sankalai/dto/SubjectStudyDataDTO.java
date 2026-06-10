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
public class SubjectStudyDataDTO {
    private String subjectId;
    private String subjectName;
    private String icon;
    private String color;
    private Integer totalMinutes;
    private Integer totalSessions;
    private LocalDateTime lastStudied;
    private Integer averageSessionLength;
}
