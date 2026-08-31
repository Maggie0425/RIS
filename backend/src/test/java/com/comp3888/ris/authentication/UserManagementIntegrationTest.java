package com.comp3888.ris.authentication;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class UserManagementIntegrationTest {
    @Container
    @ServiceConnection
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17-alpine");

    @Autowired MockMvc mockMvc;
    @Autowired UserAccountRepository users;
    @Autowired PasswordEncoder passwordEncoder;

    @Test
    void enforcesAuthorizationAndSupportsAccountLifecycle() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/users").with(httpBasic("receptionist", "ris-demo-password")))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/users")
                        .with(httpBasic("admin", "ris-demo-password"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"staff.user","displayName":"Staff User",\
                                "password":"another-strong-password","roles":["RECEPTIONIST"]}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.roles[0]").value("RECEPTIONIST"));

        UserAccount created = users.findByUsername("staff.user").orElseThrow();
        assertThat(created.getPasswordHash()).doesNotContain("another-strong-password");
        assertThat(passwordEncoder.matches("another-strong-password", created.getPasswordHash())).isTrue();

        mockMvc.perform(put("/api/users/{id}/roles", created.getId())
                        .with(httpBasic("admin", "ris-demo-password"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roles\":[\"RADIOLOGIST\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles[0]").value("RADIOLOGIST"));

        mockMvc.perform(patch("/api/users/{id}/enabled", created.getId())
                        .with(httpBasic("admin", "ris-demo-password"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));
    }

    @Test
    void protectsFinalEnabledAdministrator() throws Exception {
        Long adminId = users.findByUsername("admin").orElseThrow().getId();

        mockMvc.perform(patch("/api/users/{id}/enabled", adminId)
                        .with(httpBasic("admin", "ris-demo-password"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false}"))
                .andExpect(status().isConflict());
        mockMvc.perform(put("/api/users/{id}/roles", adminId)
                        .with(httpBasic("admin", "ris-demo-password"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roles\":[\"RECEPTIONIST\"]}"))
                .andExpect(status().isConflict());
    }
}
