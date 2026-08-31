package com.comp3888.ris.worklist;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorklistService {

    static final ZoneId BUSINESS_ZONE = ZoneId.of("Australia/Sydney");

    private final WorklistQueryRepository repository;

    WorklistService(WorklistQueryRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<WorklistItem> getWorklist(WorklistCriteria criteria) {
        Objects.requireNonNull(criteria, "criteria must not be null");

        return repository.findEligibleWorklistItems(
                criteria.modality(),
                startOfDay(criteria.scheduledDateFrom()),
                startOfFollowingDay(criteria.scheduledDateTo()),
                criteria.stationAeTitle());
    }

    private static Instant startOfDay(LocalDate date) {
        return date == null ? null : date.atStartOfDay(BUSINESS_ZONE).toInstant();
    }

    private static Instant startOfFollowingDay(LocalDate date) {
        return date == null
                ? null
                : date.atStartOfDay(BUSINESS_ZONE).plusDays(1).toInstant();
    }
}
