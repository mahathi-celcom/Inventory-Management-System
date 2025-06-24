package com.inventory.system.service;

import com.inventory.system.dto.UserDTO;
import com.inventory.system.dto.PageResponse;
import org.springframework.data.domain.Pageable;

public interface UserService {
    UserDTO createUser(UserDTO userDTO);
    UserDTO updateUser(Long id, UserDTO userDTO);
    UserDTO getUser(Long id);
    UserDTO getUserByEmail(String email);
    UserDTO getUserByEmployeeCode(String employeeCode);
    PageResponse<UserDTO> getAllUsers(Pageable pageable);
    PageResponse<UserDTO> getActiveUsers(Pageable pageable);
    PageResponse<UserDTO> getUsersByDepartment(String department, Pageable pageable);
    PageResponse<UserDTO> getUsersByUserType(String userType, Pageable pageable);
    PageResponse<UserDTO> getUsersByCountry(String country, Pageable pageable);
    PageResponse<UserDTO> searchUsers(String searchTerm, Pageable pageable);
    PageResponse<UserDTO> searchUsers(String searchTerm, String status, Pageable pageable);
    void deleteUser(Long id);
    void activateUser(Long id);
    void deactivateUser(Long id);
    
    // Status-related methods
    PageResponse<UserDTO> getUsersByStatus(String status, Pageable pageable);
    PageResponse<UserDTO> getUsersByStatusAndDepartment(String status, String department, Pageable pageable);
} 