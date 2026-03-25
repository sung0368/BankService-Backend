package com.bankservice.auth;

import com.bankservice.user.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtProvider {

    private final SecretKey key;
    private final long accessTokenExpireMs;

    // ❌ JWT RefreshToken 방식 미사용 (Redis + UUID 방식 채택)
    // private final long refreshTokenExpireMs;

    public JwtProvider(
            @Value("${jwt.secret}") String secretKey,
            @Value("${jwt.expiration}") long accessTokenExpireMs,
            @Value("${jwt.refresh-expiration}") long refreshTokenExpireMs
    ) {
        this.key = Keys.hmacShaKeyFor(
                secretKey.getBytes(StandardCharsets.UTF_8)
        );
        this.accessTokenExpireMs = accessTokenExpireMs;
        // this.refreshTokenExpireMs = refreshTokenExpireMs;
    }

    /* ================= ACCESS TOKEN ================= */

    public String createAccessToken(User user) {
        return Jwts.builder()
                .setSubject(user.getUserId())
                .claim("role", user.getRole())
                .claim("type", "access")
                .setIssuedAt(new Date())
                .setExpiration(
                        new Date(System.currentTimeMillis() + accessTokenExpireMs)
                )
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims validateAccessToken(String token) {
        Claims claims = parseToken(token);

        if (!"access".equals(claims.get("type"))) {
            throw new RuntimeException("Access Token 아님");
        }
        return claims;
    }

    /* ================= REFRESH TOKEN ================= */

    /**
     * ✅ UUID 기반 RefreshToken 생성
     * - JWT 아님
     * - Redis에 저장
     * - 서버에서 강제 만료 / 로그아웃 가능
     */
    public String createRefreshToken() {
        return UUID.randomUUID().toString();
    }

    /*
     * ❌ JWT 기반 RefreshToken (미사용)
     * ❌ 은행 서비스에서는 폐기 권장
     *
     * public String createRefreshToken(String userId) {
     *     return Jwts.builder()
     *             .setSubject(userId)
     *             .claim("type", "refresh")
     *             .setIssuedAt(new Date())
     *             .setExpiration(
     *                     new Date(System.currentTimeMillis() + refreshTokenExpireMs)
     *             )
     *             .signWith(key, SignatureAlgorithm.HS256)
     *             .compact();
     * }
     */

    /* ================= COMMON ================= */

    private Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }


    public int getAccessExpireSeconds() {
        return (int) (accessTokenExpireMs / 1000);
    }
}
