package com.comp3888.ris.authentication;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.stream.Stream;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@EnableMethodSecurity
class SecurityConfiguration {

    private static final int MINIMUM_HS256_KEY_BYTES = 32;
    private static final Logger LOGGER = LoggerFactory.getLogger(SecurityConfiguration.class);

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(
            RisUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }

    @Bean
    SecretKey jwtSecretKey(@Value("${ris.security.jwt.secret}") String secret) {
        if (secret == null || secret.isBlank()) {
            byte[] generatedKey = new byte[MINIMUM_HS256_KEY_BYTES];
            new SecureRandom().nextBytes(generatedKey);
            LOGGER.warn(
                    "RIS_JWT_SECRET is not configured; using an ephemeral key. "
                            + "Existing tokens will become invalid when the backend restarts.");
            return new SecretKeySpec(generatedKey, "HmacSHA256");
        }

        byte[] configuredKey = secret.getBytes(StandardCharsets.UTF_8);
        if (configuredKey.length < MINIMUM_HS256_KEY_BYTES) {
            throw new IllegalArgumentException(
                    "ris.security.jwt.secret must contain at least 32 UTF-8 bytes for HS256");
        }
        return new SecretKeySpec(configuredKey, "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return NimbusJwtEncoder.withSecretKey(jwtSecretKey)
                .algorithm(MacAlgorithm.HS256)
                .build();
    }

    @Bean
    JwtDecoder jwtDecoder(
            SecretKey jwtSecretKey,
            @Value("${ris.security.jwt.issuer}") String issuer) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(jwtSecretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        OAuth2TokenValidator<Jwt> standardValidator =
                JwtValidators.createDefaultWithIssuer(issuer);
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                standardValidator,
                SecurityConfiguration::validateApplicationClaims));
        return decoder;
    }

    @Bean
    Converter<Jwt, JwtAuthenticationToken> jwtAuthenticationConverter() {
        return jwt -> {
            List<String> permissions = claimList(jwt, "permissions");
            List<String> roles = claimList(jwt, "roles");
            List<GrantedAuthority> authorities = Stream.concat(
                            permissions.stream(),
                            roles.stream().map(role -> "ROLE_" + role))
                    .distinct()
                    .map(SimpleGrantedAuthority::new)
                    .map(GrantedAuthority.class::cast)
                    .toList();
            String principalName = jwt.getClaimAsString("username");
            return new JwtAuthenticationToken(jwt, authorities, principalName);
        };
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            Converter<Jwt, JwtAuthenticationToken> jwtAuthenticationConverter,
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(
                                "/api/status",
                                "/api/status/**",
                                "/api-docs",
                                "/api-docs/**",
                                "/swagger-ui.html",
                                "/swagger-ui/**")
                        .permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .oauth2ResourceServer(resourceServer -> resourceServer
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)));

        return http.build();
    }

    private static List<String> claimList(Jwt jwt, String claimName) {
        List<String> values = jwt.getClaimAsStringList(claimName);
        return values == null ? List.of() : values;
    }

    private static OAuth2TokenValidatorResult validateApplicationClaims(Jwt jwt) {
        if (jwt.getIssuedAt() == null
                || jwt.getExpiresAt() == null
                || !(jwt.getClaim("userId") instanceof Number)
                || isBlank(jwt.getSubject())
                || isBlank(jwt.getClaimAsString("username"))
                || !jwt.getSubject().equals(jwt.getClaimAsString("username"))
                || isBlank(jwt.getClaimAsString("displayName"))
                || !hasStringListClaim(jwt, "roles")
                || !hasStringListClaim(jwt, "permissions")) {
            return invalidToken("The token is missing required RIS claims.");
        }

        Duration tokenLifetime = Duration.between(jwt.getIssuedAt(), jwt.getExpiresAt());
        if (tokenLifetime.isNegative() || tokenLifetime.compareTo(JwtService.TOKEN_LIFETIME) > 0) {
            return invalidToken("The token lifetime is invalid.");
        }

        return OAuth2TokenValidatorResult.success();
    }

    private static boolean hasStringListClaim(Jwt jwt, String claimName) {
        Object claim = jwt.getClaim(claimName);
        return claim instanceof List<?> values
                && values.stream().allMatch(String.class::isInstance);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static OAuth2TokenValidatorResult invalidToken(String description) {
        return OAuth2TokenValidatorResult.failure(
                new OAuth2Error("invalid_token", description, null));
    }
}
