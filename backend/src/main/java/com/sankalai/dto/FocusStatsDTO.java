package com.sankalai.dto;

public record FocusStatsDTO(
    Integer totalSessions,
    Integer totalMinutes,
    Integer totalDeepWorkSessions,
    Integer averageFocusScore,
    Integer totalFPEarned,
    Integer totalXPEarned
) {}
