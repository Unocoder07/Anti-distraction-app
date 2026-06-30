package com.sankalai.exception;

/** Thrown when a requested entity (user, session, app, etc.) does not exist. Maps to HTTP 404. */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
