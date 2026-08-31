package com.comp3888.ris.authentication;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    AuthenticationService(AuthenticationManager authenticationManager, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    LoginResponse login(LoginRequest request) {
        String username = request.username() == null ? "" : request.username().trim();
        String password = request.password() == null ? "" : request.password();
        if (username.isBlank() || password.isBlank()) {
            throw new BadCredentialsException("Invalid username or password.");
        }

        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(username, password));
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        JwtService.IssuedToken token = jwtService.issue(user);

        return new LoginResponse(
                token.value(),
                "Bearer",
                token.expiresAt(),
                CurrentUserResponse.from(user));
    }
}
