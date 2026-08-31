package com.comp3888.ris.exam;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Repository;

import com.comp3888.ris.worklist.WorklistItem;
import com.comp3888.ris.worklist.WorklistQueryRepository;

@Repository
class ExamWorklistQueryAdapter implements WorklistQueryRepository {

    private final ExamRepository repository;

    ExamWorklistQueryAdapter(ExamRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<WorklistItem> findEligibleWorklistItems(
            Modality modality,
            Instant scheduledStartFromInclusive,
            Instant scheduledStartToExclusive,
            String stationAeTitle) {
        return repository.findWorklistItems(
                ExamStatus.SCHEDULED,
                modality != null,
                modality,
                scheduledStartFromInclusive != null,
                scheduledStartFromInclusive,
                scheduledStartToExclusive != null,
                scheduledStartToExclusive,
                stationAeTitle != null,
                stationAeTitle);
    }
}
