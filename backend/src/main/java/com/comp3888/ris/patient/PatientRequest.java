package com.comp3888.ris.patient;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;

public record PatientRequest(
        @Schema(example = "SYN-000005")
        @NotBlank @Size(max = 50) String medicalRecordNumber,

        @Schema(example = "Avery")
        @NotBlank @Size(max = 100) String firstName,

        @Schema(example = "Taylor")
        @NotBlank @Size(max = 100) String lastName,

        @Schema(example = "1990-04-15")
        @NotNull @PastOrPresent LocalDate dateOfBirth,

        @Schema(example = "UNKNOWN")
        @NotNull PatientSex sex) {
}
