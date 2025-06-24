package com.inventory.system.controller;

import com.inventory.system.dto.UserDTO;
import com.inventory.system.dto.PageResponse;
import com.inventory.system.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController("inventory-user-controller")
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "http://172.27.112.1:4200"}, 
             allowedHeaders = "*", 
             allowCredentials = "true",
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
public class UserController {
    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserDTO userDTO) {
        return new ResponseEntity<>(userService.createUser(userDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @Valid @RequestBody UserDTO userDTO) {
        return ResponseEntity.ok(userService.updateUser(id, userDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUser(id));
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserDTO> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @GetMapping("/employee-code/{employeeCode}")
    public ResponseEntity<UserDTO> getUserByEmployeeCode(@PathVariable String employeeCode) {
        return ResponseEntity.ok(userService.getUserByEmployeeCode(employeeCode));
    }

    @GetMapping
    public ResponseEntity<PageResponse<UserDTO>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fullNameOrOfficeName") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir,
            @RequestParam(required = false) String status) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        PageResponse<UserDTO> users;
        if (status != null && !status.trim().isEmpty()) {
            users = userService.getUsersByStatus(status, pageRequest);
        } else {
            users = userService.getAllUsers(pageRequest);
        }
        return ResponseEntity.ok(users);
    }

    @GetMapping("/active")
    public ResponseEntity<PageResponse<UserDTO>> getActiveUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(userService.getActiveUsers(pageRequest));
    }

    @GetMapping("/department/{department}")
    public ResponseEntity<PageResponse<UserDTO>> getUsersByDepartment(
            @PathVariable String department,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir,
            @RequestParam(required = false) String status) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        PageResponse<UserDTO> users;
        if (status != null && !status.trim().isEmpty()) {
            users = userService.getUsersByStatusAndDepartment(status, department, pageRequest);
        } else {
            users = userService.getUsersByDepartment(department, pageRequest);
        }
        return ResponseEntity.ok(users);
    }

    @GetMapping("/user-type/{userType}")
    public ResponseEntity<PageResponse<UserDTO>> getUsersByUserType(
            @PathVariable String userType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fullNameOrOfficeName") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(userService.getUsersByUserType(userType, pageRequest));
    }

    @GetMapping("/country/{country}")
    public ResponseEntity<PageResponse<UserDTO>> getUsersByCountry(
            @PathVariable String country,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fullNameOrOfficeName") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(userService.getUsersByCountry(country, pageRequest));
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponse<UserDTO>> searchUsers(
            @RequestParam String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fullNameOrOfficeName") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir,
            @RequestParam(required = false) String status) {
        
        Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(userService.searchUsers(searchTerm, status, pageRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activateUser(@PathVariable Long id) {
        userService.activateUser(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateUser(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok().build();
    }
} 