package com.bankservice.account;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * [리팩토링] @Controller → @RestController 전환
 * - 기존: @Controller + Thymeleaf 뷰 반환 (HTML 렌더링)
 * - 변경: @RestController + JSON 응답
 *         프론트엔드(React)가 분리되면서 서버는 데이터만 내려줌
 */
@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    /**
     * [리팩토링] 계좌 개설 API
     * - 기존: 폼 데이터 받아서 뷰 리다이렉트
     * - 변경: JSON body에서 product, password 추출
     *         @AuthenticationPrincipal로 JWT에서 userId 추출 (세션 불필요)
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> openAccount(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal String userId) {

        String product = body.get("product");
        String password = body.get("password");

        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "계좌 비밀번호를 입력해주세요."));
        }

        accountService.openAccount(userId, product, password);
        return ResponseEntity.ok(Map.of("message", "계좌가 성공적으로 개설되었습니다."));
    }
}
