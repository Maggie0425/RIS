package com.comp3888.ris.exam;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/exams")
@Tag(name = "Exams", description = "Examination orders and lifecycle status")
public class ExamController {

    private final ExamService service;

    ExamController(ExamService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "List examinations", description = "Returns all examinations or only those in the requested status.")
    @ApiResponse(responseCode = "200", description = "Examinations returned")
    public List<ExamResponse> getExams(
            @Parameter(description = "Optional exact lifecycle status")
            @RequestParam(required = false) ExamStatus status) {
        return service.getExams(status);
    }
}
