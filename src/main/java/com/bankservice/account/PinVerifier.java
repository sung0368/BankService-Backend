package com.bankservice.account;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * PIN 검증 컴포넌트
 *
 * 실패 횟수 기록이 외부 트랜잭션과 별개로 커밋되어야 하므로
 * recordFailure / recordSuccess 를 REQUIRES_NEW 로 분리.
 *
 * 문제 상황:
 *   @Transactional 메서드 안에서 PIN이 틀려 예외를 던지면
 *   전체 트랜잭션이 롤백되어 recordFailure() 도 함께 롤백 → 카운트가 오르지 않음
 *
 * 해결:
 *   recordFailure / recordSuccess 를 REQUIRES_NEW 트랜잭션으로 먼저 커밋 후 예외 전파
 *   → 실패 횟수는 DB에 반영되고, 외부 트랜잭션은 정상 롤백 가능
 *
 * self 주입 이유:
 *   같은 클래스 내 메서드를 Spring 프록시를 통해 호출해야 REQUIRES_NEW 가 동작하므로
 *   @Lazy 자기 참조로 프록시를 경유함
 */
@Component
@RequiredArgsConstructor
public class PinVerifier {

    private final AccountAuthRepository accountAuthRepository;
    private final BCryptPasswordEncoder encoder;

    @Autowired @Lazy
    private PinVerifier self;

    // 잠금 확인 → PIN 대조 → 성공/실패 기록을 별도 트랜잭션으로 커밋 후 예외 전파
    public void verify(Long accountId, String pin) {
        AccountAuth auth = accountAuthRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("계좌 인증 정보를 찾을 수 없습니다."));

        if (auth.isLocked()) {
            throw new RuntimeException("비밀번호 5회 오류로 계좌가 잠겼습니다. 30분 후 다시 시도해주세요.");
        }

        if (!encoder.matches(auth.getPinSalt() + pin, auth.getPinHash())) {
            int count = self.recordFailure(accountId); // REQUIRES_NEW → 즉시 커밋
            if (count >= 5) {
                throw new RuntimeException("비밀번호가 올바르지 않습니다. 계좌가 잠겼습니다.");
            }
            throw new RuntimeException("비밀번호가 올바르지 않습니다. (남은 시도 " + (5 - count) + "회)");
        }

        self.recordSuccess(accountId); // REQUIRES_NEW → 즉시 커밋
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int recordFailure(Long accountId) {
        AccountAuth auth = accountAuthRepository.findById(accountId).orElseThrow();
        auth.recordFailure();
        return auth.getFailCount();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSuccess(Long accountId) {
        AccountAuth auth = accountAuthRepository.findById(accountId).orElseThrow();
        auth.recordSuccess();
    }
}
