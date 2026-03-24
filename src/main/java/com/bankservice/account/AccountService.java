package com.bankservice.account;

import com.bankservice.user.User;
import com.bankservice.user.UserProfile;
import com.bankservice.user.UserProfileRepository;
import com.bankservice.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final AccountAuthRepository accountAuthRepository;
    private final BCryptPasswordEncoder encoder;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

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
    public Account openAccount(String userId, String product, String rawPin) {
        Account account = new Account();
        account.setUserId(userId);
        account.setProduct(product);
        account.setAccountNumber(generateAccountNumber());
        account.setBalance(0L);
        Account saved = accountRepository.save(account);

        String salt = UUID.randomUUID().toString();
        String pinHash = encoder.encode(salt + rawPin);
        accountAuthRepository.save(new AccountAuth(saved, pinHash, salt));

        return saved;
    }

    public List<Account> getAccounts(String userId) {
        return accountRepository.findByUserIdAndStatusNotOrderByCreatedAtDesc(userId, "CLOSED");
    }

    public void changePin(String userId, String accountNumber, String currentPin, String newPin) {
        Account account = accountRepository.findByAccountNumberAndUserId(accountNumber, userId)
                .orElseThrow(() -> new RuntimeException("계좌를 찾을 수 없습니다."));

        AccountAuth auth = accountAuthRepository.findById(account.getId())
                .orElseThrow(() -> new RuntimeException("계좌 인증 정보를 찾을 수 없습니다."));

        if (!encoder.matches(auth.getPinSalt() + currentPin, auth.getPinHash())) {
            throw new RuntimeException("현재 비밀번호가 올바르지 않습니다.");
        }

        String newSalt = UUID.randomUUID().toString();
        String newPinHash = encoder.encode(newSalt + newPin);
        auth.updatePin(newPinHash, newSalt);
    }

    public void closeAccount(String userId, String accountNumber, String pin) {
        Account account = accountRepository.findByAccountNumberAndUserId(accountNumber, userId)
                .orElseThrow(() -> new RuntimeException("계좌를 찾을 수 없습니다."));

        if ("CLOSED".equals(account.getStatus())) {
            throw new RuntimeException("이미 해지된 계좌입니다.");
        }

        AccountAuth auth = accountAuthRepository.findById(account.getId())
                .orElseThrow(() -> new RuntimeException("계좌 인증 정보를 찾을 수 없습니다."));

        if (!encoder.matches(auth.getPinSalt() + pin, auth.getPinHash())) {
            throw new RuntimeException("비밀번호가 올바르지 않습니다.");
        }

        account.setStatus("CLOSED");
        account.setClosedAt(LocalDateTime.now());
    }

    /**
     * 본인인증: DB에 저장된 이름, 주민등록번호, 휴대폰번호와 입력값 비교
     * 불일치 항목을 필드별 에러 메시지로 반환
     */
    public Map<String, String> verifyIdentity(String userId, String name, String ssn, String phone) {
        Map<String, String> errors = new LinkedHashMap<>();

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("사용자 정보를 찾을 수 없습니다."));

        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("사용자 프로필 정보를 찾을 수 없습니다."));

        if (!profile.getName().equals(name)) {
            errors.put("name", "이름이 일치하지 않습니다.");
        }
        if (!profile.getResidentNumberEncrypted().equals(ssn)) {
            errors.put("ssn", "주민등록번호가 일치하지 않습니다.");
        }
        if (!profile.getPhone().equals(phone)) {
            errors.put("phone", "휴대폰번호가 일치하지 않습니다.");
        }

        return errors;
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
