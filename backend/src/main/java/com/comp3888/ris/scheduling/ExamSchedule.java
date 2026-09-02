package com.comp3888.ris.scheduling;

import java.time.Instant;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "exam_schedules")
class ExamSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "exam_id", nullable = false, unique = true)
    private Long examId;

    @Column(name = "scheduled_start", nullable = false)
    private Instant scheduledStart;

    @Column(name = "station_ae_title", nullable = false, length = 16)
    private String stationAeTitle;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ExamSchedule() {
    }

    static ExamSchedule create(Long examId, Instant scheduledStart, String stationAeTitle) {
        ExamSchedule schedule = new ExamSchedule();
        schedule.examId = Objects.requireNonNull(examId, "examId is required");
        schedule.scheduledStart = Objects.requireNonNull(scheduledStart, "scheduledStart is required");
        schedule.stationAeTitle = validateStationAeTitle(stationAeTitle);

        Instant now = Instant.now();
        schedule.createdAt = now;
        schedule.updatedAt = now;
        return schedule;
    }

    void reschedule(Instant scheduledStart, String stationAeTitle) {
        Instant newScheduledStart = Objects.requireNonNull(scheduledStart, "scheduledStart is required");
        String newStationAeTitle = validateStationAeTitle(stationAeTitle);
        this.scheduledStart = newScheduledStart;
        this.stationAeTitle = newStationAeTitle;
        this.updatedAt = nextUpdatedAt();
    }

    private static String validateStationAeTitle(String stationAeTitle) {
        String trimmed = Objects.requireNonNull(stationAeTitle, "stationAeTitle is required").trim();
        if (trimmed.isBlank()) {
            throw new IllegalArgumentException("stationAeTitle must not be blank");
        }
        if (trimmed.length() > 16) {
            throw new IllegalArgumentException("stationAeTitle must be 16 characters or fewer");
        }
        return trimmed;
    }

    private Instant nextUpdatedAt() {
        Instant now = Instant.now();
        return now.isAfter(updatedAt) ? now : updatedAt.plusNanos(1);
    }

    Long getId() {
        return id;
    }

    Long getExamId() {
        return examId;
    }

    Instant getScheduledStart() {
        return scheduledStart;
    }

    String getStationAeTitle() {
        return stationAeTitle;
    }

    Instant getCreatedAt() {
        return createdAt;
    }

    Instant getUpdatedAt() {
        return updatedAt;
    }
}
