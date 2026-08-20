package com.comp3888.ris.exam;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

interface ExamRepository extends JpaRepository<Exam, Long> {

    Optional<Exam> findByAccessionNumber(String accessionNumber);

    List<Exam> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<Exam> findByStatus(ExamStatus status);
}

