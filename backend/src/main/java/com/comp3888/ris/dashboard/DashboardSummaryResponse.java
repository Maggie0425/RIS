package com.comp3888.ris.dashboard;

import com.comp3888.ris.exam.ExamStatusSummary;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Counts of examinations by their current workflow status")
public record DashboardSummaryResponse(
        @Schema(description = "Total number of examinations", example = "6")
        long totalExams,
        @Schema(description = "Examinations waiting to be scheduled", example = "1")
        long ordered,
        @Schema(description = "Examinations scheduled for acquisition", example = "1")
        long scheduled,
        @Schema(description = "Acquired examinations awaiting a report", example = "1")
        long acquired,
        @Schema(description = "Reported examinations awaiting completion", example = "1")
        long reported,
        @Schema(description = "Completed examinations", example = "1")
        long completed,
        @Schema(description = "Examinations cancelled before acquisition", example = "1")
        long cancelled) {

    static DashboardSummaryResponse from(ExamStatusSummary summary) {
        return new DashboardSummaryResponse(
                summary.totalExams(),
                summary.ordered(),
                summary.scheduled(),
                summary.acquired(),
                summary.reported(),
                summary.completed(),
                summary.cancelled());
    }
}
