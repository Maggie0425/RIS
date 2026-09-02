package com.comp3888.ris.scheduling;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ExamSchedulingServiceTest {

    private static final Long EXAM_ID = 41L;
    private static final Long SCHEDULE_ID = 501L;
    private static final Instant INITIAL_START = Instant.parse("2030-01-15T10:30:00Z");
    private static final Instant UPDATED_START = Instant.parse("2030-01-16T11:45:00Z");

    @Mock
    private ExamScheduleRepository schedules;

    private ExamSchedulingService service;

    @BeforeEach
    void setUp() {
        service = new ExamSchedulingService(schedules);
    }

    @Test
    void createsFirstScheduleWhenExamHasNoExistingSchedule() {
        when(schedules.findByExamId(EXAM_ID)).thenReturn(Optional.empty());
        when(schedules.saveAndFlush(any(ExamSchedule.class))).thenAnswer(invocation -> {
            ExamSchedule schedule = invocation.getArgument(0);
            ReflectionTestUtils.setField(schedule, "id", SCHEDULE_ID);
            return schedule;
        });

        ExamScheduleDetails result = service.createSchedule(EXAM_ID, INITIAL_START, "  CT_1  ");

        assertThat(result.id()).isEqualTo(SCHEDULE_ID);
        assertThat(result.examId()).isEqualTo(EXAM_ID);
        assertThat(result.scheduledStart()).isEqualTo(INITIAL_START);
        assertThat(result.stationAeTitle()).isEqualTo("CT_1");
        assertThat(result.createdAt()).isNotNull();
        assertThat(result.updatedAt()).isEqualTo(result.createdAt());
        verify(schedules).saveAndFlush(any(ExamSchedule.class));
    }

    @Test
    void creatingScheduleRejectsExamThatAlreadyHasOne() {
        ExamSchedule existing = schedule(SCHEDULE_ID, INITIAL_START, "CT_1");
        when(schedules.findByExamId(EXAM_ID)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.createSchedule(EXAM_ID, UPDATED_START, "MR_2"))
                .isInstanceOf(ExamScheduleStateException.class)
                .hasMessage("Exam 41 already has an active schedule.");

        verify(schedules, never()).saveAndFlush(any());
    }

    @Test
    void reschedulesExistingRowAndPreservesIdentityAndCreationTime() {
        ExamSchedule existing = schedule(SCHEDULE_ID, INITIAL_START, "CT_1");
        Instant createdAt = existing.getCreatedAt();
        Instant previousUpdatedAt = existing.getUpdatedAt();
        when(schedules.findByExamId(EXAM_ID)).thenReturn(Optional.of(existing));
        when(schedules.saveAndFlush(existing)).thenReturn(existing);

        ExamScheduleDetails result = service.reschedule(EXAM_ID, UPDATED_START, "  MR_2  ");

        assertThat(result.id()).isEqualTo(SCHEDULE_ID);
        assertThat(result.examId()).isEqualTo(EXAM_ID);
        assertThat(result.scheduledStart()).isEqualTo(UPDATED_START);
        assertThat(result.stationAeTitle()).isEqualTo("MR_2");
        assertThat(result.createdAt()).isEqualTo(createdAt);
        assertThat(result.updatedAt()).isAfter(previousUpdatedAt);
        verify(schedules).saveAndFlush(existing);
    }

    @Test
    void reschedulingRejectsExamWithoutExistingSchedule() {
        when(schedules.findByExamId(EXAM_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.reschedule(EXAM_ID, UPDATED_START, "MR_2"))
                .isInstanceOf(ExamScheduleStateException.class)
                .hasMessage("Exam 41 is SCHEDULED but has no active schedule.");

        verify(schedules, never()).saveAndFlush(any());
    }

    private static ExamSchedule schedule(
            Long scheduleId, Instant scheduledStart, String stationAeTitle) {
        ExamSchedule schedule = ExamSchedule.create(EXAM_ID, scheduledStart, stationAeTitle);
        ReflectionTestUtils.setField(schedule, "id", scheduleId);
        return schedule;
    }
}
