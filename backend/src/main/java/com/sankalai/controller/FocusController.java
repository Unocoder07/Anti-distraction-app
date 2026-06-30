package com.sankalai.controller;

import com.sankalai.dto.FocusSessionDTO;
import com.sankalai.dto.StartSessionRequest;
import com.sankalai.dto.CompleteSessionRequest;
import com.sankalai.dto.BreakSessionRequest;
import com.sankalai.entity.User;
import com.sankalai.service.AuthService;
import com.sankalai.service.FocusService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/focus")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FocusController {

    private final FocusService focusService;
    private final AuthService authService;

    /**
     * Start a new focus session
     */
    @PostMapping("/sessions/start")
    public ResponseEntity<?> startSession(
            @Valid @RequestBody StartSessionRequest request,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = authService.getUserByEmail(email);

            FocusService.SubjectInfo subject = null;
            if (request.getSubjectId() != null) {
                subject = new FocusService.SubjectInfo(
                        request.getSubjectId(),
                        request.getSubjectName(),
                        request.getSubjectIcon(),
                        request.getSubjectColor());
            }

            var session = focusService.startFocusSession(
                    user.getUserId(),
                    request.getDuration(),
                    request.getCycles(),
                    subject,
                    request.getOrigin());

            return ResponseEntity.ok(mapToDTO(session));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Complete a focus session
     */
    @PostMapping("/sessions/{sessionId}/complete")
    public ResponseEntity<?> completeSession(
            @PathVariable String sessionId,
            @Valid @RequestBody CompleteSessionRequest request,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = authService.getUserByEmail(email);

            var response = focusService.completeFocusSession(
                    sessionId,
                    user.getUserId(),
                    request.getActualDuration(),
                    request.getCyclesCompleted(),
                    request.getDistractionCount(),
                    request.getPauseCount());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Break a focus session
     */
    @PostMapping("/sessions/{sessionId}/break")
    public ResponseEntity<?> breakSession(
            @PathVariable String sessionId,
            @Valid @RequestBody BreakSessionRequest request,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = authService.getUserByEmail(email);

            focusService.breakFocusSession(sessionId, user.getUserId(), request.getActualDuration());

            return ResponseEntity.ok(new MessageResponse("Session broken successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Pause a focus session
     */
    @PostMapping("/sessions/{sessionId}/pause")
    public ResponseEntity<?> pauseSession(
            @PathVariable String sessionId,
            Authentication authentication) {
        try {
            focusService.pauseFocusSession(sessionId);
            return ResponseEntity.ok(new MessageResponse("Session paused successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Resume a focus session
     */
    @PostMapping("/sessions/{sessionId}/resume")
    public ResponseEntity<?> resumeSession(
            @PathVariable String sessionId,
            Authentication authentication) {
        try {
            focusService.resumeFocusSession(sessionId);
            return ResponseEntity.ok(new MessageResponse("Session resumed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Record distraction
     */
    @PostMapping("/sessions/{sessionId}/distraction")
    public ResponseEntity<?> recordDistraction(
            @PathVariable String sessionId,
            Authentication authentication) {
        try {
            focusService.recordDistraction(sessionId);
            return ResponseEntity.ok(new MessageResponse("Distraction recorded"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Delete a focus session
     */
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<?> deleteSession(
            @PathVariable String sessionId,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = authService.getUserByEmail(email);

            focusService.deleteFocusSession(sessionId, user.getUserId());

            return ResponseEntity.ok(new MessageResponse("Session deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Get user's focus sessions
     */
    @GetMapping("/sessions")
    public ResponseEntity<?> getUserSessions(
            @RequestParam(defaultValue = "30") Integer limit,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = authService.getUserByEmail(email);

            var sessions = focusService.getUserSessions(user.getUserId(), limit);
            return ResponseEntity.ok(sessions.stream().map(this::mapToDTO).toList());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Get subject study data
     */
    @GetMapping("/subjects")
    public ResponseEntity<?> getSubjectStudyData(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = authService.getUserByEmail(email);

            var subjects = focusService.getSubjectStudyData(user.getUserId());
            return ResponseEntity.ok(subjects);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Get focus statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getFocusStats(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = authService.getUserByEmail(email);

            var stats = focusService.getFocusStats(user.getUserId());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    // Helper methods
    private FocusSessionDTO mapToDTO(com.sankalai.entity.FocusSession session) {
        return FocusSessionDTO.builder()
                .id(session.getId())
                .userId(session.getUser().getUserId())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .duration(session.getDuration())
                .actualDuration(session.getActualDuration())
                .type(session.getType().name().toLowerCase())
                .cycles(session.getCycles())
                .cyclesCompleted(session.getCyclesCompleted())
                .subject(session.getSubject())
                .subjectId(session.getSubjectId())
                .subjectIcon(session.getSubjectIcon())
                .subjectColor(session.getSubjectColor())
                .origin(session.getOrigin())
                .status(session.getStatus().name().toLowerCase())
                .focusPointsEarned(session.getFocusPointsEarned())
                .xpEarned(session.getXpEarned())
                .distractionCount(session.getDistractionCount())
                .focusScore(session.getFocusScore())
                .pauseCount(session.getPauseCount())
                .createdAt(session.getCreatedAt())
                .completedAt(session.getCompletedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }

    // Inner classes for responses
    record ErrorResponse(String error) {
    }

    record MessageResponse(String message) {
    }
}
