package com.sankalai.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.sankalai.dto.AuthRequest;
import com.sankalai.dto.AuthResponse;
import com.sankalai.dto.GoogleSignInRequest;
import com.sankalai.dto.SignUpRequest;
import com.sankalai.entity.PetStatus;
import com.sankalai.entity.User;
import com.sankalai.entity.UserStats;
import com.sankalai.exception.BadRequestException;
import com.sankalai.exception.ConflictException;
import com.sankalai.exception.ResourceNotFoundException;
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
    private final RestTemplate restTemplate;
    private final Set<String> googleClientIds;

    public AuthService(UserRepository userRepository, UserStatsRepository userStatsRepository,
                       PetStatusRepository petStatusRepository, PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil, AuthenticationManager authenticationManager,
                       RestTemplate restTemplate,
                       @Value("${google.client-ids:}") String googleClientIds) {
        this.userRepository = userRepository;
        this.userStatsRepository = userStatsRepository;
        this.petStatusRepository = petStatusRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.restTemplate = restTemplate;
        this.googleClientIds = Arrays.stream(googleClientIds.split(","))
                .map(String::trim)
                .filter(clientId -> !clientId.isEmpty())
                .collect(Collectors.toSet());
    }

    @Transactional
    public AuthResponse signUp(SignUpRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        // Check if email exists
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ConflictException("Email already registered");
        }

        // Check if username exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username already taken");
        }

        // Generate avatar URL
        String avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + request.getUsername();

        // Create user
        User user = new User(request.getUsername(), normalizedEmail,
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

        // Generate tokens without extra DB query
        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPassword(), new ArrayList<>());
        String token = jwtUtil.generateToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        return new AuthResponse(token, refreshToken, user.getUserId(), user.getUsername(),
                user.getEmail(), user.getAvatar(), user.getExam(), user.getExamName(), "Account created successfully");
    }

    public AuthResponse signIn(AuthRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        // Authenticate
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        normalizedEmail,
                        request.getPassword()
                )
        );

        // Get user
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Update last active
        user.setLastActive(LocalDateTime.now());
        userRepository.save(user);

        // Generate tokens without extra DB query
        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPassword(), new ArrayList<>());
        String token = jwtUtil.generateToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        return new AuthResponse(token, refreshToken, user.getUserId(), user.getUsername(),
                user.getEmail(), user.getAvatar(), user.getExam(), user.getExamName(), "Sign in successful");
    }

    @Transactional
    public AuthResponse signInWithGoogle(GoogleSignInRequest request) {
        if (googleClientIds.isEmpty()) {
            throw new BadRequestException("Google Sign-In is not configured");
        }

        GoogleTokenInfo tokenInfo = verifyGoogleIdToken(request.getIdToken());
        String normalizedEmail = tokenInfo.email().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseGet(() -> createGoogleUser(normalizedEmail, tokenInfo));

        user.setLastActive(LocalDateTime.now());
        if (tokenInfo.picture() != null && !tokenInfo.picture().isBlank()) {
            user.setAvatar(tokenInfo.picture());
        }
        userRepository.save(user);

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPassword(), new ArrayList<>());
        String token = jwtUtil.generateToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        return new AuthResponse(token, refreshToken, user.getUserId(), user.getUsername(),
                user.getEmail(), user.getAvatar(), user.getExam(), user.getExamName(), "Google sign in successful");
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private GoogleTokenInfo verifyGoogleIdToken(String idToken) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(
                    "https://oauth2.googleapis.com/tokeninfo?id_token={idToken}",
                    Map.class,
                    idToken
            );

            if (response == null) {
                throw new BadRequestException("Invalid Google Sign-In response");
            }

            String audience = valueAsString(response.get("aud"));
            if (!googleClientIds.contains(audience)) {
                throw new BadRequestException("Invalid Google Sign-In audience");
            }

            String email = valueAsString(response.get("email"));
            if (email == null || email.isBlank()) {
                throw new BadRequestException("Google account email is missing");
            }

            String emailVerified = Optional.ofNullable(valueAsString(response.get("email_verified")))
                    .orElse("false");
            if (!Boolean.parseBoolean(emailVerified)) {
                throw new BadRequestException("Google account email is not verified");
            }

            return new GoogleTokenInfo(
                    email,
                    valueAsString(response.get("name")),
                    valueAsString(response.get("picture"))
            );
        } catch (RestClientException e) {
            throw new BadRequestException("Google Sign-In verification failed");
        }
    }

    private User createGoogleUser(String email, GoogleTokenInfo tokenInfo) {
        String username = buildGoogleUsername(tokenInfo.name(), email);
        String avatarUrl = tokenInfo.picture();
        if (avatarUrl == null || avatarUrl.isBlank()) {
            avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + username;
        }

        User user = new User(username, email,
                passwordEncoder.encode("google:" + email), avatarUrl, true);
        user = userRepository.save(user);

        UserStats userStats = new UserStats(user.getUserId(), 100L, 100L, 1,
                0L, 100L, 0, 0, 0, 0.0, 0, 0, 0,
                "Novice I", "Beginner", 1);
        userStatsRepository.save(userStats);

        PetStatus petStatus = new PetStatus(user.getUserId(), PetStatus.PetMood.HAPPY,
                50, 100, 100, "Cyber Orb", "cyber-orb", 1,
                LocalDateTime.now(), LocalDateTime.now());
        petStatusRepository.save(petStatus);

        return user;
    }

    private String buildGoogleUsername(String name, String email) {
        String base = Optional.ofNullable(name)
                .filter(candidate -> !candidate.isBlank())
                .orElse(email.substring(0, email.indexOf("@")))
                .replaceAll("[^A-Za-z0-9_]", "")
                .toLowerCase();

        if (base.length() < 3) {
            base = "user" + base;
        }

        String username = base;
        int suffix = 1;
        while (userRepository.existsByUsername(username)) {
            username = base + suffix;
            suffix++;
        }

        return username;
    }

    private String valueAsString(Object value) {
        return value == null ? null : value.toString();
    }

    private record GoogleTokenInfo(String email, String name, String picture) {}
}
