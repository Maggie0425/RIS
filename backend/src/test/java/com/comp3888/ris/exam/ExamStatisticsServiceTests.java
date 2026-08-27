package com.comp3888.ris.exam;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ExamStatisticsServiceTests {

    private ExamRepository repository;
    private ExamStatisticsService service;

    @BeforeEach
    void setUp() {
        repository = mock(ExamRepository.class);
        service = new ExamStatisticsService(repository);
    }

    @Test
    void returnsTotalAndEveryLifecycleStatusCount() {
        when(repository.countGroupedByStatus()).thenReturn(List.of(
                new ExamStatusCount(ExamStatus.ORDERED, 2),
                new ExamStatusCount(ExamStatus.SCHEDULED, 3),
                new ExamStatusCount(ExamStatus.ACQUIRED, 4),
                new ExamStatusCount(ExamStatus.REPORTED, 5),
                new ExamStatusCount(ExamStatus.COMPLETED, 6),
                new ExamStatusCount(ExamStatus.CANCELLED, 1)));

        ExamStatusSummary summary = service.getStatusSummary();

        assertThat(summary).isEqualTo(new ExamStatusSummary(21, 2, 3, 4, 5, 6, 1));
        verify(repository).countGroupedByStatus();
        verifyNoMoreInteractions(repository);
    }

    @Test
    void returnsZerosWhenThereAreNoExams() {
        when(repository.countGroupedByStatus()).thenReturn(List.of());

        ExamStatusSummary summary = service.getStatusSummary();

        assertThat(summary).isEqualTo(new ExamStatusSummary(0, 0, 0, 0, 0, 0, 0));
    }

    @Test
    void fillsInZeroForStatusesMissingFromTheGroupedQuery() {
        when(repository.countGroupedByStatus()).thenReturn(List.of(
                new ExamStatusCount(ExamStatus.ORDERED, 2),
                new ExamStatusCount(ExamStatus.COMPLETED, 3)));

        ExamStatusSummary summary = service.getStatusSummary();

        assertThat(summary).isEqualTo(new ExamStatusSummary(5, 2, 0, 0, 0, 3, 0));
    }
}
