package com.sankalai.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sankalai.dto.BlockingDTO.BlockedAppDTO;
import com.sankalai.dto.BlockingDTO.BlockingSessionDTO;
import com.sankalai.dto.BlockingDTO.BlockingStatsDTO;
import com.sankalai.dto.BlockingDTO.SaveBlockedAppsRequest;
import com.sankalai.dto.BlockingDTO.SessionActionResponse;
import com.sankalai.dto.BlockingDTO.StartSessionRequest;
import com.sankalai.entity.BlockedApp;
import com.sankalai.entity.BlockingLog;
import com.sankalai.entity.BlockingSession;
import com.sankalai.entity.User;
import com.sankalai.entity.UserStats;
import com.sankalai.exception.BadRequestException;
import com.sankalai.exception.ResourceNotFoundException;
import com.sankalai.exception.UnauthorizedActionException;
import com.sankalai.repository.BlockedAppRepository;
import com.sankalai.repository.BlockingLogRepository;
import com.sankalai.repository.BlockingSessionRepository;
import com.sankalai.repository.UserRepository;
import com.sankalai.repository.UserStatsRepository;

@Service
public class BlockingService {

    private static final int REWARD_COINS_PER_BLOCKED_APP = 30;
    private static final int PENALTY_COINS = 50;
    private static final int DEFAULT_SESSION_DURATION = 50;
    private final UserRepository userRepository;
    private final BlockedAppRepository blockedAppRepository;

    private final BlockingSessionRepository blockingSessionRepository;
    private final BlockingLogRepository blockingLogRepository;
    private final UserStatsRepository userStatsRepository;

    public BlockingService(UserRepository userRepository, BlockedAppRepository blockedAppRepository,
            BlockingSessionRepository blockingSessionRepository, BlockingLogRepository blockingLogRepository,
            UserStatsRepository userStatsRepository) {
        this.userRepository = userRepository;
        this.blockedAppRepository = blockedAppRepository;
        this.blockingSessionRepository = blockingSessionRepository;
        this.blockingLogRepository = blockingLogRepository;
        this.userStatsRepository = userStatsRepository;
    }

    /**
     * Get user's blocked apps
     */
    public List<BlockedAppDTO> getUserBlockedApps(String userId) {
        List<BlockedApp> apps = blockedAppRepository.findByUser_UserId(userId);
        return apps.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Save/Update blocked apps for user
     */
    @Transactional
    public List<BlockedAppDTO> saveUserBlockedApps(String userId, SaveBlockedAppsRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Delete existing blocked apps
        List<BlockedApp> existingApps = blockedAppRepository.findByUser_UserId(userId);
        blockedAppRepository.deleteAll(existingApps);

        // Save new blocked apps
        List<BlockedApp> newApps = request.getApps().stream()
                .map(appReq -> new BlockedApp(user, appReq.getAppId(), appReq.getAppName(), appReq.getCategory(), appReq.getIcon(), appReq.getLogo(), appReq.getBlocked(), appReq.getPackageName(), appReq.getBundleId()))
                .collect(Collectors.toList());

        List<BlockedApp> savedApps = blockedAppRepository.saveAll(newApps);

        return savedApps.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Toggle app blocking status
     */
    @Transactional
    public BlockedAppDTO toggleAppBlocking(String userId, Integer appId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        BlockedApp app = blockedAppRepository.findByUser_UserIdAndAppId(userId, appId)
                .orElseThrow(() -> new ResourceNotFoundException("App not found"));

        app.setBlocked(!app.getBlocked());
        BlockedApp savedApp = blockedAppRepository.save(app);

        // Log the action
        logBlockingAction(user, appId, app.getAppName(),
                app.getBlocked() ? BlockingLog.LogAction.BLOCK : BlockingLog.LogAction.UNBLOCK,
                0, null);

        return mapToDTO(savedApp);
    }

    /**
     * Start a blocking session
     */
    @Transactional
    public BlockingSessionDTO startBlockingSession(String userId, StartSessionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        int duration = request.getDuration() != null ? request.getDuration() : DEFAULT_SESSION_DURATION;

        BlockingSession session = new BlockingSession(user, request.getAppId(), request.getAppName(), LocalDateTime.now(), duration, BlockingSession.SessionStatus.ACTIVE, 0, 0);

        BlockingSession savedSession = blockingSessionRepository.save(session);

        // Log the action
        logBlockingAction(user, request.getAppId(), request.getAppName(),
                BlockingLog.LogAction.SESSION_START, 0, savedSession.getId());

        return mapToSessionDTO(savedSession);
    }

    /**
     * Complete a blocking session (reward user)
     */
    @Transactional
    public SessionActionResponse completeBlockingSession(String userId, String sessionId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        BlockingSession session = blockingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!session.getUser().getUserId().equals(userId)) {
            throw new UnauthorizedActionException("You do not have access to this session");
        }

        if (session.getStatus() != BlockingSession.SessionStatus.ACTIVE) {
            throw new BadRequestException("Session is not active");
        }

        // Update session
        session.setStatus(BlockingSession.SessionStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());
        int rewardCoins = calculateRewardCoins(1);
        session.setCoinsEarned(rewardCoins);
        blockingSessionRepository.save(session);

        // Award coins
        int currentCoins = updateUserCoins(userId, rewardCoins);

        // Log the action
        logBlockingAction(user, session.getAppId(), session.getAppName(),
                BlockingLog.LogAction.SESSION_COMPLETE, rewardCoins, sessionId);

        return new SessionActionResponse(sessionId, rewardCoins, currentCoins, "Session completed! Earned " + rewardCoins + " Focus Points");
    }

    /**
     * Break a blocking session (penalize user)
     */
    @Transactional
    public SessionActionResponse breakBlockingSession(String userId, String sessionId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        BlockingSession session = blockingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!session.getUser().getUserId().equals(userId)) {
            throw new UnauthorizedActionException("You do not have access to this session");
        }

        if (session.getStatus() != BlockingSession.SessionStatus.ACTIVE) {
            throw new BadRequestException("Session is not active");
        }

        // Update session
        session.setStatus(BlockingSession.SessionStatus.BROKEN);
        session.setBrokenAt(LocalDateTime.now());
        session.setCoinsLost(PENALTY_COINS);
        blockingSessionRepository.save(session);

        // Deduct coins
        int currentCoins = updateUserCoins(userId, -PENALTY_COINS);

        // Log the action
        logBlockingAction(user, session.getAppId(), session.getAppName(),
                BlockingLog.LogAction.SESSION_BROKEN, -PENALTY_COINS, sessionId);

        return new SessionActionResponse(sessionId, -PENALTY_COINS, currentCoins, "Session broken! Lost " + PENALTY_COINS + " Focus Points");
    }

    /**
     * Get active blocking sessions
     */
    public List<BlockingSessionDTO> getActiveBlockingSessions(String userId) {
        List<BlockingSession> sessions = blockingSessionRepository
                .findByUser_UserIdAndStatus(userId, BlockingSession.SessionStatus.ACTIVE);

        return sessions.stream()
                .map(this::mapToSessionDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all blocking sessions
     */
    public List<BlockingSessionDTO> getAllBlockingSessions(String userId) {
        List<BlockingSession> sessions = blockingSessionRepository.findByUser_UserId(userId);

        return sessions.stream()
                .map(this::mapToSessionDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get blocking statistics
     */
    public BlockingStatsDTO getBlockingStats(String userId) {
        List<BlockingSession> sessions = blockingSessionRepository.findByUser_UserId(userId);

        int totalSessions = sessions.size();
        int completedSessions = 0;
        int brokenSessions = 0;
        int totalCoinsEarned = 0;
        int totalCoinsLost = 0;

        for (BlockingSession session : sessions) {
            if (session.getStatus() == BlockingSession.SessionStatus.COMPLETED) {
                completedSessions++;
                totalCoinsEarned += session.getCoinsEarned();
            } else if (session.getStatus() == BlockingSession.SessionStatus.BROKEN) {
                brokenSessions++;
                totalCoinsLost += session.getCoinsLost();
            }
        }

        double successRate = totalSessions > 0 ? (completedSessions * 100.0 / totalSessions) : 0;

        return new BlockingStatsDTO(totalSessions, completedSessions, brokenSessions, totalCoinsEarned, totalCoinsLost, successRate);
    }

    /**
     * Cleanup stale sessions (for debugging)
     */
    @Transactional
    public int cleanupStaleSessions(String userId) {
        List<BlockingSession> activeSessions = blockingSessionRepository
                .findByUser_UserIdAndStatus(userId, BlockingSession.SessionStatus.ACTIVE);

        for (BlockingSession session : activeSessions) {
            session.setStatus(BlockingSession.SessionStatus.BROKEN);
            session.setBrokenAt(LocalDateTime.now());
            session.setCoinsLost(0); // No penalty for cleanup
        }

        blockingSessionRepository.saveAll(activeSessions);
        return activeSessions.size();
    }

    // Helper methods

    private int updateUserCoins(String userId, int coinsChange) {
        UserStats stats = userStatsRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User stats not found"));

        long currentCoins = stats.getCurrentFocusPoints();
        long newCoins = Math.max(0, currentCoins + coinsChange);

        if (coinsChange > 0) {
            stats.setTotalFocusPoints(stats.getTotalFocusPoints() + coinsChange);
        }
        stats.setCurrentFocusPoints(newCoins);
        userStatsRepository.save(stats);

        return (int) newCoins;
    }

    private int calculateRewardCoins(int blockedAppCount) {
        return Math.max(0, blockedAppCount) * REWARD_COINS_PER_BLOCKED_APP;
    }

    private void logBlockingAction(User user, Integer appId, String appName,
                                    BlockingLog.LogAction action, int coinsChange, String sessionId) {
        BlockingLog log = new BlockingLog(user, appId, appName, action, coinsChange, sessionId);
        blockingLogRepository.save(log);
    }

    private BlockedAppDTO mapToDTO(BlockedApp app) {
        return new BlockedAppDTO(app.getId(), app.getAppId(), app.getAppName(), app.getCategory(), app.getIcon(), app.getLogo(), app.getBlocked(), app.getPackageName(), app.getBundleId(), app.getUpdatedAt());
    }

    private BlockingSessionDTO mapToSessionDTO(BlockingSession session) {
        return new BlockingSessionDTO(session.getId(), session.getAppId(), session.getAppName(), session.getStartTime(), session.getDuration(), session.getStatus().name().toLowerCase(), session.getCoinsEarned(), session.getCoinsLost(), session.getCompletedAt(), session.getBrokenAt(), session.getCreatedAt());
    }
}
