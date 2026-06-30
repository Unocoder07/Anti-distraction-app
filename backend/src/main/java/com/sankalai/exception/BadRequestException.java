package com.sankalai.exception;

/** Thrown when a request is invalid due to client input or state. Maps to HTTP 400. */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
