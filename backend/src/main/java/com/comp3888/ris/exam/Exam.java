package com.comp3888.ris.exam;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "exams")
class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "accession_number", nullable = false, unique = true, length = 50)
    private String accessionNumber;

    @Column(name = "requested_procedure", nullable = false, length = 200)
    private String requestedProcedure;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Modality modality;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ExamStatus status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Exam() {
    }

    Long getId() {
        return id;
    }

    Long getPatientId() {
        return patientId;
    }

    Long getCreatedBy() {
        return createdBy;
    }

    String getAccessionNumber() {
        return accessionNumber;
    }

    String getRequestedProcedure() {
        return requestedProcedure;
    }

    Modality getModality() {
        return modality;
    }

    ExamStatus getStatus() {
        return status;
    }

    Instant getCreatedAt() {
        return createdAt;
    }

    Instant getUpdatedAt() {
        return updatedAt;
    }
}

