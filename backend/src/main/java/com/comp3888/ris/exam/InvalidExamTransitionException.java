package com.comp3888.ris.exam;

public final class InvalidExamTransitionException extends RuntimeException {

    InvalidExamTransitionException(ExamStatus currentStatus, ExamStatus targetStatus) {
        super("Cannot transition exam from " + currentStatus + " to " + targetStatus + ".");
    }
}
