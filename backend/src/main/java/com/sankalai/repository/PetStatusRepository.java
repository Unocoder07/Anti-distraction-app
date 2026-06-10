package com.sankalai.repository;

import com.sankalai.entity.PetStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PetStatusRepository extends JpaRepository<PetStatus, String> {
    
    Optional<PetStatus> findByUserId(String userId);
}
