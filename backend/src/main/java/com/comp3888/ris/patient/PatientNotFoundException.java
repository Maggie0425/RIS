package com.comp3888.ris.patient;

public class PatientNotFoundException extends RuntimeException {

    PatientNotFoundException(Long id) {
        super("Patient " + id + " was not found.");
    }
}
