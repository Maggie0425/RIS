package com.comp3888.ris.scheduling;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNullPointerException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

class ExamScheduleTest {

    private static final Long EXAM_ID = 101L;
    private static final Instant SCHEDULED_START = Instant.parse("2026-09-01T09:30:00Z");

    @Test
    void createInitializesValidScheduleAndTimestamps() {
        ExamSchedule schedule = ExamSchedule.create(EXAM_ID, SCHEDULED_START, "  CTROOM1  ");

        assertThat(schedule.getExamId()).isEqualTo(EXAM_ID);
        assertThat(schedule.getScheduledStart()).isEqualTo(SCHEDULED_START);
        assertThat(schedule.getStationAeTitle()).isEqualTo("CTROOM1");
        assertThat(schedule.getCreatedAt()).isNotNull();
        assertThat(schedule.getUpdatedAt()).isEqualTo(schedule.getCreatedAt());
    }

    @Test
    void rescheduleChangesStartTimeAndStationAeTitleButPreservesExamIdAndCreatedAt() {
        ExamSchedule schedule = ExamSchedule.create(EXAM_ID, SCHEDULED_START, "CTROOM1");
        Instant createdAt = schedule.getCreatedAt();
        Instant previousUpdatedAt = schedule.getUpdatedAt();
        Instant newStart = Instant.parse("2026-09-01T10:45:00Z");

        schedule.reschedule(newStart, "  MRROOM2  ");

        assertThat(schedule.getExamId()).isEqualTo(EXAM_ID);
        assertThat(schedule.getScheduledStart()).isEqualTo(newStart);
        assertThat(schedule.getStationAeTitle()).isEqualTo("MRROOM2");
        assertThat(schedule.getCreatedAt()).isEqualTo(createdAt);
        assertThat(schedule.getUpdatedAt()).isAfter(previousUpdatedAt);
    }

    @ParameterizedTest
    @NullSource
    void createRejectsMissingExamId(Long examId) {
        assertThatNullPointerException()
                .isThrownBy(() -> ExamSchedule.create(examId, SCHEDULED_START, "CTROOM1"))
                .withMessage("examId is required");
    }

    @Test
    void createRejectsMissingScheduledStart() {
        assertThatNullPointerException()
                .isThrownBy(() -> ExamSchedule.create(EXAM_ID, null, "CTROOM1"))
                .withMessage("scheduledStart is required");
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "   "})
    void createRejectsInvalidStationAeTitle(String stationAeTitle) {
        assertThatThrownBy(() -> ExamSchedule.create(EXAM_ID, SCHEDULED_START, stationAeTitle))
                .isInstanceOfAny(NullPointerException.class, IllegalArgumentException.class);
    }

    @ParameterizedTest
    @MethodSource("tooLongAeTitles")
    void createRejectsStationAeTitleLongerThanSixteenCharacters(String stationAeTitle) {
        assertThatThrownBy(() -> ExamSchedule.create(EXAM_ID, SCHEDULED_START, stationAeTitle))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("stationAeTitle must be 16 characters or fewer");
    }

    @Test
    void rescheduleRejectsMissingScheduledStartWithoutChangingSchedule() {
        ExamSchedule schedule = ExamSchedule.create(EXAM_ID, SCHEDULED_START, "CTROOM1");
        Instant previousUpdatedAt = schedule.getUpdatedAt();

        assertThatNullPointerException()
                .isThrownBy(() -> schedule.reschedule(null, "MRROOM2"))
                .withMessage("scheduledStart is required");

        assertThat(schedule.getExamId()).isEqualTo(EXAM_ID);
        assertThat(schedule.getScheduledStart()).isEqualTo(SCHEDULED_START);
        assertThat(schedule.getStationAeTitle()).isEqualTo("CTROOM1");
        assertThat(schedule.getUpdatedAt()).isEqualTo(previousUpdatedAt);
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "   ", "ABCDEFGHIJKLMNOPQ"})
    void rescheduleRejectsInvalidStationAeTitleWithoutChangingSchedule(String stationAeTitle) {
        ExamSchedule schedule = ExamSchedule.create(EXAM_ID, SCHEDULED_START, "CTROOM1");
        Instant previousUpdatedAt = schedule.getUpdatedAt();
        Instant newStart = Instant.parse("2026-09-01T10:45:00Z");

        assertThatThrownBy(() -> schedule.reschedule(newStart, stationAeTitle))
                .isInstanceOfAny(NullPointerException.class, IllegalArgumentException.class);

        assertThat(schedule.getExamId()).isEqualTo(EXAM_ID);
        assertThat(schedule.getScheduledStart()).isEqualTo(SCHEDULED_START);
        assertThat(schedule.getStationAeTitle()).isEqualTo("CTROOM1");
        assertThat(schedule.getUpdatedAt()).isEqualTo(previousUpdatedAt);
    }

    private static Stream<String> tooLongAeTitles() {
        return Stream.of("ABCDEFGHIJKLMNOPQ", "  ABCDEFGHIJKLMNOPQ  ");
    }
}
