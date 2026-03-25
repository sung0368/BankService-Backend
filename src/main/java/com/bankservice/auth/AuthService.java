package com.bankservice.auth;

import com.bankservice.auth.dto.LoginRequest;
import com.bankservice.auth.dto.LoginResponse;
import com.bankservice.auth.dto.TokenRefreshResponse;
import com.bankservice.token.RefreshTokenRedisRepository;
import com.bankservice.user.User;
import com.bankservice.user.UserProfile;
import com.bankservice.user.UserProfileRepository;
import com.bankservice.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder encoder;
    private final JwtProvider jwtProvider;
    private final UserProfileRepository userProfileRepository;
    private final RefreshTokenRedisRepository refreshTokenRedisRepository;

    public AuthService(
            UserRepository userRepository,
            BCryptPasswordEncoder encoder,
            JwtProvider jwtProvider,
            UserProfileRepository userProfileRepository,
            RefreshTokenRedisRepository refreshTokenRedisRepository
    ) {
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.jwtProvider = jwtProvider;
        this.userProfileRepository = userProfileRepository;
        this.refreshTokenRedisRepository = refreshTokenRedisRepository;
    }

    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByUserId(request.getUserId())
                .orElseThrow(() -> new RuntimeException("사용자 없음"));

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new RuntimeException("차단된 사용자");
        }

        if (!encoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("비밀번호 불일치");
        }

        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("사용자 프로필 없음"));

        // 1️⃣ AccessToken 발급
        String accessToken = jwtProvider.createAccessToken(user);

        // 2️⃣ RefreshToken 발급
        String refreshToken = jwtProvider.createRefreshToken();

        // 3️⃣ Refresh Redis 저장
        long refreshTtlSeconds = 60 * 60 * 24 * 7L; // 7일
        refreshTokenRedisRepository.save(refreshToken, user.getUserId(), refreshTtlSeconds);

        int accessTtlSeconds = jwtProvider.getAccessExpireSeconds();

        // 4️⃣ 응답
        return new LoginResponse(
                accessToken,
                refreshToken,
                accessTtlSeconds,
                (int) refreshTtlSeconds,
                profile.getName()
        );
    }

    public TokenRefreshResponse refresh(String oldRefreshToken) {

        // 1️⃣ 기존 RefreshToken으로 사용자 조회
        String userId = refreshTokenRedisRepository.findUserIdByRefreshToken(oldRefreshToken);
        if (userId == null) {
            throw new RuntimeException("RefreshToken 만료 또는 재사용");
        }

        // 2️⃣ 사용자 조회
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("사용자 없음"));

        // 3️⃣ 새 AccessToken 발급
        String newAccessToken = jwtProvider.createAccessToken(user);

        // 4️⃣ 기존 RefreshToken TTL 조회
        Long ttl = refreshTokenRedisRepository.getTtl(userId);
        if (ttl == null || ttl <= 0) {
            throw new RuntimeException("RefreshToken 만료");
        }

        // RefreshToken 그대로 유지 (RTR 방식 미적용)
        return new TokenRefreshResponse(
                newAccessToken,
                oldRefreshToken,
                ttl.intValue()
        );
    }

    public int getRemainingSeconds(String userId) {
        Long ttl = refreshTokenRedisRepository.getTtl(userId);
        if (ttl == null || ttl < 0) return 0;
        return ttl.intValue();
    }

    public int getRemainingSecondsByRefreshToken(String refreshToken) {
        String userId = refreshTokenRedisRepository.findUserIdByRefreshToken(refreshToken);
        if (userId == null) return 0;
        Long ttl = refreshTokenRedisRepository.getTtl(userId);
        if (ttl == null || ttl < 0) return 0;
        return ttl.intValue();
    }

    public void logout(String userId) {
        refreshTokenRedisRepository.deleteByUserId(userId);
    }

    /**
     * [리팩토링] logoutByRefreshToken 메서드 추가
     * - 기존 문제: AuthController에서 logout(refreshToken)을 호출했는데
     *              기존 logout()은 userId를 받는 메서드 → Redis 삭제 실패
     * - 해결: refreshToken → R2U:{refreshToken} 으로 userId 역조회 후 삭제
     */
    public void logoutByRefreshToken(String refreshToken) {
        String userId = refreshTokenRedisRepository.findUserIdByRefreshToken(refreshToken);
        if (userId != null) {
            refreshTokenRedisRepository.deleteByUserId(userId);
        }
    }
}
