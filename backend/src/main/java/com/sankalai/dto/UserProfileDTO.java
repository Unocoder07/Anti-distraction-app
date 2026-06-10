package com.sankalai.dto;

import java.time.LocalDateTime;
import java.util.List;

public record UserProfileDTO(
    String userId,
    String username,
    String email,
    String avatar,
    String exam,
    String examName,
    List<String> subjects,
    Boolean emailVerified,
    Integer level,
    Long focusPoints,
    Integer totalSessions,
    Integer totalHours,
    Integer currentStreak,
    Integer totalAchievements,
    Integer unlockedAchievements,
    Integer globalRank,
    LocalDateTime joinedAt,
    LocalDateTime lastActive
) {}
