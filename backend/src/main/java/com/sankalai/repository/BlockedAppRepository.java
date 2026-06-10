package com.sankalai.repository;

import com.sankalai.entity.BlockedApp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlockedAppRepository extends JpaRepository<BlockedApp, String> {
    
    List<BlockedApp> findByUser_UserId(String userId);
    
    Optional<BlockedApp> findByUser_UserIdAndAppId(String userId, Integer appId);
    
    void deleteByUser_UserIdAndAppId(String userId, Integer appId);
}
