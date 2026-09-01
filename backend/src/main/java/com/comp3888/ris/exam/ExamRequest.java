package com.comp3888.ris.exam;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ExamRequest(
        @Schema(example = "1")
        @NotNull @Positive Long patientId,

        @Schema(example = "CT abdomen")
        @NotBlank @Size(max = 200) String requestedProcedure,

        @Schema(example = "CT")
        @NotNull Modality modality) {
}
