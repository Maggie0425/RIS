package com.comp3888.ris.exam;

public record ExamStatusSummary(
        long totalExams,
        long ordered,
        long scheduled,
        long acquired,
        long reported,
        long completed,
        long cancelled) {
}
