package com.comp3888.ris.exam;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.comp3888.ris.patient.PatientService;

class ExamServiceTests {

    private final ExamRepository repository = mock(ExamRepository.class);
    private final PatientService patients = mock(PatientService.class);
    private final ExamService service = new ExamService(repository, patients);

    @Test
    void listsAllExamsWhenNoStatusIsProvided() {
        Exam ordered = Exam.createOrder(1L, 2L, "ACC-1", "CT chest", Modality.CT);
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(ordered));

        List<ExamResponse> responses = service.getExams(null);

        assertThat(responses).singleElement().satisfies(response -> {
            assertThat(response.accessionNumber()).isEqualTo("ACC-1");
            assertThat(response.status()).isEqualTo(ExamStatus.ORDERED);
        });
        verify(repository).findAllByOrderByCreatedAtDesc();
    }

    @Test
    void filtersExamsByStatus() {
        Exam scheduled = Exam.createOrder(1L, 2L, "ACC-2", "MRI brain", Modality.MR);
        scheduled.markScheduled();
        when(repository.findByStatusOrderByCreatedAtDesc(ExamStatus.SCHEDULED))
                .thenReturn(List.of(scheduled));

        List<ExamResponse> responses = service.getExams(ExamStatus.SCHEDULED);

        assertThat(responses).singleElement()
                .extracting(ExamResponse::status)
                .isEqualTo(ExamStatus.SCHEDULED);
        verify(repository).findByStatusOrderByCreatedAtDesc(ExamStatus.SCHEDULED);
    }
}
