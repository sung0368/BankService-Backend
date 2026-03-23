package com.bankservice.account;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final AccountAuthRepository accountAuthRepository;
    private final BCryptPasswordEncoder encoder;

    /**
     * [리팩토링] 계좌 개설 시 계좌 비밀번호(PIN) 해싱 추가
     * - 기존: 계좌 정보만 저장 (비밀번호 없음)
     * - 변경: 계좌 저장 후 계좌_인증 테이블에 PIN 해시값 함께 저장
     *
     * PIN 해싱 방식:
     *   salt = UUID.randomUUID()          → 계좌마다 고유한 랜덤 salt 생성
     *   pinHash = BCrypt(salt + rawPin)   → salt를 붙여서 BCrypt 해싱
     *   → 같은 PIN이라도 계좌마다 다른 해시값이 저장됨 (레인보우 테이블 방어)
     */
    public void openAccount(String userId, String product, String rawPin) {
        Account account = new Account();
        account.setUserId(userId);
        account.setProduct(product);
        account.setAccountNumber(generateAccountNumber());
        account.setBalance(0L);
        Account saved = accountRepository.save(account);

        String salt = UUID.randomUUID().toString();
        String pinHash = encoder.encode(salt + rawPin);
        accountAuthRepository.save(new AccountAuth(saved, pinHash, salt));
    }

    private String generateAccountNumber() {
        String number;
        do {
            String mid = String.format("%06d", (int)(Math.random() * 1_000_000));
            String tail = String.format("%02d", (int)(Math.random() * 100));
            number = "110-" + mid + "-" + tail;
        } while (accountRepository.existsByAccountNumber(number));
        return number;
    }
}
