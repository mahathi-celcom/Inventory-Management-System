package com.inventory.system.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "\"user\"")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "fullname_or_officename")
    private String fullNameOrOfficeName;

    @Column(name = "employee_code", unique = true)
    private String employeeCode;

    @Column(name = "user_type")
    private String userType; // e.g., "EMPLOYEE", "CONTRACTOR", "VENDOR"

    private String department;
    private String designation;
    private String country;
    private String city;

    @Column(nullable = true) // Made nullable for contractors
    private String email;

    @Column(name = "location")
    private String location;

    @Column(name = "is_office_asset")
    private Boolean isOfficeAsset;

    @Column(name = "status", nullable = false, columnDefinition = "VARCHAR(255) DEFAULT 'Active'")
    private String status = "Active";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Helper method to get username (uses fullNameOrOfficeName instead of email)
    public String getUsername() {
        return this.fullNameOrOfficeName;
    }
} 