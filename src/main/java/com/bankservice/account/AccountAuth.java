package com.bankservice.account;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * [리팩토링] 계좌_인증 테이블 신규 추가
 * - 기존: 계좌 비밀번호 없음
 * - 변경: ERD 스펙에 따라 계좌 비밀번호를 별도 테이블로 분리
 *
 * @MapsId + @OneToOne: Account와 PK를 공유
 *   → 계좌(Account)가 먼저 저장되고, 계좌_인증(AccountAuth)이 같은 ID를 사용
 *   → 계좌 1개당 인증 정보 1개 보장 (1:1 관계)
 */
@Entity
@Table(name = "계좌_인증")
@Getter
@NoArgsConstructor
public class AccountAuth {

    @Id
    @Column(name = "계좌_ID")
    private Long accountId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "계좌_ID")
    private Account account;

    @Column(name = "pin_hash", nullable = false)
    private String pinHash;

    // PIN 해싱 시 사용한 UUID salt (BCrypt 검증 시 다시 붙여서 비교)
    @Column(name = "pin_salt", nullable = false)
    private String pinSalt;

    @Column(name = "인증_상태", nullable = false)
    private String status = "NORMAL";

    // 비밀번호 틀린 횟수 (잠금 기능 구현 시 활용)
    @Column(name = "실패_횟수", nullable = false)
    private int failCount = 0;

    @Column(name = "마지막_실패_일시")
    private LocalDateTime lastFailedAt;

    @Column(name = "생성일시", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "수정일시")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public AccountAuth(Account account, String pinHash, String pinSalt) {
        this.account = account;
        this.pinHash = pinHash;
        this.pinSalt = pinSalt;
    }

    public void updatePin(String newPinHash, String newPinSalt) {
        this.pinHash = newPinHash;
        this.pinSalt = newPinSalt;
    }
}
