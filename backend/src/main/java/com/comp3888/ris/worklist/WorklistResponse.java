package com.comp3888.ris.worklist;

import java.time.Instant;
import java.time.LocalDate;

import com.comp3888.ris.exam.ExamStatus;
import com.comp3888.ris.exam.Modality;
import com.comp3888.ris.patient.PatientSex;

import io.swagger.v3.oas.annotations.media.Schema;

public record WorklistResponse(
        @Schema(example = "1") Long patientId,
        @Schema(example = "SYN-000001") String medicalRecordNumber,
        @Schema(example = "Avery") String patientFirstName,
        @Schema(example = "Taylor") String patientLastName,
        LocalDate patientDateOfBirth,
        PatientSex patientSex,
        @Schema(example = "7") Long examId,
        @Schema(example = "SYN-ACC-0007") String accessionNumber,
        @Schema(example = "CT chest") String requestedProcedure,
        @Schema(example = "CT") Modality modality,
        @Schema(example = "SCHEDULED") ExamStatus status,
        Instant scheduledStart,
        @Schema(example = "CT_1") String stationAeTitle) {

    static WorklistResponse from(WorklistItem item) {
        return new WorklistResponse(
                item.patientId(),
                item.medicalRecordNumber(),
                item.patientFirstName(),
                item.patientLastName(),
                item.patientDateOfBirth(),
                item.patientSex(),
                item.examId(),
                item.accessionNumber(),
                item.requestedProcedure(),
                item.modality(),
                item.status(),
                item.scheduledStart(),
                item.stationAeTitle());
    }
}
