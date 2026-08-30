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

    static Exam createOrder(Long patientId, Long createdBy, String accessionNumber,
            String requestedProcedure, Modality modality) {
        Exam exam = new Exam();
        exam.patientId = patientId;
        exam.createdBy = createdBy;
        exam.accessionNumber = accessionNumber;
        exam.requestedProcedure = requestedProcedure.trim();
        exam.modality = modality;
        exam.status = ExamStatus.ORDERED;

        Instant now = Instant.now();
        exam.createdAt = now;
        exam.updatedAt = now;
        return exam;
    }

    void markScheduled() {
        transitionFrom(ExamStatus.ORDERED, ExamStatus.SCHEDULED);
    }

    void markAcquired() {
        transitionFrom(ExamStatus.SCHEDULED, ExamStatus.ACQUIRED);
    }

    void markReported() {
        transitionFrom(ExamStatus.ACQUIRED, ExamStatus.REPORTED);
    }

    void markCompleted() {
        transitionFrom(ExamStatus.REPORTED, ExamStatus.COMPLETED);
    }

    private void transitionFrom(ExamStatus expectedStatus, ExamStatus targetStatus) {
        if (status != expectedStatus) {
            throw new InvalidExamTransitionException(status, targetStatus);
        }

        Instant transitionedAt = nextUpdatedAt();
        status = targetStatus;
        updatedAt = transitionedAt;
    }

    private Instant nextUpdatedAt() {
        Instant now = Instant.now();
        return now.isAfter(updatedAt) ? now : updatedAt.plusNanos(1);
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
