package com.bankservice.auth;

import com.bankservice.auth.dto.LoginRequest;
import com.bankservice.auth.dto.LoginResponse;
import com.bankservice.auth.dto.TokenRefreshRequest;
import com.bankservice.auth.dto.TokenRefreshResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * [리팩토링] AuthController 전면 수정
 * - 기존: HttpSession으로 로그인 상태 관리, Thymeleaf 뷰 리다이렉트
 * - 변경: JWT + Redis 기반 Stateless 인증, JSON 응답
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * [리팩토링] 로그인
     * - 기존: HttpSession에 userId 저장 후 홈 리다이렉트
     * - 변경: AccessToken은 body로, RefreshToken은 httpOnly Cookie로 응답
     *         쿠키 TTL: loginResponse.getRefreshExpiresIn() 직접 사용
     *         (기존에는 TTL 설정을 위해 Redis를 한 번 더 조회하는 불필요한 코드가 있었음)
     */
    @PostMapping("/login")
    public LoginResponse login(
            @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        LoginResponse loginResponse = authService.login(request);
        int ttlSeconds = loginResponse.getRefreshExpiresIn();

        String encodedUserName = URLEncoder.encode(loginResponse.getUserName(), StandardCharsets.UTF_8);
        Cookie userNameCookie = new Cookie("userName", encodedUserName);
        userNameCookie.setPath("/");
        userNameCookie.setHttpOnly(false);
        userNameCookie.setMaxAge(ttlSeconds);
        response.addCookie(userNameCookie);

        // RefreshToken은 JS에서 접근 불가한 httpOnly Cookie로 전송
        Cookie refreshTokenCookie = new Cookie("refreshToken", loginResponse.getRefreshToken());
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setMaxAge(ttlSeconds);
        response.addCookie(refreshTokenCookie);

        return loginResponse;
    }

    @PostMapping("/refresh")
    public TokenRefreshResponse refresh(
            @RequestBody TokenRefreshRequest request
    ) {
        return authService.refresh(request.getRefreshToken());
    }

    /**
     * [리팩토링] 로그아웃 버그 수정
     * - 기존: authService.logout(refreshToken) 호출
     *         → logout()은 userId를 받아야 하는데 refreshToken을 넘겨서 Redis 삭제 실패
     * - 변경: logoutByRefreshToken(refreshToken) 메서드 추가
     *         → refreshToken으로 userId를 역조회한 후 Redis에서 삭제
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestBody(required = false) TokenRefreshRequest request,
            HttpServletResponse response
    ) {
        if (request != null && request.getRefreshToken() != null) {
            authService.logoutByRefreshToken(request.getRefreshToken());
        }

        // 쿠키 만료 처리
        Cookie userNameCookie = new Cookie("userName", null);
        userNameCookie.setPath("/");
        userNameCookie.setMaxAge(0);
        response.addCookie(userNameCookie);

        Cookie refreshTokenCookie = new Cookie("refreshToken", null);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(0);
        response.addCookie(refreshTokenCookie);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/token/ttl")
    public int checkTokenTtl(@RequestParam String refreshToken) {
        return authService.getRemainingSeconds(refreshToken);
    }
}
