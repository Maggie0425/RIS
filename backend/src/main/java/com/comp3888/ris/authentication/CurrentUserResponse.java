package com.comp3888.ris.authentication;

import java.util.List;

import org.springframework.security.oauth2.jwt.Jwt;

public record CurrentUserResponse(
        Long id,
        String username,
        String displayName,
        List<String> roles,
        List<String> permissions) {

    public CurrentUserResponse {
        roles = List.copyOf(roles);
        permissions = List.copyOf(permissions);
    }

    static CurrentUserResponse from(AuthenticatedUser user) {
        return new CurrentUserResponse(
                user.id(),
                user.getUsername(),
                user.displayName(),
                user.roles(),
                user.permissions());
    }

    static CurrentUserResponse from(Jwt jwt) {
        Number userId = jwt.getClaim("userId");
        return new CurrentUserResponse(
                userId.longValue(),
                jwt.getClaimAsString("username"),
                jwt.getClaimAsString("displayName"),
                claimList(jwt, "roles"),
                claimList(jwt, "permissions"));
    }

    private static List<String> claimList(Jwt jwt, String claimName) {
        List<String> values = jwt.getClaimAsStringList(claimName);
        return values == null ? List.of() : values;
    }
}
