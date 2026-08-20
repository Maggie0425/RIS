package com.comp3888.ris.patient;

import java.time.Instant;
import java.time.LocalDate;

import io.swagger.v3.oas.annotations.media.Schema;

public record PatientResponse(
        @Schema(example = "1")
        Long id,

        @Schema(example = "SYN-000001")
        String medicalRecordNumber,

        @Schema(example = "Avery")
        String firstName,

        @Schema(example = "Taylor")
        String lastName,

        @Schema(example = "1990-04-15")
        LocalDate dateOfBirth,

        @Schema(example = "UNKNOWN")
        PatientSex sex,

        Instant createdAt,
        Instant updatedAt) {
}
