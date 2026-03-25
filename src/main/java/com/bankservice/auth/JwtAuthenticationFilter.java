package com.bankservice.auth;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /**
     * [리팩토링] shouldNotFilter 단순화
     * - 기존: /api/users(회원가입)가 누락되어 있어서, 비로그인 상태에서
     *         회원가입 요청 시 "Access Token Expired" 에러 발생
     * - 변경: /api/auth/ 경로만 필터 스킵
     *         허용 여부는 SecurityConfig의 permitAll/authenticated 규칙이 처리하도록 위임
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/auth/");
    }

    private final JwtProvider jwtProvider;

    public JwtAuthenticationFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String token = resolveToken(request);

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = jwtProvider.validateAccessToken(token);
            String userId = claims.getSubject();

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userId,
                            null,
                            Collections.emptyList()
                    );

            authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);

        } catch (Exception e) {
            /**
             * [리팩토링] 만료/유효하지 않은 토큰 처리 방식 변경
             * - 기존: 즉시 401 반환 → permitAll 엔드포인트도 차단되는 문제 발생
             *         (회원가입 요청 시 토큰 없어도 401이 먼저 반환됨)
             * - 변경: 컨텍스트만 비우고 체인 계속 진행
             *         permitAll 경로 → Spring Security가 그냥 통과
             *         authenticated 경로 → Spring Security가 401 반환
             */
            SecurityContextHolder.clearContext();
            filterChain.doFilter(request, response);
        }
    }

    /**
     * [리팩토링] 토큰 탐색 위치 추가
     * - 기존: Authorization 헤더만 확인
     * - 변경: 헤더 우선 탐색, 없으면 accessToken 쿠키에서도 탐색
     *         (Postman 테스트 등 쿠키 기반 요청 지원)
     */
    private String resolveToken(HttpServletRequest request) {
        // 1) Authorization 헤더
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }

        // 2) 쿠키
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("accessToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        return null;
    }
}
