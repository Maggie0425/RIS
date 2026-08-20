package com.comp3888.ris.reporting;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "reports")
class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "exam_id", nullable = false, unique = true)
    private Long examId;

    @Column(name = "author_user_id", nullable = false)
    private Long authorUserId;

    @Column(name = "report_text", nullable = false, columnDefinition = "TEXT")
    private String reportText;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    protected Report() {
    }

    Long getId() {
        return id;
    }

    Long getExamId() {
        return examId;
    }

    Long getAuthorUserId() {
        return authorUserId;
    }

    String getReportText() {
        return reportText;
    }

    Instant getSubmittedAt() {
        return submittedAt;
    }
}
