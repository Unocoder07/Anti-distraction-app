package com.sankalai.repository;

import com.sankalai.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, String> {
    
    List<Achievement> findByUser_UserId(String userId);
    
    Optional<Achievement> findByUser_UserIdAndAchievementId(String userId, String achievementId);
}
