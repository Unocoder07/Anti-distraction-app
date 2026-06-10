package com.sankalai.dto;

public record LeaderboardEntryDTO(
    String userId,
    String username,
    String avatar,
    Integer level,
    Long focusPoints,
    Integer rank
) {}
