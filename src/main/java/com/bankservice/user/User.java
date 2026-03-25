package com.bankservice.user;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "사용자")
public class User {

    @Id
    @Column(name = "사용자_ID", length = 20)
    private String userId;   // ✅ 로그인 ID = PK

    @Column(name = "사용자_PW", nullable = false)
    private String passwordHash;

    @Column(name = "이메일", nullable = false, unique = true)
    private String email;

    @Column(name = "역할", nullable = false)
    private String role;

    @Column(name = "상태", nullable = false)
    private String status;

    @Column(name = "생성일시", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
    public User(String userId, String email, String passwordHash) {
        this.userId = userId;
        this.email = email;
        this.passwordHash = passwordHash;
        this.status = "ACTIVE";
        this.role = "USER";
    }
}
