package com.comp3888.ris.exam;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import com.comp3888.ris.support.PostgreSqlTestContainerConfiguration;
import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@Import(PostgreSqlTestContainerConfiguration.class)
@Transactional
class SchedulingWorklistIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void schedulingReschedulingAndCancellationUpdateSubsequentWorklistResults() throws Exception {
        String token = login("receptionist");
        Long examId = examId("SYN-ACC-0001");

        MvcResult firstSchedule = mockMvc.perform(put("/api/exams/{id}/schedule", examId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"scheduledStart":"2032-01-15T10:00:00Z","stationAeTitle":" CT_API_1 "}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.examId").value(examId))
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.stationAeTitle").value("CT_API_1"))
                .andReturn();
        Number scheduleId = JsonPath.read(
                firstSchedule.getResponse().getContentAsString(), "$.scheduleId");

        assertThat(scheduleCount(examId)).isEqualTo(1);
        assertThat(examStatus(examId)).isEqualTo("SCHEDULED");
        queryWorklist(token, "2032-01-15", "CT_API_1")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].examId").value(examId));

        mockMvc.perform(put("/api/exams/{id}/schedule", examId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"scheduledStart":"2032-01-16T11:30:00Z","stationAeTitle":"CT_API_2"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.scheduleId").value(scheduleId.longValue()))
                .andExpect(jsonPath("$.stationAeTitle").value("CT_API_2"));

        assertThat(scheduleCount(examId)).isEqualTo(1);
        queryWorklist(token, "2032-01-15", "CT_API_1")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
        queryWorklist(token, "2032-01-16", "CT_API_2")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].examId").value(examId));

        mockMvc.perform(post("/api/exams/{id}/cancel", examId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        assertThat(examStatus(examId)).isEqualTo("CANCELLED");
        assertThat(scheduleCount(examId)).isEqualTo(1);
        queryWorklist(token, "2032-01-16", "CT_API_2")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void orderedExaminationsCanBeCancelledButAcquiredExaminationsCannot() throws Exception {
        String token = login("receptionist");
        Long orderedExamId = examId("SYN-ACC-0001");
        Long acquiredExamId = examId("SYN-ACC-0003");

        mockMvc.perform(post("/api/exams/{id}/cancel", orderedExamId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        mockMvc.perform(post("/api/exams/{id}/cancel", acquiredExamId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value(
                        "Cannot transition exam from ACQUIRED to CANCELLED."));
    }

    @Test
    void schedulingReturnsNotFoundAndLifecycleConflictResponses() throws Exception {
        String token = login("receptionist");
        Long acquiredExamId = examId("SYN-ACC-0003");
        String scheduleBody = """
                {"scheduledStart":"2032-01-15T10:00:00Z","stationAeTitle":"CT_API_1"}
                """;

        mockMvc.perform(put("/api/exams/{id}/schedule", Long.MAX_VALUE)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scheduleBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));

        mockMvc.perform(put("/api/exams/{id}/schedule", acquiredExamId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scheduleBody))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value(
                        "Cannot transition exam from ACQUIRED to SCHEDULED."));
    }

    @Test
    void endpointsEnforceScheduleCancelAndWorklistPermissions() throws Exception {
        Long examId = examId("SYN-ACC-0001");
        String scheduleBody = """
                {"scheduledStart":"2032-01-15T10:00:00Z","stationAeTitle":"CT_API_1"}
                """;

        mockMvc.perform(put("/api/exams/{id}/schedule", examId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scheduleBody))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/exams/{id}/cancel", examId))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/worklist"))
                .andExpect(status().isUnauthorized());

        String technologistToken = login("technologist");
        mockMvc.perform(put("/api/exams/{id}/schedule", examId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(technologistToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scheduleBody))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/exams/{id}/cancel", examId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(technologistToken)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/worklist")
                        .header(HttpHeaders.AUTHORIZATION, bearer(technologistToken)))
                .andExpect(status().isOk());
    }

    @Test
    void invalidScheduleBodiesAndWorklistRangesReturnBadRequest() throws Exception {
        String token = login("receptionist");
        Long examId = examId("SYN-ACC-0001");

        mockMvc.perform(put("/api/exams/{id}/schedule", examId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"stationAeTitle":""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.scheduledStart").exists())
                .andExpect(jsonPath("$.fieldErrors.stationAeTitle").exists());

        mockMvc.perform(get("/api/worklist")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .param("scheduledDateFrom", "2032-01-16")
                        .param("scheduledDateTo", "2032-01-15"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "scheduledDateFrom must be on or before scheduledDateTo"));
    }

    private org.springframework.test.web.servlet.ResultActions queryWorklist(
            String token, String scheduledDate, String stationAeTitle) throws Exception {
        return mockMvc.perform(get("/api/worklist")
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .param("modality", "CT")
                .param("scheduledDateFrom", scheduledDate)
                .param("scheduledDateTo", scheduledDate)
                .param("stationAeTitle", stationAeTitle));
    }

    private Long examId(String accessionNumber) {
        return jdbc.queryForObject(
                "select id from exams where accession_number = ?",
                Long.class,
                accessionNumber);
    }

    private String examStatus(Long examId) {
        return jdbc.queryForObject(
                "select status from exams where id = ?",
                String.class,
                examId);
    }

    private Integer scheduleCount(Long examId) {
        return jdbc.queryForObject(
                "select count(*) from exam_schedules where exam_id = ?",
                Integer.class,
                examId);
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
