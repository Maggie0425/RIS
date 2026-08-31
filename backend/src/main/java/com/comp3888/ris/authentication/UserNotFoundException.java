package com.comp3888.ris.authentication;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(Long id) {
        super("User " + id + " was not found.");
    }
}
