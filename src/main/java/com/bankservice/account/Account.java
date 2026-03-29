package com.bankservice.account;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
@Entity
@Table(name = "계좌")
@Getter @Setter
@NoArgsConstructor
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "계좌번호", nullable = false, unique = true)
    private String accountNumber;

    @Column(name = "잔액", nullable = false)
    private Long balance = 0L;

    @Column(name = "사용자_id", nullable = false)
    private String userId;

    @Column(name = "상품", nullable = false)
    private String product = "입출금계좌";

    @Column(name = "상태", nullable = false)
    private String status = "NORMAL";

    @Column(name = "생성일시")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "해지일시")
    private LocalDateTime closedAt;
}