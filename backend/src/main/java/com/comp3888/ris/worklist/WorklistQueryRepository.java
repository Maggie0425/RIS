package com.comp3888.ris.worklist;

import java.time.Instant;
import java.util.List;

import com.comp3888.ris.exam.Modality;

public interface WorklistQueryRepository {

    List<WorklistItem> findEligibleWorklistItems(
            Modality modality,
            Instant scheduledStartFromInclusive,
            Instant scheduledStartToExclusive,
            String stationAeTitle);
}
