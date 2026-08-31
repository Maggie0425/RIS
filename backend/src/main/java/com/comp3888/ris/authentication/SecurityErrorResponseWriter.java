package com.comp3888.ris.authentication;

import java.io.IOException;
import java.time.Clock;

import org.springframework.http.MediaType;

import jakarta.servlet.http.HttpServletResponse;

final class SecurityErrorResponseWriter {

    private SecurityErrorResponseWriter() {
    }

    static void write(
            HttpServletResponse response,
            int status,
            String error,
            String message,
            Clock clock) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("""
                {"timestamp":"%s","status":%d,"error":"%s","message":"%s","fieldErrors":{}}"""
                .formatted(clock.instant(), status, error, message));
    }
}
