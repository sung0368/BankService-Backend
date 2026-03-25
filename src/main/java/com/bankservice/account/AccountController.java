package com.bankservice.account;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
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

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd");
    private static final DateTimeFormatter DATETIME_FORMAT = DateTimeFormatter.ofPattern("yyyy년 MM월 dd일 HH시 mm분");

    private final AccountService accountService;

    /**
     * 계좌 조회 API - 로그인한 사용자의 계좌 목록 반환
     */
    @GetMapping
    public ResponseEntity<List<Map<String, String>>> getAccounts(
            @AuthenticationPrincipal String userId) {

        List<Map<String, String>> accounts = accountService.getAccounts(userId).stream()
                .map(account -> Map.of(
                        "product", account.getProduct(),
                        "accountNumber", account.getAccountNumber(),
                        "createdAt", account.getCreatedAt().format(DATE_FORMAT)
                ))
                .toList();

        return ResponseEntity.ok(accounts);
    }

    /**
     * 본인인증 API
     * 입력된 이름, 주민등록번호, 휴대폰번호를 DB와 비교
     * 일치하면 빈 객체, 불일치하면 필드별 에러 메시지 반환
     */
    @PostMapping("/verify-identity")
    public ResponseEntity<Map<String, String>> verifyIdentity(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal String userId) {

        String name = body.get("name");
        String ssn = body.get("ssn");
        String phone = body.get("phone");

        Map<String, String> errors = accountService.verifyIdentity(userId, name, ssn, phone);

        if (!errors.isEmpty()) {
            return ResponseEntity.badRequest().body(errors);
        }

        return ResponseEntity.ok(Map.of("message", "본인인증이 완료되었습니다."));
    }

    /** 계좌 비밀번호 수정 */
    @PatchMapping("/{accountNumber}/pin")
    public ResponseEntity<Map<String, String>> changePin(
            @PathVariable String accountNumber,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal String userId) {

        accountService.changePin(userId, accountNumber, body.get("currentPin"), body.get("newPin"));
        return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다."));
    }

    /** 계좌 해지 */
    @PatchMapping("/{accountNumber}/close")
    public ResponseEntity<Map<String, String>> closeAccount(
            @PathVariable String accountNumber,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal String userId) {

        accountService.closeAccount(userId, accountNumber, body.get("pin"));
        return ResponseEntity.ok(Map.of("message", "계좌가 해지되었습니다."));
    }

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

        Account account = accountService.openAccount(userId, product, password);
        String createdAt = account.getCreatedAt().format(DATETIME_FORMAT);

        return ResponseEntity.ok(Map.of(
                "message", "계좌가 성공적으로 개설되었습니다.",
                "accountNumber", account.getAccountNumber(),
                "product", account.getProduct(),
                "createdAt", createdAt
        ));
    }
}
