package com.comp3888.ris.authentication;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PatientAuthorizationIntegrationTest {

    private static final String PATIENT_BODY = """
            {
              "medicalRecordNumber": "AUTHZ-TEST-001",
              "firstName": "Security",
              "lastName": "Test",
              "dateOfBirth": "2000-01-01",
              "sex": "UNKNOWN"
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void protectedPatientRequestsWithoutTokensReceiveUnauthorized() throws Exception {
        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PATIENT_BODY))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/patients/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PATIENT_BODY))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void patientReadPermissionAllowsReadsButNotWrites() throws Exception {
        String token = login("technologist");

        mockMvc.perform(get("/api/patients").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/patients/1").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/patients")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PATIENT_BODY))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/patients/1")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PATIENT_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void patientWritePermissionAllowsCreationAndUpdates() throws Exception {
        String token = login("receptionist");

        MvcResult createResult = mockMvc.perform(post("/api/patients")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PATIENT_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.medicalRecordNumber").value("AUTHZ-TEST-001"))
                .andReturn();
        Number patientId = JsonPath.read(
                createResult.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(put("/api/patients/" + patientId.longValue())
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PATIENT_BODY.replace("Security", "Updated")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Updated"));
    }

    @Test
    void deprecatedPatientDeleteEndpointIsRemoved() throws Exception {
        String token = login("admin");

        mockMvc.perform(delete("/api/patients/1")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    void onlyDocumentedPublicRoutesAreAccessibleWithoutTokens() throws Exception {
        mockMvc.perform(get("/api/status"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api-docs"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/swagger-ui.html"))
                .andExpect(status().is3xxRedirection());

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isUnauthorized());
    }

    private String login(String username) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"%s","password":"ris-demo-password"}
                                """.formatted(username)))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
