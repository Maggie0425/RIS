package com.comp3888.ris.exam;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.comp3888.ris.worklist.WorklistItem;

interface ExamRepository extends JpaRepository<Exam, Long> {
    Optional<Exam> findByAccessionNumber(String accessionNumber);
    @Query(value = "select nextval('exam_accession_number_seq')", nativeQuery = true)
    long nextAccessionNumberValue();
    List<Exam> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<Exam> findByStatusOrderByCreatedAtDesc(ExamStatus status);
    List<Exam> findByPatientIdAndStatusOrderByCreatedAtDesc(Long patientId, ExamStatus status);
    List<Exam> findAllByOrderByCreatedAtDesc();
    @Query("""
            select new com.comp3888.ris.exam.ExamStatusCount(exam.status, count(exam))
            from Exam exam
            group by exam.status
            """)
    List<ExamStatusCount> countGroupedByStatus();
    @Query("""
            select new com.comp3888.ris.worklist.WorklistItem(
                patient.id,
                patient.medicalRecordNumber,
                patient.firstName,
                patient.lastName,
                patient.dateOfBirth,
                patient.sex,
                exam.id,
                exam.accessionNumber,
                exam.requestedProcedure,
                exam.modality,
                exam.status,
                schedule.scheduledStart,
                schedule.stationAeTitle
            )
            from Exam exam
            join ExamSchedule schedule on schedule.examId = exam.id
            join Patient patient on patient.id = exam.patientId
            where exam.status = :eligibleStatus
              and (:filterByModality = false or exam.modality = :modality)
              and (:filterByScheduledStartFrom = false
                   or schedule.scheduledStart >= :scheduledStartFromInclusive)
              and (:filterByScheduledStartTo = false
                   or schedule.scheduledStart < :scheduledStartToExclusive)
              and (:filterByStationAeTitle = false
                   or schedule.stationAeTitle = :stationAeTitle)
            order by schedule.scheduledStart asc, exam.id asc
            """)
    List<WorklistItem> findWorklistItems(
            @Param("eligibleStatus") ExamStatus eligibleStatus,
            @Param("filterByModality") boolean filterByModality,
            @Param("modality") Modality modality,
            @Param("filterByScheduledStartFrom") boolean filterByScheduledStartFrom,
            @Param("scheduledStartFromInclusive") Instant scheduledStartFromInclusive,
            @Param("filterByScheduledStartTo") boolean filterByScheduledStartTo,
            @Param("scheduledStartToExclusive") Instant scheduledStartToExclusive,
            @Param("filterByStationAeTitle") boolean filterByStationAeTitle,
            @Param("stationAeTitle") String stationAeTitle);
}
