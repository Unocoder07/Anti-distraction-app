package com.sankalai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartSessionRequest {
    @NotNull
    @Min(1)
    private Integer duration;

    @Min(1)
    private Integer cycles;

    private String subjectId;
    private String subjectName;
    private String subjectIcon;
    private String subjectColor;
    private String origin;
}
