package com.bankservice.transfer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AccountHistoryRepository extends JpaRepository<AccountHistory, Long> {
    List<AccountHistory> findByAccountIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long accountId, LocalDateTime start, LocalDateTime end);
    List<AccountHistory> findByAccountIdOrderByCreatedAtDesc(Long accountId);
    List<AccountHistory> findByAccountIdAndReasonOrderByCreatedAtDesc(Long accountId, String reason);
    List<AccountHistory> findByAccountIdInAndReasonOrderByCreatedAtDesc(List<Long> accountIds, String reason);
}
