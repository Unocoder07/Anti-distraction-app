package com.sankalai.exception;

/** Thrown when an authenticated user attempts to act on a resource they do not own. Maps to HTTP 403. */
public class UnauthorizedActionException extends RuntimeException {
    public UnauthorizedActionException(String message) {
        super(message);
    }
}
