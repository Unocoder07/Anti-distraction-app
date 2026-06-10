package com.sankalai.repository;

import com.sankalai.entity.BlockingLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlockingLogRepository extends JpaRepository<BlockingLog, String> {
    
    List<BlockingLog> findByUser_UserIdOrderByTimestampDesc(String userId, Pageable pageable);
}
