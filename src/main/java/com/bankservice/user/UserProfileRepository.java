package com.bankservice.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfileRepository
        extends JpaRepository<UserProfile, String> {
    boolean existsByResidentNumberEncrypted(String residentNumberEncrypted);
    Optional<UserProfile> findByUser(User user);
}

