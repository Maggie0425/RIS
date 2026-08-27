package com.comp3888.ris.exam;

import java.util.EnumMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExamStatisticsService {

    private final ExamRepository repository;

    ExamStatisticsService(ExamRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public ExamStatusSummary getStatusSummary() {
        Map<ExamStatus, Long> counts = new EnumMap<>(ExamStatus.class);
        for (ExamStatus status : ExamStatus.values()) {
            counts.put(status, 0L);
        }
        repository.countGroupedByStatus()
                .forEach(result -> counts.put(result.status(), result.count()));
        long total = counts.values().stream().mapToLong(Long::longValue).sum();

        return new ExamStatusSummary(
                total,
                counts.get(ExamStatus.ORDERED),
                counts.get(ExamStatus.SCHEDULED),
                counts.get(ExamStatus.ACQUIRED),
                counts.get(ExamStatus.REPORTED),
                counts.get(ExamStatus.COMPLETED),
                counts.get(ExamStatus.CANCELLED));
    }
}
