package com.comp3888.ris.exam;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.Arrays;
import java.util.function.Consumer;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class ExamLifecycleTest {

    private static final Long PATIENT_ID = 101L;
    private static final Long CREATED_BY = 202L;
    private static final String ACCESSION_NUMBER = "SYN-ACC-0101";
    private static final String REQUESTED_PROCEDURE = "CT abdomen";
    private static final Modality MODALITY = Modality.CT;

    private static final ExamStatus[] LIFECYCLE_STATUSES = {
        ExamStatus.ORDERED,
        ExamStatus.SCHEDULED,
        ExamStatus.ACQUIRED,
        ExamStatus.REPORTED,
        ExamStatus.COMPLETED
    };

    @Test
    void createOrderInitializesOrderAndTimestamps() {
        Exam exam = newOrder();

        assertEquals(PATIENT_ID, exam.getPatientId());
        assertEquals(CREATED_BY, exam.getCreatedBy());
        assertEquals(ACCESSION_NUMBER, exam.getAccessionNumber());
        assertEquals(REQUESTED_PROCEDURE, exam.getRequestedProcedure());
        assertEquals(MODALITY, exam.getModality());
        assertEquals(ExamStatus.ORDERED, exam.getStatus());
        assertNotNull(exam.getCreatedAt());
        assertEquals(exam.getCreatedAt(), exam.getUpdatedAt());
    }

    @ParameterizedTest(name = "{0} can transition to {2}")
    @MethodSource("validTransitions")
    void permitsOnlyTheDocumentedNextState(
            ExamStatus startingStatus, Transition transition, ExamStatus expectedStatus) {
        Exam exam = examInStatus(startingStatus);
        Instant createdAt = exam.getCreatedAt();
        Instant previousUpdatedAt = exam.getUpdatedAt();

        transition.apply(exam);

        assertEquals(expectedStatus, exam.getStatus());
        assertEquals(createdAt, exam.getCreatedAt());
        assertTrue(exam.getUpdatedAt().isAfter(previousUpdatedAt));
    }

    @ParameterizedTest(name = "{1} is rejected from {0}")
    @MethodSource("invalidTransitions")
    void rejectsInvalidTransitionsWithoutChangingState(
            ExamStatus startingStatus, Transition transition) {
        Exam exam = examInStatus(startingStatus);
        Instant originalUpdatedAt = exam.getUpdatedAt();

        InvalidExamTransitionException exception = assertThrows(
                InvalidExamTransitionException.class,
                () -> transition.apply(exam));

        assertTrue(exception.getMessage().contains(startingStatus.name()));
        assertTrue(exception.getMessage().contains(transition.targetStatus().name()));
        assertEquals(startingStatus, exam.getStatus());
        assertEquals(originalUpdatedAt, exam.getUpdatedAt());
    }

    private static Stream<Arguments> validTransitions() {
        return Arrays.stream(Transition.values())
                .map(transition -> Arguments.of(
                        transition.requiredStatus(),
                        transition,
                        transition.targetStatus()));
    }

    private static Stream<Arguments> invalidTransitions() {
        return Arrays.stream(LIFECYCLE_STATUSES)
                .flatMap(status -> Arrays.stream(Transition.values())
                        .filter(transition -> transition.requiredStatus() != status)
                        .map(transition -> Arguments.of(status, transition)));
    }

    private static Exam newOrder() {
        return Exam.createOrder(
                PATIENT_ID,
                CREATED_BY,
                ACCESSION_NUMBER,
                REQUESTED_PROCEDURE,
                MODALITY);
    }

    private static Exam examInStatus(ExamStatus requestedStatus) {
        Exam exam = newOrder();
        if (requestedStatus == ExamStatus.ORDERED) {
            return exam;
        }

        for (Transition transition : Transition.values()) {
            transition.apply(exam);
            if (exam.getStatus() == requestedStatus) {
                return exam;
            }
        }

        throw new IllegalArgumentException("Unsupported lifecycle status: " + requestedStatus);
    }

    private enum Transition {
        SCHEDULE(ExamStatus.ORDERED, ExamStatus.SCHEDULED, Exam::markScheduled),
        ACQUIRE(ExamStatus.SCHEDULED, ExamStatus.ACQUIRED, Exam::markAcquired),
        REPORT(ExamStatus.ACQUIRED, ExamStatus.REPORTED, Exam::markReported),
        COMPLETE(ExamStatus.REPORTED, ExamStatus.COMPLETED, Exam::markCompleted);

        private final ExamStatus requiredStatus;
        private final ExamStatus targetStatus;
        private final Consumer<Exam> action;

        Transition(ExamStatus requiredStatus, ExamStatus targetStatus, Consumer<Exam> action) {
            this.requiredStatus = requiredStatus;
            this.targetStatus = targetStatus;
            this.action = action;
        }

        ExamStatus requiredStatus() {
            return requiredStatus;
        }

        ExamStatus targetStatus() {
            return targetStatus;
        }

        void apply(Exam exam) {
            action.accept(exam);
        }
    }
}
