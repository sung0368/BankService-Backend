package com.bankservice.transfer;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// [리팩토링] 계좌이체 API 신규 추가
@RestController
@RequestMapping("/api/transfer")
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;

    @PostMapping
    public ResponseEntity<Map<String, String>> transfer(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal String userId) {

        String fromAccountNumber = body.get("fromAccountNumber");
        String toAccountNumber = body.get("toAccountNumber");
        String amountStr = body.get("amount");
        String pin = body.get("pin");

        if (fromAccountNumber == null || fromAccountNumber.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "출금 계좌를 선택해주세요."));
        }
        if (toAccountNumber == null || toAccountNumber.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "입금 계좌번호를 입력해주세요."));
        }
        if (amountStr == null || amountStr.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "이체 금액을 입력해주세요."));
        }
        if (pin == null || pin.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "계좌 비밀번호를 입력해주세요."));
        }

        long amount;
        try {
            amount = Long.parseLong(amountStr);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "이체 금액은 숫자만 입력 가능합니다."));
        }

        if (amount <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "이체 금액은 0원보다 커야 합니다."));
        }

        Transaction tx = transferService.transfer(userId, fromAccountNumber, toAccountNumber, amount, pin);

        return ResponseEntity.ok(Map.of(
                "message", "이체가 완료되었습니다.",
                "trackingId", tx.getTrackingId()
        ));
    }

    @GetMapping("/all-history")
    public ResponseEntity<List<Map<String, String>>> getAllHistory(
            @AuthenticationPrincipal String userId) {

        List<Map<String, String>> history = transferService.getAllHistory(userId);
        return ResponseEntity.ok(history);
    }

    // [리팩토링] 거래 내역 조회 API 신규 추가
    @GetMapping("/history")
    public ResponseEntity<List<Map<String, String>>> getHistory(
            @RequestParam String accountNumber,
            @RequestParam int year,
            @RequestParam int month,
            @AuthenticationPrincipal String userId) {

        List<Map<String, String>> history = transferService.getHistory(userId, accountNumber, year, month);
        return ResponseEntity.ok(history);
    }
}
