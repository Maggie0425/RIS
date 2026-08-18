package com.comp3888.ris.patient;

public class DuplicateMedicalRecordNumberException extends RuntimeException {

    DuplicateMedicalRecordNumberException(String medicalRecordNumber) {
        super("Medical record number " + medicalRecordNumber + " already exists.");
    }
}
