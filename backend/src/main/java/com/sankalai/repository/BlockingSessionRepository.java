package com.sankalai.repository;

import com.sankalai.entity.BlockingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlockingSessionRepository extends JpaRepository<BlockingSession, String> {
    
    List<BlockingSession> findByUser_UserId(String userId);
    
    List<BlockingSession> findByUser_UserIdAndStatus(String userId, BlockingSession.SessionStatus status);
    
    Long countByUser_UserIdAndStatus(String userId, BlockingSession.SessionStatus status);
}
