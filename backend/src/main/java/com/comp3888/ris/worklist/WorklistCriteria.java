package com.comp3888.ris.worklist;

import java.time.LocalDate;

import com.comp3888.ris.exam.Modality;

public record WorklistCriteria(
        Modality modality,
        LocalDate scheduledDateFrom,
        LocalDate scheduledDateTo,
        String stationAeTitle) {

    public WorklistCriteria {
        if (scheduledDateFrom != null
                && scheduledDateTo != null
                && scheduledDateFrom.isAfter(scheduledDateTo)) {
            throw new InvalidWorklistCriteriaException(
                    "scheduledDateFrom must be on or before scheduledDateTo");
        }
    }

    public static WorklistCriteria unfiltered() {
        return new WorklistCriteria(null, null, null, null);
    }
}
