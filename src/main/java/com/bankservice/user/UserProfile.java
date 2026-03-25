package com.bankservice.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "사용자_프로필")
public class UserProfile {

    @Id
    @Column(name = "사용자_ID")
    private String userId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "사용자_ID")
    private User user;

    @Column(name = "이름", nullable = false)
    private String name;

    @Column(name = "주소")
    private String address;

    @Column(name = "주민번호_암호화", nullable = false)
    private String residentNumberEncrypted;

    @Column(name = "핸드폰번호")
    private String phone;

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

    // ✅ 이 생성자가 없어서 에러가 났던 것
    public UserProfile(
            User user,
            String name,
            String residentNumberEncrypted,
            String phone,
            String address

    ) {
        this.user = user;
        this.name = name;
        this.residentNumberEncrypted = residentNumberEncrypted;
        this.phone = phone;
        this.address = address;

    }
}
