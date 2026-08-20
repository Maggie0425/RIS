package com.comp3888.ris.scheduling;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

interface ExamScheduleRepository extends JpaRepository<ExamSchedule, Long> {

    Optional<ExamSchedule> findByExamId(Long examId);
}

