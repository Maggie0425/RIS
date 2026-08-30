package com.comp3888.ris.exam;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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

    ExamController(ExamService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "List examinations", description = "Returns all examinations, optionally filtered by patient and exact lifecycle status.")
    @ApiResponse(responseCode = "200", description = "Examinations returned")
    public List<ExamResponse> getExams(
            @Parameter(description = "Optional patient identifier") @RequestParam(required = false) Long patientId,
            @Parameter(description = "Optional exact lifecycle status") @RequestParam(required = false) ExamStatus status) {
        return service.getExams(patientId, status);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get an examination")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Examination returned"),
            @ApiResponse(responseCode = "404", description = "Examination not found")
    })
    public ExamResponse getExam(@PathVariable Long id) {
        return service.getExam(id);
    }

    @PostMapping
    @Operation(summary = "Create an examination order in ORDERED status")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Examination created"),
            @ApiResponse(responseCode = "400", description = "Request validation failed"),
            @ApiResponse(responseCode = "404", description = "Patient not found")
    })
    public ResponseEntity<ExamResponse> createExam(@Valid @RequestBody ExamRequest request) {
        ExamResponse response = service.createExam(request);
        return ResponseEntity.created(URI.create("/api/exams/" + response.id())).body(response);
    }
}
