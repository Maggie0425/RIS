package com.comp3888.ris.authentication;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

@Service
class JwtService {

    static final Duration TOKEN_LIFETIME = Duration.ofMinutes(15);

    private final JwtEncoder encoder;
    private final Clock clock;
    private final String issuer;

    JwtService(
            JwtEncoder encoder,
            Clock clock,
            @Value("${ris.security.jwt.issuer}") String issuer) {
        this.encoder = encoder;
        this.clock = clock;
        this.issuer = issuer;
    }

    IssuedToken issue(AuthenticatedUser user) {
        Instant issuedAt = clock.instant();
        Instant expiresAt = issuedAt.plus(TOKEN_LIFETIME);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .subject(user.getUsername())
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .claim("userId", user.id())
                .claim("username", user.getUsername())
                .claim("displayName", user.displayName())
                .claim("roles", user.roles())
                .claim("permissions", user.permissions())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256)
                .type("JWT")
                .build();
        String tokenValue = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();

        return new IssuedToken(tokenValue, expiresAt);
    }

    record IssuedToken(String value, Instant expiresAt) {
    }
}
