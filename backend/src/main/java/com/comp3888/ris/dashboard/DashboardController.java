package com.comp3888.ris.dashboard;

import com.comp3888.ris.exam.ExamStatisticsService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "Read-only radiology workflow overview")
public class DashboardController {

    private final ExamStatisticsService examStatisticsService;

    DashboardController(ExamStatisticsService examStatisticsService) {
        this.examStatisticsService = examStatisticsService;
    }

    @GetMapping("/summary")
    @Operation(
            summary = "Get the examination workflow summary",
            description = "Returns the total examination count and a count for every lifecycle status. "
                    + "The target authenticated API contract requires EXAM_READ permission.")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Dashboard summary returned",
                    content = @Content(schema = @Schema(implementation = DashboardSummaryResponse.class))),
            @ApiResponse(responseCode = "401", description = "Authentication required", content = @Content),
            @ApiResponse(responseCode = "403", description = "EXAM_READ permission required", content = @Content)
    })
    public DashboardSummaryResponse getSummary() {
        return DashboardSummaryResponse.from(examStatisticsService.getStatusSummary());
    }
}
