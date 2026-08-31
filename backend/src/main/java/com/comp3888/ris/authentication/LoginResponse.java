package com.comp3888.ris.authentication;

import java.time.Instant;

public record LoginResponse(
        String accessToken,
        String tokenType,
        Instant expiresAt,
        CurrentUserResponse user) {
}
