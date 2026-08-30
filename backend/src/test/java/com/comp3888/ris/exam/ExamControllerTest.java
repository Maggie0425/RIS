package com.comp3888.ris.exam;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.comp3888.ris.api.ApiExceptionHandler;
import com.comp3888.ris.patient.PatientNotFoundException;

@WebMvcTest(controllers = ExamController.class)
@Import(ApiExceptionHandler.class)
class ExamControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ExamService examService;

    @Test
    void createExamReturnsCreatedOrderInOrderedStatus() throws Exception {
        Instant now = Instant.parse("2026-08-24T09:00:00Z");
        when(examService.createExam(any())).thenReturn(new ExamResponse(
                7L, 1L, 2L, "SYN-ACC-0007", "CT abdomen", Modality.CT, ExamStatus.ORDERED, now, now));

        mockMvc.perform(post("/api/exams")
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
        when(examService.createExam(any())).thenThrow(new PatientNotFoundException(99L));

        mockMvc.perform(post("/api/exams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"patientId":99,"requestedProcedure":"CT abdomen","modality":"CT"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void createExamRejectsInvalidBody() throws Exception {
        mockMvc.perform(post("/api/exams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"patientId":1,"requestedProcedure":"","modality":"CT"}
                                """))
                .andExpect(status().isBadRequest());
        verify(examService, never()).createExam(any());
    }

    @Test
    void listExamsPassesPatientAndStatusFiltersToService() throws Exception {
        Instant now = Instant.parse("2026-08-24T09:00:00Z");
        when(examService.getExams(1L, ExamStatus.ORDERED)).thenReturn(List.of(new ExamResponse(
                7L, 1L, 2L, "SYN-ACC-0007", "CT abdomen", Modality.CT, ExamStatus.ORDERED, now, now)));

        mockMvc.perform(get("/api/exams")
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

        mockMvc.perform(get("/api/exams/404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Exam 404 was not found."));
    }

    @Test
    void createExamRejectsMissingPatientAndModality() throws Exception {
        mockMvc.perform(post("/api/exams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"requestedProcedure":"CT abdomen"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.patientId").exists())
                .andExpect(jsonPath("$.fieldErrors.modality").exists());

        verify(examService, never()).createExam(any());
    }

    @Test
    void listExamsRejectsUnknownStatus() throws Exception {
        mockMvc.perform(get("/api/exams").param("status", "UNKNOWN"))
                .andExpect(status().isBadRequest());

        verify(examService, never()).getExams(any(), any());
    }
}
