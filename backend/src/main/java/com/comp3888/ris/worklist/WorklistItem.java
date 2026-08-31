package com.comp3888.ris.worklist;

import java.time.Instant;
import java.time.LocalDate;

import com.comp3888.ris.exam.ExamStatus;
import com.comp3888.ris.exam.Modality;
import com.comp3888.ris.patient.PatientSex;

public record WorklistItem(
        Long patientId,
        String medicalRecordNumber,
        String patientFirstName,
        String patientLastName,
        LocalDate patientDateOfBirth,
        PatientSex patientSex,
        Long examId,
        String accessionNumber,
        String requestedProcedure,
        Modality modality,
        ExamStatus status,
        Instant scheduledStart,
        String stationAeTitle) {
}
