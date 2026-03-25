package com.bankservice.account;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    boolean existsByAccountNumber(String accountNumber);
    List<Account> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Account> findByUserIdAndStatusNotOrderByCreatedAtDesc(String userId, String status);
    Optional<Account> findByAccountNumberAndUserId(String accountNumber, String userId);
    Optional<Account> findByAccountNumber(String accountNumber);
}