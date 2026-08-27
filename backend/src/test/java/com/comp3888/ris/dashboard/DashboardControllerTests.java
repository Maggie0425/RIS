package com.comp3888.ris.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.comp3888.ris.exam.ExamStatisticsService;
import com.comp3888.ris.exam.ExamStatusSummary;

import org.junit.jupiter.api.Test;

class DashboardControllerTests {

    @Test
    void returnsTheExamStatusSummaryResponse() {
        ExamStatisticsService service = mock(ExamStatisticsService.class);
        ExamStatusSummary summary = new ExamStatusSummary(15, 1, 2, 3, 4, 5, 0);
        when(service.getStatusSummary()).thenReturn(summary);
        DashboardController controller = new DashboardController(service);

        DashboardSummaryResponse response = controller.getSummary();

        assertThat(response).isEqualTo(
                new DashboardSummaryResponse(15, 1, 2, 3, 4, 5, 0));
        verify(service).getStatusSummary();
    }
}
