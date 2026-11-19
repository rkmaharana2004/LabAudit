package com.rkmaharana.labaudit.dto;

import com.rkmaharana.labaudit.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;

    @Builder.Default
    private String type = "Bearer";

    private String username;

    private String email;

    private Role role;

    private long expiresIn;
}
