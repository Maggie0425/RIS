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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/api/patients")
@Tag(name = "Patients", description = "Synthetic patient registration and management")
public class PatientController {

    private final PatientService service;

    PatientController(PatientService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "List patients")
    @ApiResponse(responseCode = "200", description = "Patients returned")
    public List<PatientResponse> getPatients() {
        return service.getPatients();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a patient")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Patient returned"),
            @ApiResponse(responseCode = "404", description = "Patient not found")
    })
    public PatientResponse getPatient(@PathVariable Long id) {
        return service.getPatient(id);
    }

    @PostMapping
    @Operation(summary = "Register a synthetic patient")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Patient created"),
            @ApiResponse(responseCode = "400", description = "Request validation failed"),
            @ApiResponse(responseCode = "409", description = "Medical record number already exists")
    })
    public ResponseEntity<PatientResponse> createPatient(@Valid @RequestBody PatientRequest request) {
        PatientResponse response = service.createPatient(request);
        return ResponseEntity
                .created(URI.create("/api/patients/" + response.id()))
                .body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a patient")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Patient updated"),
            @ApiResponse(responseCode = "400", description = "Request validation failed"),
            @ApiResponse(responseCode = "404", description = "Patient not found"),
            @ApiResponse(responseCode = "409", description = "Medical record number already exists")
    })
    public PatientResponse updatePatient(@PathVariable Long id,
            @Valid @RequestBody PatientRequest request) {
        return service.updatePatient(id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Delete a patient",
            description = "Temporary endpoint pending the project decision on clinical record retention.",
            deprecated = true)
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Patient deleted"),
            @ApiResponse(responseCode = "404", description = "Patient not found")
    })
    public ResponseEntity<Void> deletePatient(@PathVariable Long id) {
        service.deletePatient(id);
        return ResponseEntity.noContent().build();
    }
}
