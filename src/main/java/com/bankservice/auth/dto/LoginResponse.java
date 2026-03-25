package com.bankservice.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private int accessExpiresIn;
    private int refreshExpiresIn;
    private String userName;
}
