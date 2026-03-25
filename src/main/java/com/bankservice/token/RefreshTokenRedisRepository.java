package com.bankservice.token;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.concurrent.TimeUnit;

@Repository
public class RefreshTokenRedisRepository {

    private static final String PREFIX = "RT:"; // Redis Key prefix
    private static final String TOKEN_TO_USER_PREFIX = "R2U:"; // refreshToken → userId 매핑

    private final RedisTemplate<String, String> redisTemplate;

    public RefreshTokenRedisRepository(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * 사용자 기준으로 RefreshToken 저장 (TTL 포함)
     */
    public void save(String refreshToken, String userId, long ttlSeconds) {
        // 기존 사용자 키 삭제
        redisTemplate.delete(PREFIX + userId);

        // 새 RefreshToken 저장
        redisTemplate.opsForValue().set(PREFIX + userId, refreshToken, ttlSeconds, TimeUnit.SECONDS);

        // refreshToken → userId 매핑도 저장
        redisTemplate.opsForValue().set(TOKEN_TO_USER_PREFIX + refreshToken, userId, ttlSeconds, TimeUnit.SECONDS);
    }

    /**
     * 사용자 ID로 RefreshToken 조회
     */
    public String findRefreshTokenByUserId(String userId) {
        return redisTemplate.opsForValue().get(PREFIX + userId);
    }

    /**
     * refreshToken으로 userId 조회
     */
    public String findUserIdByRefreshToken(String refreshToken) {
        return redisTemplate.opsForValue().get(TOKEN_TO_USER_PREFIX + refreshToken);
    }

    /**
     * 사용자 기준 RefreshToken 삭제
     */
    public void deleteByUserId(String userId) {
        String refreshToken = redisTemplate.opsForValue().get(PREFIX + userId);
        if (refreshToken != null) {
            redisTemplate.delete(TOKEN_TO_USER_PREFIX + refreshToken);
        }
        redisTemplate.delete(PREFIX + userId);
    }

    /**
     * TTL 조회 (초 단위)
     */
    public Long getTtl(String userId) {
        return redisTemplate.getExpire(PREFIX + userId, TimeUnit.SECONDS);
    }
}
