package com.comp3888.ris.exam;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.comp3888.ris.scheduling.ExamScheduleDetails;
import com.comp3888.ris.scheduling.ExamSchedulingService;

@ExtendWith(MockitoExtension.class)
class ExamWorkflowServiceTest {

    private static final Long EXAM_ID = 41L;
    private static final Instant INITIAL_START = Instant.parse("2030-01-15T10:30:00Z");
    private static final Instant UPDATED_START = Instant.parse("2030-01-16T11:45:00Z");

    @Mock
    private ExamRepository exams;

    @Mock
    private ExamSchedulingService scheduling;

    private ExamWorkflowService service;

    @BeforeEach
    void setUp() {
        service = new ExamWorkflowService(exams, scheduling);
    }

    @Test
    void firstSchedulingCreatesScheduleAndTransitionsOrderedExam() {
        Exam exam = examInStatus(ExamStatus.ORDERED);
        ScheduleExamRequest request = new ScheduleExamRequest(INITIAL_START, "CT_1");
        ExamScheduleDetails details = scheduleDetails(501L, INITIAL_START, "CT_1");
        when(exams.findByIdForUpdate(EXAM_ID)).thenReturn(Optional.of(exam));
        when(scheduling.createSchedule(EXAM_ID, INITIAL_START, "CT_1")).thenReturn(details);

        ScheduleExamResponse response = service.scheduleExam(EXAM_ID, request);

        assertThat(exam.getStatus()).isEqualTo(ExamStatus.SCHEDULED);
        assertThat(response.examId()).isEqualTo(EXAM_ID);
        assertThat(response.status()).isEqualTo(ExamStatus.SCHEDULED);
        assertThat(response.scheduleId()).isEqualTo(501L);
        assertThat(response.scheduledStart()).isEqualTo(INITIAL_START);
        assertThat(response.stationAeTitle()).isEqualTo("CT_1");
        verify(scheduling).createSchedule(EXAM_ID, INITIAL_START, "CT_1");
        verify(scheduling, never()).reschedule(EXAM_ID, INITIAL_START, "CT_1");
        verify(exams).flush();
    }

    @Test
    void reschedulingUpdatesExistingScheduleWithoutRepeatingLifecycleTransition() {
        Exam exam = examInStatus(ExamStatus.SCHEDULED);
        ScheduleExamRequest request = new ScheduleExamRequest(UPDATED_START, "MR_2");
        ExamScheduleDetails details = scheduleDetails(501L, UPDATED_START, "MR_2");
        when(exams.findByIdForUpdate(EXAM_ID)).thenReturn(Optional.of(exam));
        when(scheduling.reschedule(EXAM_ID, UPDATED_START, "MR_2")).thenReturn(details);

        ScheduleExamResponse response = service.scheduleExam(EXAM_ID, request);

        assertThat(exam.getStatus()).isEqualTo(ExamStatus.SCHEDULED);
        assertThat(response.status()).isEqualTo(ExamStatus.SCHEDULED);
        assertThat(response.scheduleId()).isEqualTo(501L);
        assertThat(response.scheduledStart()).isEqualTo(UPDATED_START);
        assertThat(response.stationAeTitle()).isEqualTo("MR_2");
        verify(scheduling).reschedule(EXAM_ID, UPDATED_START, "MR_2");
        verify(scheduling, never()).createSchedule(EXAM_ID, UPDATED_START, "MR_2");
        verify(exams).flush();
    }

    @ParameterizedTest(name = "cannot schedule an exam in {0}")
    @MethodSource("nonSchedulableStatuses")
    void schedulingRejectsInvalidLifecycleStates(ExamStatus status) {
        Exam exam = examInStatus(status);
        when(exams.findByIdForUpdate(EXAM_ID)).thenReturn(Optional.of(exam));

        assertThatThrownBy(() -> service.scheduleExam(
                        EXAM_ID, new ScheduleExamRequest(INITIAL_START, "CT_1")))
                .isInstanceOf(InvalidExamTransitionException.class)
                .hasMessageContaining(status.name())
                .hasMessageContaining(ExamStatus.SCHEDULED.name());

        verifyNoInteractions(scheduling);
        verify(exams, never()).flush();
    }

    @ParameterizedTest(name = "can cancel an exam in {0}")
    @MethodSource("cancellableStatuses")
    void cancellationTransitionsEligibleExamAndFlushes(ExamStatus status) {
        Exam exam = examInStatus(status);
        when(exams.findByIdForUpdate(EXAM_ID)).thenReturn(Optional.of(exam));

        ExamResponse response = service.cancelExam(EXAM_ID);

        assertThat(exam.getStatus()).isEqualTo(ExamStatus.CANCELLED);
        assertThat(response.id()).isEqualTo(EXAM_ID);
        assertThat(response.status()).isEqualTo(ExamStatus.CANCELLED);
        verify(exams).flush();
        verifyNoInteractions(scheduling);
    }

    @Test
    void cancellationRejectsAnExamAfterAcquisition() {
        Exam exam = examInStatus(ExamStatus.ACQUIRED);
        when(exams.findByIdForUpdate(EXAM_ID)).thenReturn(Optional.of(exam));

        assertThatThrownBy(() -> service.cancelExam(EXAM_ID))
                .isInstanceOf(InvalidExamTransitionException.class)
                .hasMessageContaining(ExamStatus.ACQUIRED.name())
                .hasMessageContaining(ExamStatus.CANCELLED.name());

        assertThat(exam.getStatus()).isEqualTo(ExamStatus.ACQUIRED);
        verify(exams, never()).flush();
        verifyNoInteractions(scheduling);
    }

    @Test
    void schedulingReportsMissingExamBeforeCallingSchedulingService() {
        when(exams.findByIdForUpdate(EXAM_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.scheduleExam(
                        EXAM_ID, new ScheduleExamRequest(INITIAL_START, "CT_1")))
                .isInstanceOf(ExamNotFoundException.class)
                .hasMessage("Exam 41 was not found.");

        verifyNoInteractions(scheduling);
        verify(exams, never()).flush();
    }

    @Test
    void cancellationReportsMissingExam() {
        when(exams.findByIdForUpdate(EXAM_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.cancelExam(EXAM_ID))
                .isInstanceOf(ExamNotFoundException.class)
                .hasMessage("Exam 41 was not found.");

        verify(exams, never()).flush();
        verifyNoInteractions(scheduling);
    }

    private static Stream<ExamStatus> nonSchedulableStatuses() {
        return Stream.of(
                ExamStatus.ACQUIRED,
                ExamStatus.REPORTED,
                ExamStatus.COMPLETED,
                ExamStatus.CANCELLED);
    }

    private static Stream<Arguments> cancellableStatuses() {
        return Stream.of(
                Arguments.of(ExamStatus.ORDERED),
                Arguments.of(ExamStatus.SCHEDULED));
    }

    private static Exam examInStatus(ExamStatus status) {
        Exam exam = Exam.createOrder(
                10L, 20L, "SYN-WF-0041", "CT abdomen", Modality.CT);
        ReflectionTestUtils.setField(exam, "id", EXAM_ID);

        if (status == ExamStatus.CANCELLED) {
            exam.cancel();
            return exam;
        }
        if (status == ExamStatus.ORDERED) {
            return exam;
        }

        exam.markScheduled();
        if (status == ExamStatus.SCHEDULED) {
            return exam;
        }
        exam.markAcquired();
        if (status == ExamStatus.ACQUIRED) {
            return exam;
        }
        exam.markReported();
        if (status == ExamStatus.REPORTED) {
            return exam;
        }
        exam.markCompleted();
        return exam;
    }

    private static ExamScheduleDetails scheduleDetails(
            Long scheduleId, Instant scheduledStart, String stationAeTitle) {
        Instant createdAt = Instant.parse("2030-01-01T00:00:00Z");
        return new ExamScheduleDetails(
                scheduleId,
                EXAM_ID,
                scheduledStart,
                stationAeTitle,
                createdAt,
                createdAt.plusSeconds(1));
    }
}
