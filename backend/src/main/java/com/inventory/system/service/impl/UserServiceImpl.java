package com.inventory.system.service.impl;

import com.inventory.system.dto.UserDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.exception.ResourceNotFoundException;
import com.inventory.system.exception.ConflictException;
import com.inventory.system.model.User;
import com.inventory.system.repository.UserRepository;
import com.inventory.system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserDTO createUser(UserDTO userDTO) {
        // Validate unique employee code
        validateEmployeeCodeUniqueness(userDTO.getEmployeeCode(), null);
        
        // Validate email requirement based on user type
        validateEmailRequirement(userDTO);

        User user = new User();
        updateUserFromDTO(user, userDTO);
        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    @Override
    @Transactional
    public UserDTO updateUser(Long id, UserDTO userDTO) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        
        // Validate unique employee code (excluding current user)
        validateEmployeeCodeUniqueness(userDTO.getEmployeeCode(), id);
        
        // Validate email requirement based on user type
        validateEmailRequirement(userDTO);

        updateUserFromDTO(user, userDTO);
        User updatedUser = userRepository.save(user);
        return convertToDTO(updatedUser);
    }

    @Override
    public UserDTO getUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return convertToDTO(user);
    }

    @Override
    public UserDTO getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return convertToDTO(user);
    }

    @Override
    public UserDTO getUserByEmployeeCode(String employeeCode) {
        User user = userRepository.findByEmployeeCode(employeeCode)
            .orElseThrow(() -> new ResourceNotFoundException("User", "employeeCode", employeeCode));
        return convertToDTO(user);
    }

    @Override
    public PageResponse<UserDTO> getAllUsers(Pageable pageable) {
        Page<User> userPage = userRepository.findAll(pageable);
        return createPageResponse(userPage);
    }

    @Override
    public PageResponse<UserDTO> searchUsers(String searchTerm, Pageable pageable) {
        Page<User> userPage = userRepository.searchUsers(searchTerm, pageable);
        return createPageResponse(userPage);
    }

    @Override
    public PageResponse<UserDTO> searchUsers(String searchTerm, String status, Pageable pageable) {
        Page<User> userPage;
        
        if (status != null && !status.trim().isEmpty()) {
            userPage = userRepository.searchUsersByStatus(searchTerm, status, pageable);
        } else {
            userPage = userRepository.searchUsers(searchTerm, pageable);
        }
        
        return createPageResponse(userPage);
    }

    @Override
    public PageResponse<UserDTO> getActiveUsers(Pageable pageable) {
        Page<User> userPage = userRepository.findByIsOfficeAsset(true, pageable);
        return createPageResponse(userPage);
    }

    @Override
    public PageResponse<UserDTO> getUsersByDepartment(String department, Pageable pageable) {
        Page<User> userPage = userRepository.findByDepartment(department, pageable);
        return createPageResponse(userPage);
    }

    @Override
    public PageResponse<UserDTO> getUsersByUserType(String userType, Pageable pageable) {
        Page<User> userPage = userRepository.findByUserType(userType, pageable);
        return createPageResponse(userPage);
    }

    @Override
    public PageResponse<UserDTO> getUsersByCountry(String country, Pageable pageable) {
        Page<User> userPage = userRepository.findByCountry(country, pageable);
        return createPageResponse(userPage);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        userRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void activateUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setStatus("Active");
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deactivateUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setStatus("Inactive");
        userRepository.save(user);
    }

    @Override
    public PageResponse<UserDTO> getUsersByStatus(String status, Pageable pageable) {
        Page<User> userPage = userRepository.findByStatus(status, pageable);
        return createPageResponse(userPage);
    }

    @Override
    public PageResponse<UserDTO> getUsersByStatusAndDepartment(String status, String department, Pageable pageable) {
        Page<User> userPage = userRepository.findByStatusAndDepartment(status, department, pageable);
        return createPageResponse(userPage);
    }

    private void validateEmployeeCodeUniqueness(String employeeCode, Long excludeUserId) {
        if (employeeCode == null || employeeCode.trim().isEmpty()) {
            return; // Employee code is optional
        }
        
        boolean exists = excludeUserId != null 
            ? userRepository.existsByEmployeeCodeAndIdNot(employeeCode, excludeUserId)
            : userRepository.existsByEmployeeCode(employeeCode);
            
        if (exists) {
            throw new ConflictException("Employee code already exists: " + employeeCode);
        }
    }

    private void validateEmailRequirement(UserDTO userDTO) {
        // Email is required for EMPLOYEE type, optional for CONTRACTOR
        if ("EMPLOYEE".equalsIgnoreCase(userDTO.getUserType()) || 
            "VENDOR".equalsIgnoreCase(userDTO.getUserType())) {
            if (userDTO.getEmail() == null || userDTO.getEmail().trim().isEmpty()) {
                throw new IllegalArgumentException("Email is required for user type: " + userDTO.getUserType());
            }
        }
    }

    private void updateUserFromDTO(User user, UserDTO dto) {
        user.setFullNameOrOfficeName(dto.getFullNameOrOfficeName());
        user.setEmployeeCode(dto.getEmployeeCode());
        user.setUserType(dto.getUserType());
        user.setDepartment(dto.getDepartment());
        user.setDesignation(dto.getDesignation());
        user.setCountry(dto.getCountry());
        user.setCity(dto.getCity());
        user.setEmail(dto.getEmail());
        user.setIsOfficeAsset(dto.getIsOfficeAsset());
        user.setLocation(dto.getLocation());
        if (dto.getStatus() != null) {
            user.setStatus(dto.getStatus());
        }
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setFullNameOrOfficeName(user.getFullNameOrOfficeName());
        dto.setEmployeeCode(user.getEmployeeCode());
        dto.setUserType(user.getUserType());
        dto.setDepartment(user.getDepartment());
        dto.setDesignation(user.getDesignation());
        dto.setCountry(user.getCountry());
        dto.setCity(user.getCity());
        dto.setEmail(user.getEmail());
        dto.setLocation(user.getLocation());
        dto.setIsOfficeAsset(user.getIsOfficeAsset());
        dto.setStatus(user.getStatus());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }

    private PageResponse<UserDTO> createPageResponse(Page<User> page) {
        return new PageResponse<>(
            page.getContent().stream().map(this::convertToDTO).toList(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.isLast(),
            page.isFirst()
        );
    }
}