package com.comp3888.ris.exam;

import java.time.Instant;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ScheduleExamRequest(
        @Schema(example = "2026-09-15T09:30:00Z")
        @NotNull Instant scheduledStart,

        @Schema(example = "CT_1")
        @NotBlank @Size(max = 16) String stationAeTitle) {

    public ScheduleExamRequest {
        if (stationAeTitle != null) {
            stationAeTitle = stationAeTitle.trim();
        }
    }
}
