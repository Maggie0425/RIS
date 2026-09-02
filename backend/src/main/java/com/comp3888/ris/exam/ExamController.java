package com.comp3888.ris.exam;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/api/exams")
@Tag(name = "Exams", description = "Examination orders and lifecycle status")
public class ExamController {
    private final ExamService service;
    private final ExamWorkflowService workflowService;

    ExamController(ExamService service, ExamWorkflowService workflowService) {
        this.service = service;
        this.workflowService = workflowService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('EXAM_READ')")
    @Operation(summary = "List examinations", description = "Returns all examinations, optionally filtered by patient and exact lifecycle status.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Examinations returned"),
            @ApiResponse(responseCode = "400", description = "Invalid filter value"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "EXAM_READ permission required")
    })
    public List<ExamResponse> getExams(
            @Parameter(description = "Optional patient identifier") @RequestParam(required = false) Long patientId,
            @Parameter(description = "Optional exact lifecycle status") @RequestParam(required = false) ExamStatus status) {
        return service.getExams(patientId, status);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EXAM_READ')")
    @Operation(summary = "Get an examination")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Examination returned"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "EXAM_READ permission required"),
            @ApiResponse(responseCode = "404", description = "Examination not found")
    })
    public ExamResponse getExam(@PathVariable Long id) {
        return service.getExam(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ORDER_CREATE')")
    @Operation(summary = "Create an examination order in ORDERED status")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Examination created"),
            @ApiResponse(responseCode = "400", description = "Request validation failed"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "ORDER_CREATE permission required"),
            @ApiResponse(responseCode = "404", description = "Patient not found")
    })
    public ResponseEntity<ExamResponse> createExam(
            @Valid @RequestBody ExamRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Long createdBy = ((Number) jwt.getClaim("userId")).longValue();
        ExamResponse response = service.createExam(request, createdBy);
        return ResponseEntity.created(URI.create("/api/exams/" + response.id())).body(response);
    }

    @PutMapping("/{id}/schedule")
    @PreAuthorize("hasAuthority('SCHEDULE_MANAGE')")
    @Operation(
            summary = "Schedule or reschedule an examination",
            description = "Creates the only active schedule for an ORDERED examination, or updates the existing schedule for a SCHEDULED examination.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Examination scheduled or rescheduled"),
            @ApiResponse(responseCode = "400", description = "Request validation failed"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "SCHEDULE_MANAGE permission required"),
            @ApiResponse(responseCode = "404", description = "Examination not found"),
            @ApiResponse(responseCode = "409", description = "Examination cannot be scheduled in its current state")
    })
    public ScheduleExamResponse scheduleExam(
            @PathVariable Long id,
            @Valid @RequestBody ScheduleExamRequest request) {
        return workflowService.scheduleExam(id, request);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('EXAM_CANCEL')")
    @Operation(
            summary = "Cancel an examination",
            description = "Cancels an ORDERED or SCHEDULED examination. Examinations at or beyond acquisition cannot be cancelled.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Examination cancelled"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "EXAM_CANCEL permission required"),
            @ApiResponse(responseCode = "404", description = "Examination not found"),
            @ApiResponse(responseCode = "409", description = "Examination cannot be cancelled in its current state")
    })
    public ExamResponse cancelExam(@PathVariable Long id) {
        return workflowService.cancelExam(id);
    }
}
