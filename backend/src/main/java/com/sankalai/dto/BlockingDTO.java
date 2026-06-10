package com.sankalai.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class BlockingDTO {

    public static class BlockedAppDTO {
        private String id;
        private Integer appId;
        private String appName;
        private String category;
        private String icon;
        private String logo;
        private Boolean blocked;
        private String packageName;
        private String bundleId;
        private LocalDateTime updatedAt;

        // Constructor
        public BlockedAppDTO() {
        }

        public BlockedAppDTO(String id, Integer appId, String appName, String category, String icon, String logo,
                Boolean blocked, String packageName, String bundleId, LocalDateTime updatedAt) {
            this.id = id;
            this.appId = appId;
            this.appName = appName;
            this.category = category;
            this.icon = icon;
            this.logo = logo;
            this.blocked = blocked;
            this.packageName = packageName;
            this.bundleId = bundleId;
            this.updatedAt = updatedAt;
        }

        // Getters and Setters
        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public Integer getAppId() {
            return appId;
        }

        public void setAppId(Integer appId) {
            this.appId = appId;
        }

        public String getAppName() {
            return appName;
        }

        public void setAppName(String appName) {
            this.appName = appName;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public String getIcon() {
            return icon;
        }

        public void setIcon(String icon) {
            this.icon = icon;
        }

        public String getLogo() {
            return logo;
        }

        public void setLogo(String logo) {
            this.logo = logo;
        }

        public Boolean getBlocked() {
            return blocked;
        }

        public void setBlocked(Boolean blocked) {
            this.blocked = blocked;
        }

        public String getPackageName() {
            return packageName;
        }

        public void setPackageName(String packageName) {
            this.packageName = packageName;
        }

        public String getBundleId() {
            return bundleId;
        }

        public void setBundleId(String bundleId) {
            this.bundleId = bundleId;
        }

        public LocalDateTime getUpdatedAt() {
            return updatedAt;
        }

        public void setUpdatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
        }
    }

    public static class BlockingSessionDTO {
        private String id;
        private Integer appId;
        private String appName;
        private LocalDateTime startTime;
        private Integer duration;
        private String status;
        private Integer coinsEarned;
        private Integer coinsLost;
        private LocalDateTime completedAt;
        private LocalDateTime brokenAt;
        private LocalDateTime createdAt;

        // Constructor
        public BlockingSessionDTO() {
        }

        public BlockingSessionDTO(String id, Integer appId, String appName, LocalDateTime startTime, Integer duration,
                String status, Integer coinsEarned, Integer coinsLost, LocalDateTime completedAt,
                LocalDateTime brokenAt, LocalDateTime createdAt) {
            this.id = id;
            this.appId = appId;
            this.appName = appName;
            this.startTime = startTime;
            this.duration = duration;
            this.status = status;
            this.coinsEarned = coinsEarned;
            this.coinsLost = coinsLost;
            this.completedAt = completedAt;
            this.brokenAt = brokenAt;
            this.createdAt = createdAt;
        }

        // Getters and Setters
        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public Integer getAppId() {
            return appId;
        }

        public void setAppId(Integer appId) {
            this.appId = appId;
        }

        public String getAppName() {
            return appName;
        }

        public void setAppName(String appName) {
            this.appName = appName;
        }

        public LocalDateTime getStartTime() {
            return startTime;
        }

        public void setStartTime(LocalDateTime startTime) {
            this.startTime = startTime;
        }

        public Integer getDuration() {
            return duration;
        }

        public void setDuration(Integer duration) {
            this.duration = duration;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public Integer getCoinsEarned() {
            return coinsEarned;
        }

        public void setCoinsEarned(Integer coinsEarned) {
            this.coinsEarned = coinsEarned;
        }

        public Integer getCoinsLost() {
            return coinsLost;
        }

        public void setCoinsLost(Integer coinsLost) {
            this.coinsLost = coinsLost;
        }

        public LocalDateTime getCompletedAt() {
            return completedAt;
        }

        public void setCompletedAt(LocalDateTime completedAt) {
            this.completedAt = completedAt;
        }

        public LocalDateTime getBrokenAt() {
            return brokenAt;
        }

        public void setBrokenAt(LocalDateTime brokenAt) {
            this.brokenAt = brokenAt;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }
    }

    public record BlockingStatsDTO(
        Integer totalSessions,
        Integer completedSessions,
        Integer brokenSessions,
        Integer totalCoinsEarned,
        Integer totalCoinsLost,
        Double successRate
    ) {}

    public static class SaveBlockedAppsRequest {
        private List<BlockedAppRequest> apps;

        // Constructor
        public SaveBlockedAppsRequest() {
        }

        public SaveBlockedAppsRequest(List<BlockedAppRequest> apps) {
            this.apps = apps;
        }

        // Getters and Setters
        public List<BlockedAppRequest> getApps() {
            return apps;
        }

        public void setApps(List<BlockedAppRequest> apps) {
            this.apps = apps;
        }
    }

    public static class BlockedAppRequest {
        private Integer appId;
        private String appName;
        private String category;
        private String icon;
        private String logo;
        private Boolean blocked;
        private String packageName;
        private String bundleId;

        // Constructor
        public BlockedAppRequest() {
        }

        public BlockedAppRequest(Integer appId, String appName, String category, String icon, String logo,
                Boolean blocked, String packageName, String bundleId) {
            this.appId = appId;
            this.appName = appName;
            this.category = category;
            this.icon = icon;
            this.logo = logo;
            this.blocked = blocked;
            this.packageName = packageName;
            this.bundleId = bundleId;
        }

        // Getters and Setters
        public Integer getAppId() {
            return appId;
        }

        public void setAppId(Integer appId) {
            this.appId = appId;
        }

        public String getAppName() {
            return appName;
        }

        public void setAppName(String appName) {
            this.appName = appName;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public String getIcon() {
            return icon;
        }

        public void setIcon(String icon) {
            this.icon = icon;
        }

        public String getLogo() {
            return logo;
        }

        public void setLogo(String logo) {
            this.logo = logo;
        }

        public Boolean getBlocked() {
            return blocked;
        }

        public void setBlocked(Boolean blocked) {
            this.blocked = blocked;
        }

        public String getPackageName() {
            return packageName;
        }

        public void setPackageName(String packageName) {
            this.packageName = packageName;
        }

        public String getBundleId() {
            return bundleId;
        }

        public void setBundleId(String bundleId) {
            this.bundleId = bundleId;
        }
    }

    public static class StartSessionRequest {
        private Integer appId;
        private String appName;
        private Integer duration;

        // Constructor
        public StartSessionRequest() {
        }

        public StartSessionRequest(Integer appId, String appName, Integer duration) {
            this.appId = appId;
            this.appName = appName;
            this.duration = duration;
        }

        // Getters and Setters
        public Integer getAppId() {
            return appId;
        }

        public void setAppId(Integer appId) {
            this.appId = appId;
        }

        public String getAppName() {
            return appName;
        }

        public void setAppName(String appName) {
            this.appName = appName;
        }

        public Integer getDuration() {
            return duration;
        }

        public void setDuration(Integer duration) {
            this.duration = duration;
        }
    }

    public record SessionActionResponse(
        String sessionId,
        Integer coinsChange,
        Integer currentCoins,
        String message
    ) {}
}
