package com.comp3888.ris.exam;

public class ExamNotFoundException extends RuntimeException {

    ExamNotFoundException(Long id) {
        super("Exam " + id + " was not found.");
    }
}
