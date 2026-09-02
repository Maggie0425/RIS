package com.comp3888.ris.scheduling;

public final class ExamScheduleStateException extends RuntimeException {

    private ExamScheduleStateException(String message) {
        super(message);
    }

    static ExamScheduleStateException alreadyExists(Long examId) {
        return new ExamScheduleStateException(
                "Exam " + examId + " already has an active schedule.");
    }

    static ExamScheduleStateException missing(Long examId) {
        return new ExamScheduleStateException(
                "Exam " + examId + " is SCHEDULED but has no active schedule.");
    }
}
