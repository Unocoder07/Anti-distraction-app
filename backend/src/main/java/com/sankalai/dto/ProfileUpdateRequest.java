package com.sankalai.dto;

import jakarta.validation.constraints.Size;
import java.util.List;

public record ProfileUpdateRequest(
    @Size(min = 3, max = 30) String username,
    String avatar,
    String exam,
    String examName,
    List<String> subjects
) {}
