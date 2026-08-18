package com.comp3888.ris.patient;

import org.springframework.data.jpa.repository.JpaRepository;

interface PatientRepository extends JpaRepository<Patient, Long> {

    boolean existsByMedicalRecordNumber(String medicalRecordNumber);

    boolean existsByMedicalRecordNumberAndIdNot(String medicalRecordNumber, Long id);
}
