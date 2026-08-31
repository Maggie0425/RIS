package com.comp3888.ris.authentication;

public class InvalidRoleAssignmentException extends RuntimeException {
    public InvalidRoleAssignmentException() {
        super("One or more role codes are invalid or unavailable.");
    }
}
