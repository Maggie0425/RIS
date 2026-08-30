package com.comp3888.ris.exam;

import java.time.Instant;

import io.swagger.v3.oas.annotations.media.Schema;

public record ExamResponse(
        @Schema(example = "1") Long id,
        @Schema(example = "1") Long patientId,
        @Schema(example = "2") Long createdBy,
        @Schema(example = "SYN-ACC-0007") String accessionNumber,
        @Schema(example = "CT abdomen") String requestedProcedure,
        @Schema(example = "CT") Modality modality,
        @Schema(example = "ORDERED") ExamStatus status,
        Instant createdAt,
        Instant updatedAt) {

    static ExamResponse from(Exam exam) {
        return new ExamResponse(
                exam.getId(), exam.getPatientId(), exam.getCreatedBy(), exam.getAccessionNumber(),
                exam.getRequestedProcedure(), exam.getModality(), exam.getStatus(),
                exam.getCreatedAt(), exam.getUpdatedAt());
    }
}
