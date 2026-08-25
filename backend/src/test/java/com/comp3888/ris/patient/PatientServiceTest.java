package com.comp3888.ris.patient;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository repository;

    private PatientService service;

    @BeforeEach
    void setUp() {
        service = new PatientService(repository);
    }

    @Test
    void getPatients_returnsPatientsSortedById() {
        Patient firstPatient = patient("SYN-000001", "Avery", "Taylor");
        Patient secondPatient = patient("SYN-000002", "Jordan", "Lee");

        when(repository.findAll(Sort.by(Sort.Direction.ASC, "id")))
                .thenReturn(List.of(firstPatient, secondPatient));

        List<PatientResponse> result = service.getPatients();

        assertEquals(2, result.size());
        assertEquals("SYN-000001", result.get(0).medicalRecordNumber());
        assertEquals("Avery", result.get(0).firstName());
        assertEquals("SYN-000002", result.get(1).medicalRecordNumber());

        verify(repository).findAll(Sort.by(Sort.Direction.ASC, "id"));
    }

    @Test
    void getPatient_returnsPatientWhenFound() {
        Patient patient = patient("SYN-000001", "Avery", "Taylor");
        when(repository.findById(1L)).thenReturn(Optional.of(patient));

        PatientResponse result = service.getPatient(1L);

        assertEquals("SYN-000001", result.medicalRecordNumber());
        assertEquals("Avery", result.firstName());
        assertEquals("Taylor", result.lastName());
    }

    @Test
    void getPatient_throwsWhenPatientDoesNotExist() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(PatientNotFoundException.class, () -> service.getPatient(99L));
    }

    @Test
    void createPatient_normalizesMrnAndNames() {
        PatientRequest request = new PatientRequest(
                "  syn-000010  ",
                "  Avery  ",
                "  Taylor  ",
                LocalDate.of(1990, 4, 15),
                PatientSex.UNKNOWN);

        when(repository.existsByMedicalRecordNumber("SYN-000010")).thenReturn(false);
        when(repository.saveAndFlush(any(Patient.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.createPatient(request);

        ArgumentCaptor<Patient> patientCaptor = ArgumentCaptor.forClass(Patient.class);
        verify(repository).saveAndFlush(patientCaptor.capture());

        Patient savedPatient = patientCaptor.getValue();
        assertEquals("SYN-000010", savedPatient.getMedicalRecordNumber());
        assertEquals("Avery", savedPatient.getFirstName());
        assertEquals("Taylor", savedPatient.getLastName());

        
        verify(repository).existsByMedicalRecordNumber("SYN-000010");
    }

    @Test
    void createPatient_throwsConflictWhenMrnAlreadyExists() {
        when(repository.existsByMedicalRecordNumber("SYN-000010")).thenReturn(true);

        PatientRequest request = validRequest("SYN-000010");

        assertThrows(DuplicateMedicalRecordNumberException.class,
                () -> service.createPatient(request));

        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void createPatient_convertsDatabaseDuplicateToDomainException() {
        when(repository.existsByMedicalRecordNumber("SYN-000010")).thenReturn(false);
        when(repository.saveAndFlush(any(Patient.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate"));

        assertThrows(DuplicateMedicalRecordNumberException.class,
                () -> service.createPatient(validRequest("SYN-000010")));
    }

    @Test
    void updatePatient_normalizesMrnAndNames() {
        Patient existingPatient = patient("SYN-000001", "Old", "Name");
        when(repository.findById(1L)).thenReturn(Optional.of(existingPatient));
        when(repository.existsByMedicalRecordNumberAndIdNot("SYN-000011", 1L)).thenReturn(false);
        when(repository.saveAndFlush(existingPatient)).thenReturn(existingPatient);

        PatientRequest request = new PatientRequest(
                "  syn-000011  ",
                "  New  ",
                "  Name  ",
                LocalDate.of(1995, 1, 1),
                PatientSex.FEMALE);

        service.updatePatient(1L, request);

        assertEquals("SYN-000011", existingPatient.getMedicalRecordNumber());
        assertEquals("New", existingPatient.getFirstName());
        assertEquals("Name", existingPatient.getLastName());

        // duplicate check ran against the normalized value
        verify(repository).existsByMedicalRecordNumberAndIdNot("SYN-000011", 1L);
    }

    @Test
    void updatePatient_throwsWhenPatientDoesNotExist() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(PatientNotFoundException.class,
                () -> service.updatePatient(99L, validRequest("SYN-000010")));

        verify(repository, never()).existsByMedicalRecordNumberAndIdNot(anyString(), anyLong());
    }

    @Test
    void updatePatient_throwsConflictWhenMrnAlreadyExists() {
        Patient existingPatient = patient("SYN-000001", "Avery", "Taylor");
        when(repository.findById(1L)).thenReturn(Optional.of(existingPatient));
        when(repository.existsByMedicalRecordNumberAndIdNot("SYN-000099", 1L)).thenReturn(true);

        PatientRequest request = new PatientRequest(
                "  syn-000099  ",
                "Avery",
                "Taylor",
                LocalDate.of(1990, 4, 15),
                PatientSex.UNKNOWN);

        assertThrows(DuplicateMedicalRecordNumberException.class,
                () -> service.updatePatient(1L, request));

        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void updatePatient_convertsDatabaseDuplicateToDomainException() {
        Patient existingPatient = patient("SYN-000001", "Avery", "Taylor");
        when(repository.findById(1L)).thenReturn(Optional.of(existingPatient));
        when(repository.existsByMedicalRecordNumberAndIdNot("SYN-000099", 1L)).thenReturn(false);
        when(repository.saveAndFlush(existingPatient))
                .thenThrow(new DataIntegrityViolationException("duplicate"));

        PatientRequest request = new PatientRequest(
                "  syn-000099  ",
                "Avery",
                "Taylor",
                LocalDate.of(1990, 4, 15),
                PatientSex.UNKNOWN);

        assertThrows(DuplicateMedicalRecordNumberException.class,
                () -> service.updatePatient(1L, request));
    }

    private Patient patient(String mrn, String firstName, String lastName) {
        return new Patient(
                mrn,
                firstName,
                lastName,
                LocalDate.of(1990, 1, 1),
                PatientSex.UNKNOWN);
    }

    private PatientRequest validRequest(String mrn) {
        return new PatientRequest(
                mrn,
                "Avery",
                "Taylor",
                LocalDate.of(1990, 4, 15),
                PatientSex.UNKNOWN);
    }
}