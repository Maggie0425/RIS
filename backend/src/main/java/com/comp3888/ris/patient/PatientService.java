package com.comp3888.ris.patient;

import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Sort;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientService {

    private final PatientRepository repository;

    PatientService(PatientRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> getPatients() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "id")).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PatientResponse getPatient(Long id) {
        return toResponse(findPatient(id));
    }

    @Transactional
    public PatientResponse createPatient(PatientRequest request) {
        String medicalRecordNumber = normalizeMedicalRecordNumber(request.medicalRecordNumber());
        if (repository.existsByMedicalRecordNumber(medicalRecordNumber)) {
            throw new DuplicateMedicalRecordNumberException(medicalRecordNumber);
        }

        Patient patient = new Patient(
                medicalRecordNumber,
                request.firstName().trim(),
                request.lastName().trim(),
                request.dateOfBirth(),
                request.sex());

        return toResponse(save(patient, medicalRecordNumber));
    }

    @Transactional
    public PatientResponse updatePatient(Long id, PatientRequest request) {
        Patient patient = findPatient(id);
        String medicalRecordNumber = normalizeMedicalRecordNumber(request.medicalRecordNumber());
        if (repository.existsByMedicalRecordNumberAndIdNot(medicalRecordNumber, id)) {
            throw new DuplicateMedicalRecordNumberException(medicalRecordNumber);
        }

        patient.update(
                medicalRecordNumber,
                request.firstName().trim(),
                request.lastName().trim(),
                request.dateOfBirth(),
                request.sex());

        return toResponse(save(patient, medicalRecordNumber));
    }

    @Transactional
    public void deletePatient(Long id) {
        Patient patient = findPatient(id);
        repository.delete(patient);
    }

    private Patient findPatient(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new PatientNotFoundException(id));
    }

    private Patient save(Patient patient, String medicalRecordNumber) {
        try {
            return repository.saveAndFlush(patient);
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateMedicalRecordNumberException(medicalRecordNumber);
        }
    }

    private String normalizeMedicalRecordNumber(String medicalRecordNumber) {
        return medicalRecordNumber.trim().toUpperCase(Locale.ROOT);
    }

    private PatientResponse toResponse(Patient patient) {
        return new PatientResponse(
                patient.getId(),
                patient.getMedicalRecordNumber(),
                patient.getFirstName(),
                patient.getLastName(),
                patient.getDateOfBirth(),
                patient.getSex(),
                patient.getCreatedAt(),
                patient.getUpdatedAt());
    }
}
