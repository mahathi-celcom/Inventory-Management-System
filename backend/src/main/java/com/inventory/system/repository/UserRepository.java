package com.inventory.system.repository;

import com.inventory.system.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // Employee code related methods
    Optional<User> findByEmployeeCode(String employeeCode);
    boolean existsByEmployeeCode(String employeeCode);
    boolean existsByEmployeeCodeAndIdNot(String employeeCode, Long id);

    Page<User> findByDepartment(String department, Pageable pageable);

    // User type related methods
    Page<User> findByUserType(String userType, Pageable pageable);
    List<User> findByUserType(String userType);

    // Location related methods
    Page<User> findByCountry(String country, Pageable pageable);
    Page<User> findByCity(String city, Pageable pageable);
    List<User> findByCountry(String country);
    List<User> findByCity(String city);

    Page<User> findByIsOfficeAsset(Boolean isOfficeAsset, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.fullNameOrOfficeName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.employeeCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.department) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.location) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.city) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.country) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<User> searchUsers(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.status = :status AND (" +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.fullNameOrOfficeName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.employeeCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.department) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.location) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.city) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.country) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<User> searchUsersByStatus(@Param("searchTerm") String searchTerm, @Param("status") String status, Pageable pageable);
    
    // Status-related methods
    List<User> findByStatus(String status);
    Page<User> findByStatus(String status, Pageable pageable);
    List<User> findByStatusAndDepartment(String status, String department);
    Page<User> findByStatusAndDepartment(String status, String department, Pageable pageable);
    List<User> findByStatusOrderByFullNameOrOfficeNameAsc(String status);
}