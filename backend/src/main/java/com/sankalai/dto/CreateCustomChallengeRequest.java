package com.sankalai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateCustomChallengeRequest {

    @NotBlank(message = "Target title is required")
    @Size(max = 80, message = "Target title must be 80 characters or less")
    private String title;

    @Size(max = 160, message = "Target description must be 160 characters or less")
    private String description;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
