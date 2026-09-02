package com.comp3888.ris.scheduling;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExamSchedulingService {

    private final ExamScheduleRepository schedules;

    ExamSchedulingService(ExamScheduleRepository schedules) {
        this.schedules = schedules;
    }

    @Transactional
    public ExamScheduleDetails createSchedule(
            Long examId, Instant scheduledStart, String stationAeTitle) {
        if (schedules.findByExamId(examId).isPresent()) {
            throw ExamScheduleStateException.alreadyExists(examId);
        }

        ExamSchedule schedule = ExamSchedule.create(examId, scheduledStart, stationAeTitle);
        return ExamScheduleDetails.from(schedules.saveAndFlush(schedule));
    }

    @Transactional
    public ExamScheduleDetails reschedule(
            Long examId, Instant scheduledStart, String stationAeTitle) {
        ExamSchedule schedule = schedules.findByExamId(examId)
                .orElseThrow(() -> ExamScheduleStateException.missing(examId));
        schedule.reschedule(scheduledStart, stationAeTitle);
        return ExamScheduleDetails.from(schedules.saveAndFlush(schedule));
    }
}
