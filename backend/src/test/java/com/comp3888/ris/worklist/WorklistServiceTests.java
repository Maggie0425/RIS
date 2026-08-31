package com.comp3888.ris.worklist;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.assertj.core.api.Assertions.assertThatNullPointerException;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.lang.reflect.RecordComponent;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.comp3888.ris.exam.ExamStatus;
import com.comp3888.ris.exam.Modality;
import com.comp3888.ris.patient.PatientSex;

class WorklistServiceTests {

    private final WorklistQueryRepository repository = mock(WorklistQueryRepository.class);
    private final WorklistService service = new WorklistService(repository);

    @Test
    void unfilteredCriteriaUseOpenTimestampBounds() {
        when(repository.findEligibleWorklistItems(null, null, null, null))
                .thenReturn(List.of());

        assertThat(service.getWorklist(WorklistCriteria.unfiltered())).isEmpty();

        verify(repository).findEligibleWorklistItems(null, null, null, null);
    }

    @Test
    void inclusiveSydneyDatesBecomeHalfOpenTimestampBounds() {
        WorklistCriteria criteria = new WorklistCriteria(
                Modality.CT,
                LocalDate.of(2026, 8, 30),
                LocalDate.of(2026, 8, 31),
                "CT_1");

        service.getWorklist(criteria);

        verify(repository).findEligibleWorklistItems(
                Modality.CT,
                Instant.parse("2026-08-29T14:00:00Z"),
                Instant.parse("2026-08-31T14:00:00Z"),
                "CT_1");
    }

    @Test
    void daylightSavingStartProducesA23HourCalendarDay() {
        LocalDate daylightSavingStart = LocalDate.of(2026, 10, 4);

        service.getWorklist(new WorklistCriteria(
                null,
                daylightSavingStart,
                daylightSavingStart,
                null));

        verify(repository).findEligibleWorklistItems(
                null,
                Instant.parse("2026-10-03T14:00:00Z"),
                Instant.parse("2026-10-04T13:00:00Z"),
                null);
    }

    @Test
    void rejectsReversedDateRangeBeforeRepositoryAccess() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new WorklistCriteria(
                        null,
                        LocalDate.of(2026, 9, 1),
                        LocalDate.of(2026, 8, 31),
                        null))
                .withMessage("scheduledDateFrom must be on or before scheduledDateTo");

        verifyNoInteractions(repository);
    }

    @Test
    void rejectsNullCriteriaBeforeRepositoryAccess() {
        assertThatNullPointerException()
                .isThrownBy(() -> service.getWorklist(null))
                .withMessage("criteria must not be null");

        verifyNoInteractions(repository);
    }

    @Test
    void returnsRepositoryItemsWithoutAdapterSpecificMapping() {
        WorklistCriteria criteria = WorklistCriteria.unfiltered();
        WorklistItem item = worklistItem();
        when(repository.findEligibleWorklistItems(null, null, null, null))
                .thenReturn(List.of(item));

        List<WorklistItem> result = service.getWorklist(criteria);

        assertThat(result).containsExactlyElementsOf(List.of(item));
        assertThat(result.getFirst()).isSameAs(item);
    }

    @Test
    void resultTypeContainsOnlyJavaAndCoreRisTypes() {
        List<Class<?>> componentTypes = Arrays.stream(WorklistItem.class.getRecordComponents())
                .map(RecordComponent::getType)
                .toList();

        assertThat(componentTypes)
                .allMatch(type -> type.getPackageName().startsWith("java.")
                        || type.getPackageName().startsWith("com.comp3888.ris."))
                .noneMatch(type -> type.getPackageName().toLowerCase().contains("dicom")
                        || type.getPackageName().toLowerCase().contains("dcm4che"));
    }

    private static WorklistItem worklistItem() {
        return new WorklistItem(
                101L,
                "SYN-WL-001",
                "Avery",
                "Taylor",
                LocalDate.of(1990, 4, 15),
                PatientSex.UNKNOWN,
                201L,
                "SYN-WL-ACC-001",
                "CT chest",
                Modality.CT,
                ExamStatus.SCHEDULED,
                Instant.parse("2026-08-30T00:00:00Z"),
                "CT_1");
    }
}
