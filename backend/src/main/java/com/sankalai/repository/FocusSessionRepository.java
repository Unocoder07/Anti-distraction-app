package com.sankalai.repository;

import com.sankalai.entity.FocusSession;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FocusSessionRepository extends JpaRepository<FocusSession, String> {
    
    List<FocusSession> findByUser_UserIdOrderByStartTimeDesc(String userId, Pageable pageable);
    
    List<FocusSession> findByUser_UserIdAndStatus(String userId, FocusSession.SessionStatus status);
    
    List<FocusSession> findByUser_UserIdAndStartTimeBetween(String userId, LocalDateTime start, LocalDateTime end);
    
    Long countByUser_UserIdAndIsDeepWorkTrue(String userId);
}
