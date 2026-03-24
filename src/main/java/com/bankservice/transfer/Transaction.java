package com.bankservice.transfer;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "거래")
@Getter @Setter
@NoArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "거래_ID")
    private Long id;

    @Column(name = "거래_추적_ID", nullable = false, unique = true)
    private String trackingId;

    @Column(name = "출금_계좌_ID", nullable = false)
    private Long fromAccountId;

    @Column(name = "입금_계좌_ID", nullable = false)
    private Long toAccountId;

    @Column(name = "금액", nullable = false)
    private Long amount;

    @Column(name = "거래유형", nullable = false)
    private String type = "TRANSFER";

    @Column(name = "거래상태", nullable = false)
    private String status = "INIT";

    @Column(name = "생성일시")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.trackingId == null) {
            this.trackingId = UUID.randomUUID().toString();
        }
    }
}
