package com.sankalai.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "pet_status")
@EntityListeners(AuditingEntityListener.class)
public class PetStatus {

    public enum PetMood {
        OPTIMAL, HAPPY, TIRED, SAD
    }

    @Id
    @Column(name = "user_id")
    private String userId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PetMood mood = PetMood.HAPPY;

    @Column(nullable = false)
    private Integer loyalty = 50;

    @Column(nullable = false)
    private Integer health = 100;

    @Column(nullable = false)
    private Integer energy = 100;

    @Column(nullable = false)
    private String name = "Cyber Orb";

    @Column(nullable = false)
    private String type = "cyber-orb";

    @Column(nullable = false)
    private Integer level = 1;

    @Column(nullable = false)
    private LocalDateTime lastFed;

    @Column(nullable = false)
    private LocalDateTime lastPlayed;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // Constructor
    public PetStatus() {}
    public PetStatus(String userId, PetMood mood, Integer loyalty, Integer health, Integer energy,
                     String name, String type, Integer level, LocalDateTime lastFed, LocalDateTime lastPlayed) {
        this.userId = userId;
        this.mood = mood;
        this.loyalty = loyalty;
        this.health = health;
        this.energy = energy;
        this.name = name;
        this.type = type;
        this.level = level;
        this.lastFed = lastFed;
        this.lastPlayed = lastPlayed;
    }

    // Getters and Setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public PetMood getMood() { return mood; }
    public void setMood(PetMood mood) { this.mood = mood; }

    public Integer getLoyalty() { return loyalty; }
    public void setLoyalty(Integer loyalty) { this.loyalty = loyalty; }

    public Integer getHealth() { return health; }
    public void setHealth(Integer health) { this.health = health; }

    public Integer getEnergy() { return energy; }
    public void setEnergy(Integer energy) { this.energy = energy; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }

    public LocalDateTime getLastFed() { return lastFed; }
    public void setLastFed(LocalDateTime lastFed) { this.lastFed = lastFed; }

    public LocalDateTime getLastPlayed() { return lastPlayed; }
    public void setLastPlayed(LocalDateTime lastPlayed) { this.lastPlayed = lastPlayed; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
