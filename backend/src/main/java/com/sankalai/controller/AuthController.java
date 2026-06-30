package com.sankalai.controller;

import com.sankalai.dto.AuthRequest;
import com.sankalai.dto.AuthResponse;
import com.sankalai.dto.GoogleSignInRequest;
import com.sankalai.dto.SignUpRequest;
import com.sankalai.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@Valid @RequestBody SignUpRequest request) {
        // Validation/conflict/other errors are mapped centrally by GlobalExceptionHandler
        // (e.g. duplicate email/username → 409 Conflict).
        AuthResponse response = authService.signUp(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/signin")
    public ResponseEntity<?> signIn(@Valid @RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.signIn(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid email or password"));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> signInWithGoogle(@Valid @RequestBody GoogleSignInRequest request) {
        try {
            AuthResponse response = authService.signInWithGoogle(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/signout")
    public ResponseEntity<?> signOut() {
        return ResponseEntity.ok(new MessageResponse("Signed out successfully"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        // Password reset email would be sent via email service in production
        return ResponseEntity.ok(new MessageResponse(
                "If an account exists for " + request.email() + ", reset instructions have been sent."
        ));
    }

    record ResetPasswordRequest(String email) {}

    // Inner classes for responses
    record ErrorResponse(String error) {}
    record MessageResponse(String message) {}
}
