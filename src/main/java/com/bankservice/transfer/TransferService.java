package com.bankservice.transfer;

import com.bankservice.account.Account;
import com.bankservice.account.AccountRepository;
import com.bankservice.account.PinVerifier;
import com.bankservice.user.UserProfile;
import com.bankservice.user.UserProfileRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

// 계좌이체 서비스 신규 추가
// - 거래 상태 흐름: INIT → DEBIT_OK → CREDIT_OK → SUCCESS (실패 시 FAIL)
// - 비관적 잠금(PESSIMISTIC_WRITE)으로 동시 이체 시 잔액 정합성 보장
// - AccountHistory로 잔액 변경 이력 기록
@Service
@Transactional
@RequiredArgsConstructor
public class TransferService {

    private static final DateTimeFormatter DATETIME_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm:ss");

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final AccountHistoryRepository accountHistoryRepository;
    private final UserProfileRepository userProfileRepository;
    private final PinVerifier pinVerifier;

    public Transaction transfer(String userId, String fromAccountNumber, String toAccountNumber, Long amount, String pin) {

        // 1. 출금/입금 계좌 조회 (잠금 없이 먼저 존재 확인)
        Account fromAccount = accountRepository.findByAccountNumberAndUserId(fromAccountNumber, userId)
                .orElseThrow(() -> new RuntimeException("출금 계좌를 찾을 수 없습니다."));

        if ("CLOSED".equals(fromAccount.getStatus())) {
            throw new RuntimeException("해지된 계좌에서는 이체할 수 없습니다.");
        }

        // 2. 계좌 비밀번호 검증 (실패 횟수 제한 포함)
        pinVerifier.verify(fromAccount.getId(), pin);

        // 3. 입금 계좌 확인
        Account toAccount = accountRepository.findByAccountNumber(toAccountNumber)
                .orElseThrow(() -> new RuntimeException("입금 계좌를 찾을 수 없습니다."));

        if ("CLOSED".equals(toAccount.getStatus())) {
            throw new RuntimeException("해지된 계좌로는 이체할 수 없습니다.");
        }

        if (fromAccount.getId().equals(toAccount.getId())) {
            throw new RuntimeException("같은 계좌로는 이체할 수 없습니다.");
        }

        // 4. 데드락 방지: 항상 ID가 작은 계좌부터 잠금 (잠금 순서 일관성)
        Account firstLock  = fromAccount.getId() < toAccount.getId() ? fromAccount : toAccount;
        Account secondLock = fromAccount.getId() < toAccount.getId() ? toAccount : fromAccount;
        accountRepository.findByAccountNumberWithLock(firstLock.getAccountNumber());
        accountRepository.findByAccountNumberWithLock(secondLock.getAccountNumber());

        // 잠금 후 최신 잔액 재조회
        fromAccount = accountRepository.findByAccountNumberAndUserId(fromAccountNumber, userId).orElseThrow();
        toAccount   = accountRepository.findByAccountNumber(toAccountNumber).orElseThrow();

        // 5. 잔액 확인
        if (fromAccount.getBalance() < amount) {
            throw new RuntimeException("잔액이 부족합니다.");
        }

        // 5. 거래 생성 (INIT) — 새 엔티티이므로 save 필요
        Transaction tx = new Transaction();
        tx.setFromAccountId(fromAccount.getId());
        tx.setToAccountId(toAccount.getId());
        tx.setAmount(amount);
        tx = transactionRepository.save(tx);

        // 6. 출금 — JPA 더티체킹이 트랜잭션 커밋 시 자동 flush
        Long fromPrevBalance = fromAccount.getBalance();
        fromAccount.setBalance(fromPrevBalance - amount);

        accountHistoryRepository.save(
                new AccountHistory(fromAccount.getId(), tx.getId(), fromPrevBalance, fromAccount.getBalance(), "TRANSFER_OUT")
        );

        // 7. 입금
        Long toPrevBalance = toAccount.getBalance();
        toAccount.setBalance(toPrevBalance + amount);

        accountHistoryRepository.save(
                new AccountHistory(toAccount.getId(), tx.getId(), toPrevBalance, toAccount.getBalance(), "TRANSFER_IN")
        );

        // 8. 성공 — @Transactional 커밋 시 최종 상태로 저장됨
        tx.setStatus("SUCCESS");

        return tx;
    }

    // 거래 내역 조회 기능 신규 추가
    public List<Map<String, String>> getHistory(String userId, String accountNumber, int year, int month) {
        Account account = accountRepository.findByAccountNumberAndUserId(accountNumber, userId)
                .orElseThrow(() -> new RuntimeException("계좌를 찾을 수 없습니다."));

        YearMonth ym = YearMonth.of(year, month);
        LocalDateTime start = ym.atDay(1).atStartOfDay();
        LocalDateTime end = ym.atEndOfMonth().atTime(23, 59, 59);

        List<AccountHistory> histories = accountHistoryRepository
                .findByAccountIdAndCreatedAtBetweenOrderByCreatedAtDesc(account.getId(), start, end);

        return buildRows(histories, Map.of(account.getId(), account));
    }

    public List<Map<String, String>> getAllHistory(String userId) {
        List<Account> accounts = accountRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Long> accountIds = accounts.stream().map(Account::getId).toList();

        if (accountIds.isEmpty()) return List.of();

        List<AccountHistory> histories = accountHistoryRepository
                .findByAccountIdInAndReasonOrderByCreatedAtDesc(accountIds, "TRANSFER_OUT");

        Map<Long, Account> accountMap = accounts.stream()
                .collect(Collectors.toMap(Account::getId, a -> a));

        return buildRows(histories, accountMap);
    }

    // N+1 방지: 이력 목록에 필요한 거래, 계좌, 프로필을 각 1번씩 일괄 조회
    private List<Map<String, String>> buildRows(List<AccountHistory> histories, Map<Long, Account> sourceAccountMap) {
        if (histories.isEmpty()) return List.of();

        // 1) 거래 일괄 조회
        List<Long> txIds = histories.stream().map(AccountHistory::getTransactionId).toList();
        Map<Long, Transaction> txMap = transactionRepository.findAllById(txIds).stream()
                .collect(Collectors.toMap(Transaction::getId, t -> t));

        // 2) 관련된 모든 계좌 일괄 조회
        Set<Long> allAccountIds = new HashSet<>();
        txMap.values().forEach(tx -> {
            allAccountIds.add(tx.getFromAccountId());
            allAccountIds.add(tx.getToAccountId());
        });
        Map<Long, Account> allAccountMap = accountRepository.findAllById(allAccountIds).stream()
                .collect(Collectors.toMap(Account::getId, a -> a));

        // 3) 사용자 프로필 일괄 조회
        Set<String> userIds = allAccountMap.values().stream()
                .map(Account::getUserId).collect(Collectors.toSet());
        Map<String, String> nameMap = userProfileRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, UserProfile::getName));

        // 4) 결과 조립
        List<Map<String, String>> result = new ArrayList<>();
        for (AccountHistory h : histories) {
            Transaction tx = txMap.get(h.getTransactionId());
            if (tx == null) continue;

            String senderName = getName(tx.getFromAccountId(), allAccountMap, nameMap);
            String receiverName = getName(tx.getToAccountId(), allAccountMap, nameMap);
            String amountStr = "TRANSFER_IN".equals(h.getReason()) ? "+" + tx.getAmount() : "-" + tx.getAmount();

            Account source = sourceAccountMap.get(h.getAccountId());
            String product = source != null ? source.getProduct() : "알 수 없음";

            Map<String, String> row = new LinkedHashMap<>();
            row.put("product", product);
            row.put("sender", senderName);
            row.put("receiver", receiverName);
            row.put("createdAt", h.getCreatedAt().format(DATETIME_FORMAT));
            row.put("amount", amountStr);
            row.put("afterBalance", String.valueOf(h.getAfterBalance()));
            row.put("type", h.getReason());
            result.add(row);
        }
        return result;
    }

    private String getName(Long accountId, Map<Long, Account> accountMap, Map<String, String> nameMap) {
        Account account = accountMap.get(accountId);
        if (account == null) return "알 수 없음";
        return nameMap.getOrDefault(account.getUserId(), "알 수 없음");
    }
}
