package com.bankservice.transfer;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "계좌_변경_이력")
@Getter @Setter
@NoArgsConstructor
public class AccountHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "이력_ID")
    private Long id;

    @Column(name = "계좌_ID", nullable = false)
    private Long accountId;

    @Column(name = "거래_ID", nullable = false)
    private Long transactionId;

    @Column(name = "이전_잔액")
    private Long prevBalance;

    @Column(name = "이후_잔액")
    private Long afterBalance;

    @Column(name = "변경_사유")
    private String reason = "TRANSFER";

    @Column(name = "생성일시")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public AccountHistory(Long accountId, Long transactionId, Long prevBalance, Long afterBalance, String reason) {
        this.accountId = accountId;
        this.transactionId = transactionId;
        this.prevBalance = prevBalance;
        this.afterBalance = afterBalance;
        this.reason = reason;
    }
}
