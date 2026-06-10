package com.sankalai.dto;

import java.time.LocalDateTime;

public record AchievementDTO(
    String id,
    String title,
    String description,
    String icon,
    String rarity,
    String category,
    Boolean unlocked,
    LocalDateTime unlockedAt,
    Integer progress,
    Integer requirement,
    Integer currentValue
) {}
