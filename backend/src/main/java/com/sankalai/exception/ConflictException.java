package com.sankalai.exception;

/** Thrown when a request conflicts with existing state (duplicate email/username, etc.). Maps to HTTP 409. */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
