package com.sankalai.controller;

import com.sankalai.dto.HomeDataResponse;
import com.sankalai.dto.SessionCompletionRequest;
import com.sankalai.entity.User;
import com.sankalai.service.AuthService;
import com.sankalai.service.HomeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/home")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HomeController {

    private final HomeService homeService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<HomeDataResponse> getHomeData(Authentication authentication) {
        String email = authentication.getName();
        User user = authService.getUserByEmail(email);
        
        HomeDataResponse response = homeService.getHomeData(user.getUserId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/session/complete")
    public ResponseEntity<?> completeSession(
            @Valid @RequestBody SessionCompletionRequest request,
            Authentication authentication
    ) {
        try {
            String email = authentication.getName();
            User user = authService.getUserByEmail(email);
            
            homeService.recordSessionCompletion(user.getUserId(), request);
            
            return ResponseEntity.ok(new MessageResponse("Session completed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/pet/feed")
    public ResponseEntity<?> feedPet(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = authService.getUserByEmail(email);
            
            homeService.feedPet(user.getUserId());
            
            return ResponseEntity.ok(new MessageResponse("Pet fed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/challenges")
    public ResponseEntity<?> getDailyChallenges(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = authService.getUserByEmail(email);
            
            var challenges = homeService.getDailyChallenges(user.getUserId());
            
            return ResponseEntity.ok(challenges);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    // Inner classes for responses
    record ErrorResponse(String error) {}
    record MessageResponse(String message) {}
}
