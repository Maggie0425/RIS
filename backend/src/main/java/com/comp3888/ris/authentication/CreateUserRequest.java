package com.comp3888.ris.authentication;

import java.util.Set;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank
        @Size(min = 3, max = 100)
        @Pattern(regexp = "[A-Za-z0-9._-]+", message = "must contain only letters, numbers, dots, underscores, or hyphens")
        String username,

        @NotBlank
        @Size(min = 2, max = 200)
        String displayName,

        @NotBlank
        @Size(min = 12, max = 128)
        String password,

        @NotEmpty
        Set<RoleCode> roles) {
}
