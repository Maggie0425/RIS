package com.comp3888.ris.worklist;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.comp3888.ris.api.ApiExceptionHandler;
import com.comp3888.ris.exam.ExamStatus;
import com.comp3888.ris.exam.Modality;
import com.comp3888.ris.patient.PatientSex;

@WebMvcTest(controllers = WorklistController.class)
@Import({ ApiExceptionHandler.class, WorklistControllerTest.MethodSecurityTestConfiguration.class })
class WorklistControllerTest {

    @EnableMethodSecurity
    static class MethodSecurityTestConfiguration {
    }

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WorklistService service;

    @Test
    void forwardsAllFiltersAndMapsTheWorklistResponse() throws Exception {
        WorklistCriteria criteria = new WorklistCriteria(
                Modality.CT,
                LocalDate.of(2030, 1, 15),
                LocalDate.of(2030, 1, 16),
                "CT_1");
        when(service.getWorklist(criteria)).thenReturn(List.of(worklistItem()));

        mockMvc.perform(get("/api/worklist")
                        .with(jwt().authorities(() -> "WORKLIST_READ"))
                        .param("modality", "CT")
                        .param("scheduledDateFrom", "2030-01-15")
                        .param("scheduledDateTo", "2030-01-16")
                        .param("stationAeTitle", "CT_1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].patientId").value(101))
                .andExpect(jsonPath("$[0].medicalRecordNumber").value("SYN-WL-001"))
                .andExpect(jsonPath("$[0].patientFirstName").value("Avery"))
                .andExpect(jsonPath("$[0].patientLastName").value("Taylor"))
                .andExpect(jsonPath("$[0].patientDateOfBirth").value("1990-04-15"))
                .andExpect(jsonPath("$[0].patientSex").value("UNKNOWN"))
                .andExpect(jsonPath("$[0].examId").value(201))
                .andExpect(jsonPath("$[0].accessionNumber").value("SYN-WL-ACC-001"))
                .andExpect(jsonPath("$[0].requestedProcedure").value("CT chest"))
                .andExpect(jsonPath("$[0].modality").value("CT"))
                .andExpect(jsonPath("$[0].status").value("SCHEDULED"))
                .andExpect(jsonPath("$[0].scheduledStart").value("2030-01-15T10:30:00Z"))
                .andExpect(jsonPath("$[0].stationAeTitle").value("CT_1"));

        verify(service).getWorklist(criteria);
    }

    @Test
    void rejectsAReversedDateRangeBeforeCallingTheService() throws Exception {
        mockMvc.perform(get("/api/worklist")
                        .with(jwt().authorities(() -> "WORKLIST_READ"))
                        .param("scheduledDateFrom", "2030-01-16")
                        .param("scheduledDateTo", "2030-01-15"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message")
                        .value("scheduledDateFrom must be on or before scheduledDateTo"));

        verifyNoInteractions(service);
    }

    @Test
    void permitsWorklistReadAuthority() throws Exception {
        WorklistCriteria criteria = WorklistCriteria.unfiltered();
        when(service.getWorklist(criteria)).thenReturn(List.of());

        mockMvc.perform(get("/api/worklist")
                        .with(jwt().authorities(() -> "WORKLIST_READ")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());

        verify(service).getWorklist(criteria);
    }

    @Test
    void rejectsAnAuthenticatedUserWithoutWorklistReadAuthority() throws Exception {
        mockMvc.perform(get("/api/worklist")
                        .with(jwt().authorities(() -> "EXAM_READ")))
                .andExpect(status().isForbidden());

        verify(service, never()).getWorklist(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void rejectsAnUnauthenticatedRequest() throws Exception {
        mockMvc.perform(get("/api/worklist"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(service);
    }

    private static WorklistItem worklistItem() {
        return new WorklistItem(
                101L,
                "SYN-WL-001",
                "Avery",
                "Taylor",
                LocalDate.of(1990, 4, 15),
                PatientSex.UNKNOWN,
                201L,
                "SYN-WL-ACC-001",
                "CT chest",
                Modality.CT,
                ExamStatus.SCHEDULED,
                Instant.parse("2030-01-15T10:30:00Z"),
                "CT_1");
    }
}
