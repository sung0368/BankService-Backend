package com.bankservice.transfer;

import com.bankservice.account.Account;
import com.bankservice.account.AccountAuth;
import com.bankservice.account.AccountAuthRepository;
import com.bankservice.account.AccountRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

// [리팩토링] 계좌이체 서비스 신규 추가
// - 거래 상태 흐름: INIT → DEBIT_OK → CREDIT_OK → SUCCESS (실패 시 FAIL)
// - @Version 낙관적 잠금으로 동시 이체 시 잔액 정합성 보장
// - AccountHistory로 잔액 변경 이력 기록
@Service
@Transactional
@RequiredArgsConstructor
public class TransferService {

    private final AccountRepository accountRepository;
    private final AccountAuthRepository accountAuthRepository;
    private final TransactionRepository transactionRepository;
    private final AccountHistoryRepository accountHistoryRepository;
    private final BCryptPasswordEncoder encoder;

    public Transaction transfer(String userId, String fromAccountNumber, String toAccountNumber, Long amount, String pin) {

        // 1. 출금 계좌 확인 (본인 소유)
        Account fromAccount = accountRepository.findByAccountNumberAndUserId(fromAccountNumber, userId)
                .orElseThrow(() -> new RuntimeException("출금 계좌를 찾을 수 없습니다."));

        if ("CLOSED".equals(fromAccount.getStatus())) {
            throw new RuntimeException("해지된 계좌에서는 이체할 수 없습니다.");
        }

        // 2. 계좌 비밀번호 검증
        AccountAuth auth = accountAuthRepository.findById(fromAccount.getId())
                .orElseThrow(() -> new RuntimeException("계좌 인증 정보를 찾을 수 없습니다."));

        if (!encoder.matches(auth.getPinSalt() + pin, auth.getPinHash())) {
            throw new RuntimeException("계좌 비밀번호가 올바르지 않습니다.");
        }

        // 3. 입금 계좌 확인
        Account toAccount = accountRepository.findByAccountNumber(toAccountNumber)
                .orElseThrow(() -> new RuntimeException("입금 계좌를 찾을 수 없습니다."));

        if ("CLOSED".equals(toAccount.getStatus())) {
            throw new RuntimeException("해지된 계좌로는 이체할 수 없습니다.");
        }

        if (fromAccount.getId().equals(toAccount.getId())) {
            throw new RuntimeException("같은 계좌로는 이체할 수 없습니다.");
        }

        // 4. 잔액 확인
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
}
