package com.comp3888.ris.system;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.security.SecurityRequirements;

@RestController
@RequestMapping("/api/status")
@SecurityRequirements
public class SystemStatusController {

    private final SystemStatusService service;

    SystemStatusController(SystemStatusService service) {
        this.service = service;
    }

    @GetMapping
    public List<SystemStatusResponse> getStatuses() {
        return service.getStatuses();
    }
}
