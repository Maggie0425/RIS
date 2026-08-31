package com.comp3888.ris.authentication;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthenticationIntegrationTest {

    private static final String DEMO_PASSWORD = "ris-demo-password";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtDecoder jwtDecoder;

    @Autowired
    private JwtEncoder jwtEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @ParameterizedTest
    @ValueSource(strings = {"admin", "receptionist", "technologist", "radiologist"})
    void enabledSyntheticUsersCanLogInAndReceiveFifteenMinuteTokens(String username)
            throws Exception {
        String tokenValue = login(username);

        Jwt jwt = jwtDecoder.decode(tokenValue);
        assertEquals(username, jwt.getSubject());
        assertEquals(username, jwt.getClaimAsString("username"));
        assertNotNull(jwt.getClaim("userId"));
        assertNotNull(jwt.getClaimAsStringList("roles"));
        assertNotNull(jwt.getClaimAsStringList("permissions"));
        assertEquals(Duration.ofMinutes(15), Duration.between(jwt.getIssuedAt(), jwt.getExpiresAt()));
        assertFalse(jwt.getClaims().containsKey("password"));
        assertFalse(jwt.getClaims().containsKey("passwordHash"));
    }

    @Test
    void invalidCredentialsAndDisabledUsersReceiveUnauthorized() throws Exception {
        assertLoginUnauthorized("receptionist", "wrong-password");
        assertLoginUnauthorized("unknown-user", DEMO_PASSWORD);

        jdbcTemplate.update("UPDATE users SET enabled = FALSE WHERE username = ?", "technologist");
        assertLoginUnauthorized("technologist", DEMO_PASSWORD);
    }

    @Test
    void meReturnsRolesAndPermissionsWithoutCredentials() throws Exception {
        String loginBody = loginResult("receptionist", DEMO_PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username").value("receptionist"))
                .andExpect(jsonPath("$.user.roles[0]").value("RECEPTIONIST"))
                .andExpect(jsonPath("$.user.permissions").isArray())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String token = JsonPath.read(loginBody, "$.accessToken");

        String meBody = mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.username").value("receptionist"))
                .andExpect(jsonPath("$.displayName").value("Demo Receptionist"))
                .andExpect(jsonPath("$.roles[0]").value("RECEPTIONIST"))
                .andExpect(jsonPath("$.permissions").isArray())
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertFalse(loginBody.toLowerCase().contains("password"));
        assertFalse(meBody.toLowerCase().contains("password"));
    }

    @Test
    void missingMalformedAndExpiredTokensReceiveUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(HttpHeaders.WWW_AUTHENTICATE, "Bearer"));

        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer("not-a-jwt")))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(expiredToken())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void multipleRolesProduceTheUnionOfPermissions() throws Exception {
        jdbcTemplate.update("""
                INSERT INTO user_roles (user_id, role_id)
                SELECT users.id, roles.id
                FROM users
                CROSS JOIN roles
                WHERE users.username = ? AND roles.code = ?
                """, "receptionist", "RADIOLOGIST");

        Jwt jwt = jwtDecoder.decode(login("receptionist"));
        assertEquals(Set.of("RECEPTIONIST", "RADIOLOGIST"),
                new HashSet<>(jwt.getClaimAsStringList("roles")));
        assertEquals(Set.of(
                        "PATIENT_READ",
                        "PATIENT_WRITE",
                        "EXAM_READ",
                        "ORDER_CREATE",
                        "SCHEDULE_MANAGE",
                        "EXAM_CANCEL",
                        "WORKLIST_READ",
                        "REPORT_READ",
                        "REPORT_WRITE",
                        "EXAM_COMPLETE"),
                new HashSet<>(jwt.getClaimAsStringList("permissions")));
    }

    @Test
    void adminReceivesEveryPermission() throws Exception {
        Jwt jwt = jwtDecoder.decode(login("admin"));
        Set<String> expectedPermissions = Arrays.stream(PermissionCode.values())
                .map(Enum::name)
                .collect(java.util.stream.Collectors.toSet());

        assertEquals(expectedPermissions, new HashSet<>(jwt.getClaimAsStringList("permissions")));
    }

    private String login(String username) throws Exception {
        MvcResult result = loginResult(username, DEMO_PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }

    private org.springframework.test.web.servlet.ResultActions loginResult(
            String username, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username":"%s","password":"%s"}
                        """.formatted(username, password)));
    }

    private void assertLoginUnauthorized(String username, String password) throws Exception {
        loginResult(username, password)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username or password."));
    }

    private String expiredToken() {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("ris-backend")
                .subject("expired-user")
                .issuedAt(now.minusSeconds(300))
                .expiresAt(now.minusSeconds(180))
                .claim("userId", -1L)
                .claim("username", "expired-user")
                .claim("displayName", "Expired User")
                .claim("roles", List.of("RECEPTIONIST"))
                .claim("permissions", List.of("PATIENT_READ"))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).type("JWT").build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
