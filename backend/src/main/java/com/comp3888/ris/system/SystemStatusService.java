package com.comp3888.ris.system;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SystemStatusService {

    private final SystemStatusRepository repository;

    SystemStatusService(SystemStatusRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<SystemStatusResponse> getStatuses() {
        return repository.findAll().stream()
                .map(status -> new SystemStatusResponse(
                        status.getId(),
                        status.getServiceName(),
                        status.getMessage()))
                .toList();
    }
}
