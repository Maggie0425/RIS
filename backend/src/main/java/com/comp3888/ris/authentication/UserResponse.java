package com.comp3888.ris.authentication;

import java.time.Instant;
import java.util.List;

public record UserResponse(
        Long id,
        String username,
        String displayName,
        boolean enabled,
        List<RoleCode> roles,
        Instant createdAt,
        Instant updatedAt) {

    static UserResponse from(UserAccount user) {
        List<RoleCode> roles = user.getRoles().stream()
                .map(Role::getCode)
                .sorted()
                .toList();
        return new UserResponse(
                user.getId(), user.getUsername(), user.getDisplayName(), user.isEnabled(),
                roles, user.getCreatedAt(), user.getUpdatedAt());
    }
}
