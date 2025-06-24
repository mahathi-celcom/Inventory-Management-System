package com.inventory.system.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserDTO {
    private Long id;

    @NotBlank(message = "Name is required")
    private String fullNameOrOfficeName;

    private String employeeCode;

    private String userType; // Permanent, Contractor

    private String department;
    private String designation;
    private String country;
    private String city;

    @Email(message = "Invalid email format")
    private String email; // Made optional, validation handled in service layer

    private String location;
    private Boolean isOfficeAsset;
    private String status;
    private LocalDateTime createdAt;

    // Helper method to get username (uses fullNameOrOfficeName instead of email)
    public String getUsername() {
        return this.fullNameOrOfficeName;
    }

    // Helper method to check if email is required based on user type
    public boolean isEmailRequired() {
        return !"CONTRACTOR".equalsIgnoreCase(this.userType);
    }
} 