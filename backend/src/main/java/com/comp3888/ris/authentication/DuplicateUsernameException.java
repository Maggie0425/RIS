package com.comp3888.ris.authentication;

public class DuplicateUsernameException extends RuntimeException {
    public DuplicateUsernameException(String username) {
        super("Username '" + username + "' is already in use.");
    }
}
