package com.bankservice.auth.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequest {

    @NotBlank(message = "{userId.notblank}")
    @Pattern(
            regexp = "^[a-zA-Z0-9]{5,20}$",
            message = "{userId.format}"
    )
    private String userId;


    @NotBlank(message = "{email.notblank}")
    @Email(message = "{email.format}")
    private String email;


    @NotBlank(message = "{password.notblank}")
    @Pattern(
            regexp = "^(?=.ㅇ*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$",
            message = "{password.format}"
    )
    private String password;


    @NotBlank(message = "{name.notblank}")
    @Pattern(
            regexp = "^[가-힣]{2,10}$",
            message = "{name.format}"
    )
    private String name;


    @NotBlank(message = "{residentNumber.notblank}")
    @Pattern(
            regexp = "^\\d{6}-\\d{7}$",
            message = "{residentNumber.format}"
    )
    private String residentNumber;


    @NotBlank(message = "{phone.notblank}")
    @Pattern(
            regexp = "^01[016789]-\\d{3,4}-\\d{4}$",
            message = "{phone.format}"
    )
    private String phone;


    @NotBlank(message = "{address.notblank}")
    @Size(max = 255, message = "{address.size}")
    private String address;
}
