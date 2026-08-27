package com.comp3888.ris.exam;

import java.time.Instant;

public record ExamResponse(
        Long id,
        Long patientId,
        Long createdBy,
        String accessionNumber,
        String requestedProcedure,
        Modality modality,
        ExamStatus status,
        Instant createdAt,
        Instant updatedAt) {

    static ExamResponse from(Exam exam) {
        return new ExamResponse(
                exam.getId(),
                exam.getPatientId(),
                exam.getCreatedBy(),
                exam.getAccessionNumber(),
                exam.getRequestedProcedure(),
                exam.getModality(),
                exam.getStatus(),
                exam.getCreatedAt(),
                exam.getUpdatedAt());
    }
}
