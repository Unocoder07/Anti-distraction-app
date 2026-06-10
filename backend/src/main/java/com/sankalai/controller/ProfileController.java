package com.sankalai.controller;

import com.sankalai.dto.UserProfileDTO;
import com.sankalai.dto.AchievementDTO;
import com.sankalai.dto.LeaderboardEntryDTO;
import com.sankalai.dto.ProfileUpdateRequest;
import com.sankalai.entity.User;
import com.sankalai.service.AuthService;
import com.sankalai.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProfileController {

    private final ProfileService profileService;
    private final AuthService authService;

    /**
     * Get user profile
     */
    @GetMapping
    public ResponseEntity<UserProfileDTO> getProfile(Authentication authentication) {
        String email = authentication.getName();
        User user = authService.getUserByEmail(email);

        UserProfileDTO profile = profileService.getUserProfile(user.getUserId());
        return ResponseEntity.ok(profile);
    }

    /**
     * Get user achievements
     */
    @GetMapping("/achievements")
    public ResponseEntity<List<AchievementDTO>> getAchievements(Authentication authentication) {
        String email = authentication.getName();
        User user = authService.getUserByEmail(email);

        List<AchievementDTO> achievements = profileService.getUserAchievements(user.getUserId());
        return ResponseEntity.ok(achievements);
    }

    /**
     * Check and unlock achievements
     */
    @PostMapping("/achievements/check")
    public ResponseEntity<?> checkAchievements(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = authService.getUserByEmail(email);

            profileService.checkAndUnlockAchievements(user.getUserId());

            return ResponseEntity.ok(new MessageResponse("Achievements checked successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Get leaderboard
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntryDTO>> getLeaderboard(
            @RequestParam(defaultValue = "50") Integer limit) {
        List<LeaderboardEntryDTO> leaderboard = profileService.getLeaderboard(limit);
        return ResponseEntity.ok(leaderboard);
    }

    /**
     * Update user profile
     */
    @PutMapping
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody ProfileUpdateRequest request,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = authService.getUserByEmail(email);

            profileService.updateUserProfile(user.getUserId(), request);

            return ResponseEntity.ok(new MessageResponse("Profile updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    // Inner classes for responses
    record ErrorResponse(String error) {
    }

    record MessageResponse(String message) {
    }
}
