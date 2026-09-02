package com.comp3888.ris.exam;

import java.time.Instant;

import com.comp3888.ris.scheduling.ExamScheduleDetails;

import io.swagger.v3.oas.annotations.media.Schema;

public record ScheduleExamResponse(
        @Schema(example = "1") Long examId,
        @Schema(example = "SCHEDULED") ExamStatus status,
        @Schema(example = "1") Long scheduleId,
        Instant scheduledStart,
        @Schema(example = "CT_1") String stationAeTitle,
        Instant createdAt,
        Instant updatedAt) {

    static ScheduleExamResponse from(Exam exam, ExamScheduleDetails schedule) {
        return new ScheduleExamResponse(
                exam.getId(),
                exam.getStatus(),
                schedule.id(),
                schedule.scheduledStart(),
                schedule.stationAeTitle(),
                schedule.createdAt(),
                schedule.updatedAt());
    }
}
