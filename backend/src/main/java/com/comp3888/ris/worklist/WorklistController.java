package com.comp3888.ris.worklist;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.comp3888.ris.exam.Modality;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@Validated
@RestController
@RequestMapping("/api/worklist")
@Tag(name = "Worklist", description = "Active scheduled examinations for RIS clients")
public class WorklistController {

    private final WorklistService service;

    WorklistController(WorklistService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('WORKLIST_READ')")
    @Operation(
            summary = "Query the active REST worklist",
            description = "Returns only SCHEDULED examinations. Supplied modality, inclusive scheduled-date range, and station AE-title filters are combined.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Matching worklist entries returned"),
            @ApiResponse(responseCode = "400", description = "Invalid filter value or date range"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "WORKLIST_READ permission required")
    })
    public List<WorklistResponse> getWorklist(
            @Parameter(description = "Optional exact modality")
            @RequestParam(required = false) Modality modality,
            @Parameter(description = "Optional inclusive first scheduled date in Australia/Sydney")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate scheduledDateFrom,
            @Parameter(description = "Optional inclusive final scheduled date in Australia/Sydney")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate scheduledDateTo,
            @Parameter(description = "Optional exact, case-sensitive scheduled station AE title")
            @RequestParam(required = false) String stationAeTitle) {
        WorklistCriteria criteria = new WorklistCriteria(
                modality, scheduledDateFrom, scheduledDateTo, stationAeTitle);
        return service.getWorklist(criteria).stream()
                .map(WorklistResponse::from)
                .toList();
    }
}
