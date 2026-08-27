package com.comp3888.ris.exam;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface ExamRepository extends JpaRepository<Exam, Long> {

    Optional<Exam> findByAccessionNumber(String accessionNumber);

    List<Exam> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<Exam> findByStatus(ExamStatus status);

    List<Exam> findAllByOrderByCreatedAtDesc();

    List<Exam> findByStatusOrderByCreatedAtDesc(ExamStatus status);

    @Query("""
            select new com.comp3888.ris.exam.ExamStatusCount(exam.status, count(exam))
            from Exam exam
            group by exam.status
            """)
    List<ExamStatusCount> countGroupedByStatus();
}

