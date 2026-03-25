package com.bankservice.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByUserId(String userId); // 중복 체크용
    Optional<User> findByUserId(String userId); // 로그인용
    boolean existsByEmail(String email);

}
