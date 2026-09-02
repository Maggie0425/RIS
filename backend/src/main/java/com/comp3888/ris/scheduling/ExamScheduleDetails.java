package com.comp3888.ris.scheduling;

import java.time.Instant;

public record ExamScheduleDetails(
        Long id,
        Long examId,
        Instant scheduledStart,
        String stationAeTitle,
        Instant createdAt,
        Instant updatedAt) {

    static ExamScheduleDetails from(ExamSchedule schedule) {
        return new ExamScheduleDetails(
                schedule.getId(),
                schedule.getExamId(),
                schedule.getScheduledStart(),
                schedule.getStationAeTitle(),
                schedule.getCreatedAt(),
                schedule.getUpdatedAt());
    }
}
