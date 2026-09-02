package com.comp3888.ris.api;

import java.time.Instant;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.comp3888.ris.exam.ExamNotFoundException;
import com.comp3888.ris.exam.InvalidExamTransitionException;
import com.comp3888.ris.authentication.DuplicateUsernameException;
import com.comp3888.ris.authentication.FinalAdministratorException;
import com.comp3888.ris.authentication.InvalidRoleAssignmentException;
import com.comp3888.ris.authentication.UserNotFoundException;
import com.comp3888.ris.patient.DuplicateMedicalRecordNumberException;
import com.comp3888.ris.patient.PatientNotFoundException;
import com.comp3888.ris.scheduling.ExamScheduleStateException;
import com.comp3888.ris.worklist.InvalidWorklistCriteriaException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<ApiErrorResponse> handleAuthentication(AuthenticationException exception) {
        return error(HttpStatus.UNAUTHORIZED, "Invalid username or password.", Map.of());
    }

    @ExceptionHandler({ PatientNotFoundException.class, ExamNotFoundException.class, UserNotFoundException.class })
    ResponseEntity<ApiErrorResponse> handleNotFound(RuntimeException exception) {
        return error(HttpStatus.NOT_FOUND, exception.getMessage(), Map.of());
    }

    @ExceptionHandler({ DuplicateMedicalRecordNumberException.class, DuplicateUsernameException.class,
            FinalAdministratorException.class, InvalidExamTransitionException.class,
            ExamScheduleStateException.class })
    ResponseEntity<ApiErrorResponse> handleConflict(RuntimeException exception) {
        return error(HttpStatus.CONFLICT, exception.getMessage(), Map.of());
    }

    @ExceptionHandler({ InvalidRoleAssignmentException.class, InvalidWorklistCriteriaException.class })
    ResponseEntity<ApiErrorResponse> handleBadRequest(RuntimeException exception) {
        return error(HttpStatus.BAD_REQUEST, exception.getMessage(), Map.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, String> fieldErrors = new TreeMap<>();
        exception.getBindingResult().getFieldErrors().forEach(fieldError ->
                fieldErrors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage()));
        return error(HttpStatus.BAD_REQUEST, "Request validation failed.", fieldErrors);
    }

    private ResponseEntity<ApiErrorResponse> error(
            HttpStatus status, String message, Map<String, String> fieldErrors) {
        return ResponseEntity.status(status).body(new ApiErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                fieldErrors));
    }
}
