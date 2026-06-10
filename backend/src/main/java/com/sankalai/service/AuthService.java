package com.sankalai.service;

import java.time.LocalDateTime;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sankalai.dto.AuthRequest;
import com.sankalai.dto.AuthResponse;
import com.sankalai.dto.SignUpRequest;
import com.sankalai.entity.PetStatus;
import com.sankalai.entity.User;
import com.sankalai.entity.UserStats;
import com.sankalai.repository.PetStatusRepository;
import com.sankalai.repository.UserRepository;
import com.sankalai.repository.UserStatsRepository;
import com.sankalai.security.JwtUtil;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserStatsRepository userStatsRepository;
    private final PetStatusRepository petStatusRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    public AuthService(UserRepository userRepository, UserStatsRepository userStatsRepository,
                       PetStatusRepository petStatusRepository, PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil, AuthenticationManager authenticationManager,
                       UserDetailsService userDetailsService) {
        this.userRepository = userRepository;
        this.userStatsRepository = userStatsRepository;
        this.petStatusRepository = petStatusRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
    }

    @Transactional
    public AuthResponse signUp(SignUpRequest request) {
        // Check if email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Check if username exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken");
        }

        // Generate avatar URL
        String avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + request.getUsername();

        // Create user
        User user = new User(request.getUsername(), request.getEmail(),
                passwordEncoder.encode(request.getPassword()), avatarUrl, false);

        user = userRepository.save(user);

        // Initialize user stats
        UserStats userStats = new UserStats(user.getUserId(), 100L, 100L, 1,
                0L, 100L, 0, 0, 0, 0.0, 0, 0, 0,
                "Novice I", "Beginner", 1);

        userStatsRepository.save(userStats);

        // Initialize pet status
        PetStatus petStatus = new PetStatus(user.getUserId(), PetStatus.PetMood.HAPPY,
                50, 100, 100, "Cyber Orb", "cyber-orb", 1,
                LocalDateTime.now(), LocalDateTime.now());

        petStatusRepository.save(petStatus);

        // Generate tokens
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        return new AuthResponse(token, refreshToken, user.getUserId(), user.getUsername(),
                user.getEmail(), user.getAvatar(), "Account created successfully");
    }

    public AuthResponse signIn(AuthRequest request) {
        // Authenticate
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // Get user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update last active
        user.setLastActive(LocalDateTime.now());
        userRepository.save(user);

        // Generate tokens
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        return new AuthResponse(token, refreshToken, user.getUserId(), user.getUsername(),
                user.getEmail(), user.getAvatar(), "Sign in successful");
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
