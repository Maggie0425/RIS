package com.comp3888.ris.patient;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

public record PatientRequest(
        @NotBlank @Size(max = 50) String medicalRecordNumber,
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotNull @PastOrPresent LocalDate dateOfBirth,
        @NotNull PatientSex sex) {
}
