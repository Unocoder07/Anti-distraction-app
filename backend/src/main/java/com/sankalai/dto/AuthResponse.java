package com.sankalai.dto;

public class AuthResponse {

    private String token;

    private String refreshToken;

    private String userId;

    private String username;

    private String email;

    private String avatar;

    private String exam;

    private String examName;

    private String message;

    // Constructor
    public AuthResponse() {}
    public AuthResponse(String token, String refreshToken, String userId, String username,
                        String email, String avatar, String exam, String examName, String message) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.avatar = avatar;
        this.exam = exam;
        this.examName = examName;
        this.message = message;
    }

    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getExam() { return exam; }
    public void setExam(String exam) { this.exam = exam; }

    public String getExamName() { return examName; }
    public void setExamName(String examName) { this.examName = examName; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
