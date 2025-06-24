package com.inventory.system.controller;

import com.inventory.system.dto.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

@Slf4j
@RestController
@RequestMapping("/error")
public class CustomErrorController implements ErrorController {

    @RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ErrorResponse> handleError(HttpServletRequest request) {
        
        // Get error status
        Integer statusCode = (Integer) request.getAttribute("javax.servlet.error.status_code");
        String errorMessage = (String) request.getAttribute("javax.servlet.error.message");
        String requestUri = (String) request.getAttribute("javax.servlet.error.request_uri");
        
        if (statusCode == null) {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR.value();
        }
        
        if (errorMessage == null || errorMessage.trim().isEmpty()) {
            errorMessage = getDefaultErrorMessage(statusCode);
        }
        
        if (requestUri == null) {
            requestUri = request.getRequestURI();
        }
        
        log.error("Error occurred: status={}, message={}, uri={}", statusCode, errorMessage, requestUri);
        
        HttpStatus httpStatus = HttpStatus.valueOf(statusCode);
        
        ErrorResponse error = ErrorResponse.of(
            statusCode,
            httpStatus.getReasonPhrase(),
            errorMessage,
            requestUri
        );
        
        return new ResponseEntity<>(error, httpStatus);
    }
    
    private String getDefaultErrorMessage(int statusCode) {
        return switch (statusCode) {
            case 400 -> "Bad Request";
            case 401 -> "Unauthorized";
            case 403 -> "Forbidden";
            case 404 -> "Resource not found";
            case 405 -> "Method not allowed";
            case 409 -> "Conflict";
            case 500 -> "Internal Server Error";
            default -> "An error occurred";
        };
    }
} 