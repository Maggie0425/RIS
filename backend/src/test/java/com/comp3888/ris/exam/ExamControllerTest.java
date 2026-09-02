package com.comp3888.ris.exam;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.comp3888.ris.api.ApiExceptionHandler;
import com.comp3888.ris.patient.PatientNotFoundException;

@WebMvcTest(controllers = ExamController.class)
@Import({ ApiExceptionHandler.class, ExamControllerTest.MethodSecurityTestConfiguration.class })
class ExamControllerTest {

    @EnableMethodSecurity
    static class MethodSecurityTestConfiguration {
    }

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ExamService examService;

    @MockitoBean
    private ExamWorkflowService workflowService;

    @Test
    void createExamReturnsCreatedOrderInOrderedStatus() throws Exception {
        Instant now = Instant.parse("2026-08-24T09:00:00Z");
        when(examService.createExam(any(), any())).thenReturn(new ExamResponse(
                7L, 1L, 2L, "SYN-ACC-0007", "CT abdomen", Modality.CT, ExamStatus.ORDERED, now, now));

        mockMvc.perform(post("/api/exams")
                        .with(jwt().jwt(token -> token.claim("userId", 42L)).authorities(() -> "ORDER_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"patientId":1,"requestedProcedure":"CT abdomen","modality":"CT"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessionNumber").value("SYN-ACC-0007"))
                .andExpect(jsonPath("$.status").value("ORDERED"));
    }

    @Test
    void createExamRejectsUnknownPatient() throws Exception {
        when(examService.createExam(any(), any())).thenThrow(new PatientNotFoundException(99L));

        mockMvc.perform(post("/api/exams")
                        .with(jwt().jwt(token -> token.claim("userId", 42L)).authorities(() -> "ORDER_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"patientId":99,"requestedProcedure":"CT abdomen","modality":"CT"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void createExamRejectsInvalidBody() throws Exception {
        mockMvc.perform(post("/api/exams")
                        .with(jwt().jwt(token -> token.claim("userId", 42L)).authorities(() -> "ORDER_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"patientId":1,"requestedProcedure":"","modality":"CT"}
                                """))
                .andExpect(status().isBadRequest());
        verify(examService, never()).createExam(any(), any());
    }

    @Test
    void listExamsPassesPatientAndStatusFiltersToService() throws Exception {
        Instant now = Instant.parse("2026-08-24T09:00:00Z");
        when(examService.getExams(1L, ExamStatus.ORDERED)).thenReturn(List.of(new ExamResponse(
                7L, 1L, 2L, "SYN-ACC-0007", "CT abdomen", Modality.CT, ExamStatus.ORDERED, now, now)));

        mockMvc.perform(get("/api/exams")
                        .with(jwt().authorities(() -> "EXAM_READ"))
                        .param("patientId", "1")
                        .param("status", "ORDERED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(7))
                .andExpect(jsonPath("$[0].patientId").value(1))
                .andExpect(jsonPath("$[0].status").value("ORDERED"));

        verify(examService).getExams(1L, ExamStatus.ORDERED);
    }

    @Test
    void getExamReturnsNotFoundErrorBody() throws Exception {
        when(examService.getExam(404L)).thenThrow(new ExamNotFoundException(404L));

        mockMvc.perform(get("/api/exams/404").with(jwt().authorities(() -> "EXAM_READ")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Exam 404 was not found."));
    }

    @Test
    void createExamRejectsMissingPatientAndModality() throws Exception {
        mockMvc.perform(post("/api/exams")
                        .with(jwt().jwt(token -> token.claim("userId", 42L)).authorities(() -> "ORDER_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"requestedProcedure":"CT abdomen"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.patientId").exists())
                .andExpect(jsonPath("$.fieldErrors.modality").exists());

        verify(examService, never()).createExam(any(), any());
    }

    @Test
    void listExamsRejectsUnknownStatus() throws Exception {
        mockMvc.perform(get("/api/exams").with(jwt().authorities(() -> "EXAM_READ")).param("status", "UNKNOWN"))
                .andExpect(status().isBadRequest());

        verify(examService, never()).getExams(any(), any());
    }

    @Test
    void createExamRejectsNonPositivePatientId() throws Exception {
        mockMvc.perform(post("/api/exams")
                        .with(jwt().jwt(token -> token.claim("userId", 42L)).authorities(() -> "ORDER_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"patientId":0,"requestedProcedure":"CT abdomen","modality":"CT"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.patientId").exists());

        verify(examService, never()).createExam(any(), any());
    }

    @Test
    void createExamUsesAuthenticatedUserId() throws Exception {
        Instant now = Instant.parse("2026-08-24T09:00:00Z");
        when(examService.createExam(any(), any())).thenReturn(new ExamResponse(
                7L, 1L, 42L, "SYN-ACC-0007", "CT abdomen", Modality.CT, ExamStatus.ORDERED, now, now));

        mockMvc.perform(post("/api/exams")
                        .with(jwt().jwt(token -> token.claim("userId", 42L)).authorities(() -> "ORDER_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"patientId":1,"requestedProcedure":"CT abdomen","modality":"CT"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.createdBy").value(42));

        verify(examService).createExam(any(), org.mockito.ArgumentMatchers.eq(42L));
    }

    @Test
    void scheduleExamReturnsUpdatedSchedule() throws Exception {
        Instant scheduledStart = Instant.parse("2026-09-15T09:30:00Z");
        Instant now = Instant.parse("2026-09-01T00:00:00Z");
        when(workflowService.scheduleExam(any(), any())).thenReturn(new ScheduleExamResponse(
                7L, ExamStatus.SCHEDULED, 9L, scheduledStart, "CT_1", now, now));

        mockMvc.perform(put("/api/exams/7/schedule")
                        .with(jwt().authorities(() -> "SCHEDULE_MANAGE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"scheduledStart":"2026-09-15T09:30:00Z","stationAeTitle":"CT_1"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.examId").value(7))
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.scheduleId").value(9))
                .andExpect(jsonPath("$.scheduledStart").value("2026-09-15T09:30:00Z"))
                .andExpect(jsonPath("$.stationAeTitle").value("CT_1"));

        verify(workflowService).scheduleExam(org.mockito.ArgumentMatchers.eq(7L), any());
    }

    @Test
    void cancelExamReturnsCancelledExam() throws Exception {
        Instant createdAt = Instant.parse("2026-08-24T09:00:00Z");
        Instant updatedAt = Instant.parse("2026-09-01T00:00:00Z");
        when(workflowService.cancelExam(7L)).thenReturn(new ExamResponse(
                7L, 1L, 2L, "SYN-ACC-0007", "CT abdomen", Modality.CT,
                ExamStatus.CANCELLED, createdAt, updatedAt));

        mockMvc.perform(post("/api/exams/7/cancel")
                        .with(jwt().authorities(() -> "EXAM_CANCEL")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        verify(workflowService).cancelExam(7L);
    }

    @Test
    void scheduleExamRejectsInvalidBody() throws Exception {
        mockMvc.perform(put("/api/exams/7/schedule")
                        .with(jwt().authorities(() -> "SCHEDULE_MANAGE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"stationAeTitle":""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.scheduledStart").exists())
                .andExpect(jsonPath("$.fieldErrors.stationAeTitle").exists());

        verify(workflowService, never()).scheduleExam(any(), any());
    }

    @Test
    void workflowEndpointsEnforceTheirPermissions() throws Exception {
        mockMvc.perform(put("/api/exams/7/schedule")
                        .with(jwt().authorities(() -> "EXAM_CANCEL"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"scheduledStart":"2026-09-15T09:30:00Z","stationAeTitle":"CT_1"}
                                """))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/exams/7/cancel")
                        .with(jwt().authorities(() -> "SCHEDULE_MANAGE")))
                .andExpect(status().isForbidden());

        verify(workflowService, never()).scheduleExam(any(), any());
        verify(workflowService, never()).cancelExam(any());
    }

    @Test
    void workflowConflictsReturnConflictErrorBodies() throws Exception {
        when(workflowService.scheduleExam(any(), any())).thenThrow(
                new InvalidExamTransitionException(ExamStatus.ACQUIRED, ExamStatus.SCHEDULED));
        when(workflowService.cancelExam(8L)).thenThrow(
                new InvalidExamTransitionException(ExamStatus.ACQUIRED, ExamStatus.CANCELLED));

        mockMvc.perform(put("/api/exams/7/schedule")
                        .with(jwt().authorities(() -> "SCHEDULE_MANAGE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"scheduledStart":"2026-09-15T09:30:00Z","stationAeTitle":"CT_1"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message")
                        .value("Cannot transition exam from ACQUIRED to SCHEDULED."));

        mockMvc.perform(post("/api/exams/8/cancel")
                        .with(jwt().authorities(() -> "EXAM_CANCEL")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message")
                        .value("Cannot transition exam from ACQUIRED to CANCELLED."));
    }

    @Test
    void examEndpointsEnforceTheirPermissions() throws Exception {
        mockMvc.perform(get("/api/exams").with(jwt().authorities(() -> "ORDER_CREATE")))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/exams")
                        .with(jwt().authorities(() -> "EXAM_READ"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"patientId":1,"requestedProcedure":"CT abdomen","modality":"CT"}
                                """))
                .andExpect(status().isForbidden());
    }
}
