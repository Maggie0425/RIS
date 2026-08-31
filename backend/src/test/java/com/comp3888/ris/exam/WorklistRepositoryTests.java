package com.comp3888.ris.exam;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import com.comp3888.ris.patient.PatientSex;
import com.comp3888.ris.worklist.WorklistCriteria;
import com.comp3888.ris.worklist.WorklistItem;
import com.comp3888.ris.worklist.WorklistQueryRepository;
import com.comp3888.ris.worklist.WorklistService;

@SpringBootTest
@Transactional
class WorklistRepositoryTests {

    @Autowired
    private WorklistQueryRepository repository;

    @Autowired
    private WorklistService service;

    @Autowired
    private JdbcTemplate jdbc;

    private Long patientId;
    private Long createdBy;
    private int sequence;

    @BeforeEach
    void setUp() {
        patientId = jdbc.queryForObject("""
                insert into patients (
                    medical_record_number, first_name, last_name, date_of_birth, sex
                ) values (?, ?, ?, ?, ?)
                returning id
                """, Long.class,
                "SYN-WL-TEST", "Avery", "Taylor", LocalDate.of(1990, 4, 15), "UNKNOWN");
        createdBy = jdbc.queryForObject(
                "select id from users where username = 'receptionist'",
                Long.class);
    }

    @Test
    void unfilteredQueryReturnsEveryEligibleExamInScheduleOrderWithProjectedFields() {
        Long laterExamId = createScheduledExam(
                ExamStatus.SCHEDULED,
                Modality.CT,
                Instant.parse("2030-01-02T01:00:00Z"),
                "WL_ALL");
        Long earlierExamId = createScheduledExam(
                ExamStatus.SCHEDULED,
                Modality.MR,
                Instant.parse("2030-01-01T01:00:00Z"),
                "WL_ALL");
        createScheduledExam(
                ExamStatus.ACQUIRED,
                Modality.DX,
                Instant.parse("2030-01-01T00:00:00Z"),
                "WL_ALL");

        List<Long> expectedIds = jdbc.queryForList("""
                select exams.id
                from exams
                join exam_schedules on exam_schedules.exam_id = exams.id
                where exams.status = 'SCHEDULED'
                order by exam_schedules.scheduled_start asc, exams.id asc
                """, Long.class);

        List<WorklistItem> result = repository.findEligibleWorklistItems(
                null, null, null, null);

        assertThat(result).extracting(WorklistItem::examId).containsExactlyElementsOf(expectedIds);
        assertThat(result).filteredOn(item -> item.examId().equals(earlierExamId))
                .singleElement()
                .satisfies(item -> {
                    assertThat(item.patientId()).isEqualTo(patientId);
                    assertThat(item.medicalRecordNumber()).isEqualTo("SYN-WL-TEST");
                    assertThat(item.patientFirstName()).isEqualTo("Avery");
                    assertThat(item.patientLastName()).isEqualTo("Taylor");
                    assertThat(item.patientDateOfBirth()).isEqualTo(LocalDate.of(1990, 4, 15));
                    assertThat(item.patientSex()).isEqualTo(PatientSex.UNKNOWN);
                    assertThat(item.accessionNumber()).startsWith("SYN-WL-ACC-");
                    assertThat(item.requestedProcedure()).isEqualTo("Synthetic procedure");
                    assertThat(item.modality()).isEqualTo(Modality.MR);
                    assertThat(item.status()).isEqualTo(ExamStatus.SCHEDULED);
                    assertThat(item.scheduledStart())
                            .isEqualTo(Instant.parse("2030-01-01T01:00:00Z"));
                    assertThat(item.stationAeTitle()).isEqualTo("WL_ALL");
                });
        assertThat(result).filteredOn(item -> item.stationAeTitle().equals("WL_ALL"))
                .extracting(WorklistItem::examId)
                .containsExactly(earlierExamId, laterExamId);
    }

    @Test
    void filtersByModality() {
        Long ctExamId = createScheduledExam(
                ExamStatus.SCHEDULED,
                Modality.CT,
                Instant.parse("2030-02-01T00:00:00Z"),
                "WL_MODALITY");
        createScheduledExam(
                ExamStatus.SCHEDULED,
                Modality.MR,
                Instant.parse("2030-02-01T01:00:00Z"),
                "WL_MODALITY");

        List<WorklistItem> result = repository.findEligibleWorklistItems(
                Modality.CT, null, null, "WL_MODALITY");

        assertThat(result).extracting(WorklistItem::examId).containsExactly(ctExamId);
    }

    @Test
    void filtersByInclusiveStartTimestamp() {
        Instant fromInclusive = Instant.parse("2030-03-01T00:00:00Z");
        createScheduledExam(
                ExamStatus.SCHEDULED,
                Modality.CT,
                fromInclusive.minusSeconds(1),
                "WL_FROM");
        Long atBoundaryId = createScheduledExam(
                ExamStatus.SCHEDULED,
                Modality.CT,
                fromInclusive,
                "WL_FROM");
        Long afterBoundaryId = createScheduledExam(
                ExamStatus.SCHEDULED,
                Modality.CT,
                fromInclusive.plusSeconds(1),
                "WL_FROM");

        List<WorklistItem> result = repository.findEligibleWorklistItems(
                null, fromInclusive, null, "WL_FROM");

        assertThat(result).extracting(WorklistItem::examId)
                .containsExactly(atBoundaryId, afterBoundaryId);
    }

    @Test
    void filtersByExclusiveEndTimestamp() {
        Instant toExclusive = Instant.parse("2030-04-01T00:00:00Z");
        Long beforeBoundaryId = createScheduledExam(
                ExamStatus.SCHEDULED,
                Modality.CT,
                toExclusive.minusSeconds(1),
                "WL_TO");
        createScheduledExam(
                ExamStatus.SCHEDULED,
                Modality.CT,
                toExclusive,
                "WL_TO");

        List<WorklistItem> result = repository.findEligibleWorklistItems(
                null, null, toExclusive, "WL_TO");

        assertThat(result).extracting(WorklistItem::examId).containsExactly(beforeBoundaryId);
    }

    @Test
    void filtersByExactCaseSensitiveStationAeTitle() {
        Long exactStationId = createScheduledExam(
                ExamStatus.SCHEDULED,
                Modality.US,
                Instant.parse("2030-05-01T00:00:00Z"),
                "WL_STATION");
        createScheduledExam(
                ExamStatus.SCHEDULED,
                Modality.US,
                Instant.parse("2030-05-01T01:00:00Z"),
                "WL_OTHER");

        List<WorklistItem> result = repository.findEligibleWorklistItems(
                null, null, null, "WL_STATION");

        assertThat(result).extracting(WorklistItem::examId).containsExactly(exactStationId);
        assertThat(repository.findEligibleWorklistItems(
                null, null, null, "wl_station")).isEmpty();
    }

    @Test
    void combinesAllSuppliedFiltersWithAndMatching() {
        Instant from = Instant.parse("2030-06-01T00:00:00Z");
        Instant to = Instant.parse("2030-06-02T00:00:00Z");
        Long matchingId = createScheduledExam(
                ExamStatus.SCHEDULED, Modality.CT, from, "WL_COMBINED");
        createScheduledExam(
                ExamStatus.SCHEDULED, Modality.MR, from, "WL_COMBINED");
        createScheduledExam(
                ExamStatus.SCHEDULED, Modality.CT, from.minusSeconds(1), "WL_COMBINED");
        createScheduledExam(
                ExamStatus.SCHEDULED, Modality.CT, from, "WL_COMB_ALT");

        List<WorklistItem> result = repository.findEligibleWorklistItems(
                Modality.CT, from, to, "WL_COMBINED");

        assertThat(result).extracting(WorklistItem::examId).containsExactly(matchingId);
    }

    @ParameterizedTest
    @EnumSource(value = ExamStatus.class, names = {
            "ORDERED", "ACQUIRED", "REPORTED", "COMPLETED", "CANCELLED"
    })
    void excludesEveryIneligibleLifecycleState(ExamStatus ineligibleStatus) {
        Long eligibleId = createScheduledExam(
                ExamStatus.SCHEDULED,
                Modality.DX,
                Instant.parse("2030-07-01T00:00:00Z"),
                "WL_STATUS");
        createScheduledExam(
                ineligibleStatus,
                Modality.DX,
                Instant.parse("2030-07-01T01:00:00Z"),
                "WL_STATUS");

        List<WorklistItem> result = repository.findEligibleWorklistItems(
                null, null, null, "WL_STATUS");

        assertThat(result).extracting(WorklistItem::examId).containsExactly(eligibleId);
    }

    @Test
    void rescheduledValuesChangeSubsequentServiceResults() {
        Long examId = createScheduledExam(
                ExamStatus.SCHEDULED,
                Modality.MR,
                Instant.parse("2031-03-10T23:00:00Z"),
                "WL_OLD");
        WorklistCriteria updatedCriteria = new WorklistCriteria(
                Modality.MR,
                LocalDate.of(2031, 3, 10),
                LocalDate.of(2031, 3, 10),
                "WL_NEW");

        assertThat(service.getWorklist(updatedCriteria)).isEmpty();

        jdbc.update("""
                update exam_schedules
                set scheduled_start = ?, station_ae_title = ?, updated_at = current_timestamp
                where exam_id = ?
                """,
                Timestamp.from(Instant.parse("2031-03-09T23:00:00Z")),
                "WL_NEW",
                examId);

        assertThat(service.getWorklist(updatedCriteria))
                .singleElement()
                .satisfies(item -> {
                    assertThat(item.examId()).isEqualTo(examId);
                    assertThat(item.scheduledStart())
                            .isEqualTo(Instant.parse("2031-03-09T23:00:00Z"));
                    assertThat(item.stationAeTitle()).isEqualTo("WL_NEW");
                });
    }

    private Long createScheduledExam(
            ExamStatus status,
            Modality modality,
            Instant scheduledStart,
            String stationAeTitle) {
        sequence++;
        String accessionNumber = "SYN-WL-ACC-" + sequence;
        Long examId = jdbc.queryForObject("""
                insert into exams (
                    patient_id,
                    created_by,
                    accession_number,
                    requested_procedure,
                    modality,
                    status
                ) values (?, ?, ?, ?, ?, ?)
                returning id
                """, Long.class,
                patientId,
                createdBy,
                accessionNumber,
                "Synthetic procedure",
                modality.name(),
                status.name());
        jdbc.update("""
                insert into exam_schedules (exam_id, scheduled_start, station_ae_title)
                values (?, ?, ?)
                """,
                examId,
                Timestamp.from(scheduledStart),
                stationAeTitle);
        return examId;
    }
}
