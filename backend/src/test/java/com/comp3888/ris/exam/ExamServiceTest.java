package com.comp3888.ris.exam;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.comp3888.ris.patient.PatientService;

@ExtendWith(MockitoExtension.class)
class ExamServiceTest {

    @Mock
    private ExamRepository exams;

    @Mock
    private PatientService patients;

    private ExamService service;

    @BeforeEach
    void setUp() {
        service = new ExamService(exams, patients);
    }

    @Test
    void createExamValidatesPatientAndBuildsOrderedExam() {
        when(exams.nextAccessionNumberValue()).thenReturn(7L);
        when(exams.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ExamResponse response = service.createExam(new ExamRequest(1L, "  CT abdomen  ", Modality.CT), 2L);

        verify(patients).getPatient(1L);
        assertThat(response.patientId()).isEqualTo(1L);
        assertThat(response.createdBy()).isEqualTo(2L);
        assertThat(response.accessionNumber()).isEqualTo("SYN-ACC-0007");
        assertThat(response.requestedProcedure()).isEqualTo("CT abdomen");
        assertThat(response.modality()).isEqualTo(Modality.CT);
        assertThat(response.status()).isEqualTo(ExamStatus.ORDERED);
        assertThat(response.createdAt()).isNotNull();
        assertThat(response.updatedAt()).isEqualTo(response.createdAt());
    }

    @Test
    void createExamUsesTheNextDatabaseSequenceValue() {
        when(exams.nextAccessionNumberValue()).thenReturn(8L);
        when(exams.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ExamResponse response = service.createExam(new ExamRequest(1L, "Chest X-ray", Modality.DX), 2L);

        assertThat(response.accessionNumber()).isEqualTo("SYN-ACC-0008");
    }

    @Test
    void getExamThrowsWhenExamDoesNotExist() {
        when(exams.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getExam(99L))
                .isInstanceOf(ExamNotFoundException.class)
                .hasMessage("Exam 99 was not found.");
    }

    @Test
    void getExamsUsesCombinedPatientAndStatusFilter() {
        Exam record = exam(1L, "SYN-ACC-0001", ExamStatus.ORDERED);
        when(exams.findByPatientIdAndStatusOrderByCreatedAtDesc(1L, ExamStatus.ORDERED))
                .thenReturn(List.of(record));

        List<ExamResponse> responses = service.getExams(1L, ExamStatus.ORDERED);

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().accessionNumber()).isEqualTo("SYN-ACC-0001");
        verify(exams).findByPatientIdAndStatusOrderByCreatedAtDesc(1L, ExamStatus.ORDERED);
    }

    @Test
    void getExamsUsesEachSupportedFilterCombination() {
        when(exams.findByPatientIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());
        when(exams.findByStatusOrderByCreatedAtDesc(ExamStatus.COMPLETED)).thenReturn(List.of());
        when(exams.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());

        service.getExams(1L, null);
        service.getExams(null, ExamStatus.COMPLETED);
        service.getExams(null, null);

        verify(exams).findByPatientIdOrderByCreatedAtDesc(1L);
        verify(exams).findByStatusOrderByCreatedAtDesc(ExamStatus.COMPLETED);
        verify(exams).findAllByOrderByCreatedAtDesc();
    }

    private Exam exam(Long patientId, String accessionNumber, ExamStatus status) {
        Exam exam = Exam.createOrder(patientId, 2L, accessionNumber, "CT abdomen", Modality.CT);
        if (status != ExamStatus.ORDERED) {
            throw new IllegalArgumentException("Test helper only creates ordered exams.");
        }
        return exam;
    }
}
