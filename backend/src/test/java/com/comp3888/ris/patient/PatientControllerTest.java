package com.comp3888.ris.patient;

import static org.hamcrest.Matchers.hasKey;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.comp3888.ris.api.ApiExceptionHandler;

@WebMvcTest(PatientController.class)
@Import(ApiExceptionHandler.class)
class PatientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PatientService service;

    @Test
    void getPatients_returnsJsonArray() throws Exception {
        when(service.getPatients()).thenReturn(List.of(patientResponse(1L, "SYN-000001")));

        mockMvc.perform(get("/api/patients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].medicalRecordNumber").value("SYN-000001"))
                .andExpect(jsonPath("$[0].firstName").value("Avery"))
                .andExpect(jsonPath("$[0].lastName").value("Taylor"));
    }

    @Test
    void getPatient_returnsJsonWhenFound() throws Exception {
        when(service.getPatient(1L)).thenReturn(patientResponse(1L, "SYN-000001"));

        mockMvc.perform(get("/api/patients/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.medicalRecordNumber").value("SYN-000001"));
    }

    @Test
    void getPatient_returns404WhenMissing() throws Exception {
        when(service.getPatient(99L)).thenThrow(new PatientNotFoundException(99L));

        mockMvc.perform(get("/api/patients/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    void createPatient_returns201AndLocation() throws Exception {
        PatientRequest request = validRequest("SYN-000005");
        when(service.createPatient(any(PatientRequest.class)))
                .thenReturn(patientResponse(5L, "SYN-000005"));

        mockMvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validRequestJson("SYN-000005")))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/patients/5"))
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.medicalRecordNumber").value("SYN-000005"));

        verify(service).createPatient(request);
    }

    @Test
    void createPatient_returns400ForInvalidRequest() throws Exception {
        String invalidRequest = """
                {
                  "medicalRecordNumber": " ",
                  "firstName": " ",
                  "lastName": "Taylor",
                  "dateOfBirth": "2099-01-01",
                  "sex": "UNKNOWN"
                }
                """;

        mockMvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidRequest))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.fieldErrors", hasKey("medicalRecordNumber")))
                .andExpect(jsonPath("$.fieldErrors", hasKey("firstName")))
                .andExpect(jsonPath("$.fieldErrors", hasKey("dateOfBirth")));
    }

    @Test
    void createPatient_returns409ForDuplicateMrn() throws Exception {
        PatientRequest request = validRequest("SYN-000005");
        when(service.createPatient(any(PatientRequest.class)))
                .thenThrow(new DuplicateMedicalRecordNumberException("SYN-000005"));

        mockMvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validRequestJson("SYN-000005")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"));

        verify(service).createPatient(request);
    }

    @Test
    void updatePatient_returns200ForValidRequest() throws Exception {
        PatientRequest request = validRequest("SYN-000001");
        when(service.updatePatient(any(Long.class), any(PatientRequest.class)))
                .thenReturn(patientResponse(1L, "SYN-000001"));

        mockMvc.perform(put("/api/patients/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validRequestJson("SYN-000001")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.medicalRecordNumber").value("SYN-000001"));

        verify(service).updatePatient(1L, request);
    }

    private PatientRequest validRequest(String medicalRecordNumber) {
        return new PatientRequest(
                medicalRecordNumber,
                "Avery",
                "Taylor",
                LocalDate.of(1990, 4, 15),
                PatientSex.UNKNOWN);
    }

    private PatientResponse patientResponse(Long id, String medicalRecordNumber) {
        Instant timestamp = Instant.parse("2026-08-25T00:00:00Z");
        return new PatientResponse(
                id,
                medicalRecordNumber,
                "Avery",
                "Taylor",
                LocalDate.of(1990, 4, 15),
                PatientSex.UNKNOWN,
                timestamp,
                timestamp);
    }

    private String validRequestJson(String medicalRecordNumber) {
        return """
                {
                  "medicalRecordNumber": "%s",
                  "firstName": "Avery",
                  "lastName": "Taylor",
                  "dateOfBirth": "1990-04-15",
                  "sex": "UNKNOWN"
                }
                """.formatted(medicalRecordNumber);
    }
}