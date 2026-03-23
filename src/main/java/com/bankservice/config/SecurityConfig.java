package com.bankservice.config;

import com.bankservice.auth.JwtAuthenticationFilter;
import com.bankservice.auth.JwtProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtProvider jwtProvider;

    public SecurityConfig(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * [리팩토링] CORS 설정 추가
     * - 기존: Thymeleaf 서버 렌더링 방식이라 CORS 설정 불필요
     * - 변경: React(localhost:5173)와 Spring Boot(localhost:8080)가 Origin이 달라
     *         브라우저가 API 요청을 차단 → CORS 허용 설정 추가
     * - allowCredentials(true): httpOnly Cookie(refreshToken) 전송을 위해 필요
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173")); // Vite 기본 포트
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true); // httpOnly Cookie 전송 허용
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                /**
                 * [리팩토링] 세션 방식 → STATELESS 전환
                 * - 기존: HttpSession으로 로그인 상태 관리 (서버 메모리에 세션 저장)
                 * - 변경: JWT 기반 인증으로 서버가 상태를 보관하지 않음
                 *         서버를 여러 대로 늘려도 세션 불일치 문제 없음
                 */
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                /**
                 * [리팩토링] permitAll 범위 정리
                 * - 기존: Thymeleaf 뷰 경로들이 섞여 있었음
                 * - 변경: REST API 경로만 명시
                 *         /api/auth/** → 로그인, 로그아웃, 토큰 갱신 (인증 불필요)
                 *         /api/users  → 회원가입 (인증 불필요)
                 *         나머지는 전부 JWT 인증 필요
                 */
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/users"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(
                        new JwtAuthenticationFilter(jwtProvider),
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}
