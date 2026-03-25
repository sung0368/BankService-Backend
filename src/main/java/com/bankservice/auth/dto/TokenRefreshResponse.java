package com.bankservice.auth.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor

public class TokenRefreshResponse {

    private String accessToken;
    private String refreshToken;
    private int expiresIn;

    public TokenRefreshResponse(
            String accessToken,
            String refreshToken,
            int expiresIn
    ) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
    }
}
