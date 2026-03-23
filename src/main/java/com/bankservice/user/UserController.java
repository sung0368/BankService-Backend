package com.bankservice.user;

import com.bankservice.auth.dto.SignupRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * [리팩토링] @Controller → @RestController 전환
 * - 기존: Thymeleaf 뷰 반환
 * - 변경: JSON 응답, React가 뷰 담당
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * [리팩토링] @Valid 추가
     * - 기존: @Valid 누락 → SignupRequest의 유효성 검사(@NotBlank 등)가 실행되지 않음
     *         어떤 필드가 잘못됐는지 알 수 없고 "회원가입에 실패했습니다." 만 표시됨
     * - 변경: @Valid 추가 → GlobalExceptionHandler가 필드별 에러 메시지를 JSON으로 반환
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void signup(@RequestBody @Valid SignupRequest request) {
        userService.signup(request);
    }
}
