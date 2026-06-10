package com.sankalai.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "blocked_apps")
@EntityListeners(AuditingEntityListener.class)
public class BlockedApp {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer appId;

    @Column(nullable = false)
    private String appName;

    @Column(nullable = false)
    private String category;

    private String icon;

    private String logo;

    @Column(nullable = false)
    private Boolean blocked = false;

    private String packageName;

    private String bundleId;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // Constructor
    public BlockedApp() {}
    public BlockedApp(Integer appId, String appName, String category, String icon, String logo, Boolean blocked, String packageName, String bundleId) {
        this.appId = appId;
        this.appName = appName;
        this.category = category;
        this.icon = icon;
        this.logo = logo;
        this.blocked = blocked;
        this.packageName = packageName;
        this.bundleId = bundleId;
    }

    public BlockedApp(User user, Integer appId, String appName, String category, String icon, String logo, Boolean blocked, String packageName, String bundleId) {
        this.user = user;
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
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Integer getAppId() { return appId; }
    public void setAppId(Integer appId) { this.appId = appId; }

    public String getAppName() { return appName; }
    public void setAppName(String appName) { this.appName = appName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getLogo() { return logo; }
    public void setLogo(String logo) { this.logo = logo; }

    public Boolean getBlocked() { return blocked; }
    public void setBlocked(Boolean blocked) { this.blocked = blocked; }

    public String getPackageName() { return packageName; }
    public void setPackageName(String packageName) { this.packageName = packageName; }

    public String getBundleId() { return bundleId; }
    public void setBundleId(String bundleId) { this.bundleId = bundleId; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
