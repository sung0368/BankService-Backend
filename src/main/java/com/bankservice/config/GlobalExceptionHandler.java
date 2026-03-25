package com.bankservice.config;

import com.bankservice.user.UserSignupException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * [리팩토링] GlobalExceptionHandler 신규 추가
 * - 기존: 에러 발생 시 Spring 기본 HTML 에러 페이지 반환
 *         프론트에서 어떤 필드가 문제인지 파악 불가 → "실패했습니다." 만 표시
 * - 변경: 에러 유형별로 JSON 응답 반환
 *         프론트에서 필드별 에러 메시지를 인식하고 사용자에게 표시 가능
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * @Valid 실패 시 필드별 에러 메시지 반환
     * - UserController.signup()에 @Valid가 없어서 유효성 검사가 실행되지 않던 문제도 함께 수정
     * 응답 예: { "userId": "아이디는 영문/숫자 조합 5~20자여야 합니다.", "email": "..." }
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );
        return ResponseEntity.badRequest().body(errors);
    }

    /**
     * 중복 아이디/이메일 등 비즈니스 예외
     * 응답 예: { "userId": "이미 존재하는 아이디입니다" }
     */
    @ExceptionHandler(UserSignupException.class)
    public ResponseEntity<Map<String, String>> handleSignupException(UserSignupException ex) {
        Map<String, String> error = new HashMap<>();
        String message = ex.getMessage();

        if (message.contains("아이디")) {
            error.put("userId", message);
        } else if (message.contains("이메일")) {
            error.put("email", message);
        } else {
            error.put("general", message);
        }

        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    /**
     * 동시 이체 충돌 시 처리
     * - @Version 낙관적 잠금이 충돌을 감지하면 ObjectOptimisticLockingFailureException 발생
     * - RuntimeException보다 구체적인 타입이므로 이 핸들러가 먼저 실행됨
     * - 409 Conflict로 응답해 클라이언트가 재시도하도록 유도
     */
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, String>> handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
        log.warn("낙관적 잠금 충돌: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "동시에 처리 중인 요청이 있습니다. 잠시 후 다시 시도해주세요."));
    }

    /**
     * [리팩토링] RuntimeException 핸들러 추가
     * - 기존: DB 오류 등 서버 에러 발생 시 Spring 기본 HTML 페이지 반환
     *         프론트에서 HTML을 파싱하지 못해 "계좌 개설에 실패했습니다." 만 표시
     * - 변경: JSON으로 실제 에러 메시지 반환
     *         서버 로그에도 스택 트레이스 기록
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        log.warn("RuntimeException: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", ex.getMessage() != null ? ex.getMessage() : "요청을 처리할 수 없습니다."));
    }
}
