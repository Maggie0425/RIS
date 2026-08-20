package com.comp3888.ris.reporting;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

interface ReportRepository extends JpaRepository<Report, Long> {

    Optional<Report> findByExamId(Long examId);
}

