package com.comp3888.ris.patient;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService service;

    PatientController(PatientService service) {
        this.service = service;
    }

    @GetMapping
    public List<PatientResponse> getPatients() {
        return service.getPatients();
    }

    @GetMapping("/{id}")
    public PatientResponse getPatient(@PathVariable Long id) {
        return service.getPatient(id);
    }

    @PostMapping
    public ResponseEntity<PatientResponse> createPatient(@Valid @RequestBody PatientRequest request) {
        PatientResponse response = service.createPatient(request);
        return ResponseEntity
                .created(URI.create("/api/patients/" + response.id()))
                .body(response);
    }

    @PutMapping("/{id}")
    public PatientResponse updatePatient(@PathVariable Long id,
            @Valid @RequestBody PatientRequest request) {
        return service.updatePatient(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePatient(@PathVariable Long id) {
        service.deletePatient(id);
        return ResponseEntity.noContent().build();
    }
}
