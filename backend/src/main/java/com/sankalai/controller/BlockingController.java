package com.sankalai.controller;

import com.sankalai.dto.BlockingDTO.*;
import com.sankalai.entity.User;
import com.sankalai.service.AuthService;
import com.sankalai.service.BlockingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/blocking")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BlockingController {

    private final BlockingService blockingService;
    private final AuthService authService;

    /**
     * Get user's blocked apps
     */
    @GetMapping("/apps")
    public ResponseEntity<List<BlockedAppDTO>> getBlockedApps(Authentication authentication) {
        String email = authentication.getName();
        User user = authService.getUserByEmail(email);

        List<BlockedAppDTO> apps = blockingService.getUserBlockedApps(user.getUserId());
        return ResponseEntity.ok(apps);
    }

    /**
     * Save/Update blocked apps
     */
    @PostMapping("/apps")
    public ResponseEntity<List<BlockedAppDTO>> saveBlockedApps(
            @Valid @RequestBody SaveBlockedAppsRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        User user = authService.getUserByEmail(email);

        List<BlockedAppDTO> apps = blockingService.saveUserBlockedApps(user.getUserId(), request);
        return ResponseEntity.ok(apps);
    }

    /**
     * Toggle app blocking status
     */
    @PutMapping("/apps/{appId}/toggle")
    public ResponseEntity<BlockedAppDTO> toggleAppBlocking(
            @PathVariable Integer appId,
            Authentication authentication
    ) {
        String email = authentication.getName();
        User user = authService.getUserByEmail(email);

        BlockedAppDTO app = blockingService.toggleAppBlocking(user.getUserId(), appId);
        return ResponseEntity.ok(app);
    }

    /**
     * Start a blocking session
     */
    @PostMapping("/sessions/start")
    public ResponseEntity<BlockingSessionDTO> startSession(
            @Valid @RequestBody StartSessionRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        User user = authService.getUserByEmail(email);

        BlockingSessionDTO session = blockingService.startBlockingSession(user.getUserId(), request);
        return ResponseEntity.ok(session);
    }

    /**
     * Complete a blocking session (earn rewards)
     */
    @PostMapping("/sessions/{sessionId}/complete")
    public ResponseEntity<SessionActionResponse> completeSession(
            @PathVariable String sessionId,
            Authentication authentication
    ) {
        try {
            String email = authentication.getName();
            User user = authService.getUserByEmail(email);

            SessionActionResponse response = blockingService.completeBlockingSession(
                    user.getUserId(), sessionId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new SessionActionResponse(null, null, null, e.getMessage()));
        }
    }

    /**
     * Break a blocking session (lose coins)
     */
    @PostMapping("/sessions/{sessionId}/break")
    public ResponseEntity<SessionActionResponse> breakSession(
            @PathVariable String sessionId,
            Authentication authentication
    ) {
        try {
            String email = authentication.getName();
            User user = authService.getUserByEmail(email);

            SessionActionResponse response = blockingService.breakBlockingSession(
                    user.getUserId(), sessionId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new SessionActionResponse(null, null, null, e.getMessage()));
        }
    }

    /**
     * Get active blocking sessions
     */
    @GetMapping("/sessions/active")
    public ResponseEntity<List<BlockingSessionDTO>> getActiveSessions(Authentication authentication) {
        String email = authentication.getName();
        User user = authService.getUserByEmail(email);

        List<BlockingSessionDTO> sessions = blockingService.getActiveBlockingSessions(user.getUserId());
        return ResponseEntity.ok(sessions);
    }

    /**
     * Get all blocking sessions
     */
    @GetMapping("/sessions")
    public ResponseEntity<List<BlockingSessionDTO>> getAllSessions(Authentication authentication) {
        String email = authentication.getName();
        User user = authService.getUserByEmail(email);

        List<BlockingSessionDTO> sessions = blockingService.getAllBlockingSessions(user.getUserId());
        return ResponseEntity.ok(sessions);
    }

    /**
     * Get blocking statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<BlockingStatsDTO> getBlockingStats(Authentication authentication) {
        String email = authentication.getName();
        User user = authService.getUserByEmail(email);

        BlockingStatsDTO stats = blockingService.getBlockingStats(user.getUserId());
        return ResponseEntity.ok(stats);
    }

    /**
     * Cleanup stale sessions (for debugging)
     */
    @PostMapping("/sessions/cleanup")
    public ResponseEntity<?> cleanupStaleSessions(Authentication authentication) {
        String email = authentication.getName();
        User user = authService.getUserByEmail(email);

        int cleanedCount = blockingService.cleanupStaleSessions(user.getUserId());
        return ResponseEntity.ok(new MessageResponse(
                "Cleaned up " + cleanedCount + " stale sessions"));
    }

    record MessageResponse(String message) {}
}
