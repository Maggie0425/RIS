package com.comp3888.ris.patient;

import java.time.Instant;
import java.time.LocalDate;

public record PatientResponse(
        Long id,
        String medicalRecordNumber,
        String firstName,
        String lastName,
        LocalDate dateOfBirth,
        PatientSex sex,
        Instant createdAt,
        Instant updatedAt) {
}
