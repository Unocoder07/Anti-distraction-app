package com.sankalai.repository;

import com.sankalai.entity.DailyChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DailyChallengeRepository extends JpaRepository<DailyChallenge, String> {
    
    List<DailyChallenge> findByUser_UserIdAndDate(String userId, LocalDate date);
    
    List<DailyChallenge> findByUser_UserIdOrderByDateDesc(String userId);
}
