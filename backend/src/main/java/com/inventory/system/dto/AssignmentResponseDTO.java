package com.inventory.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentResponseDTO {
    private boolean success;
    private String message;
    private Long assetId;
    private Long assignedId; // Can be userId or tagId
    private String assignedType; // "USER" or "TAG"
    
    public static AssignmentResponseDTO success(String message, Long assetId, Long assignedId, String assignedType) {
        return AssignmentResponseDTO.builder()
                .success(true)
                .message(message)
                .assetId(assetId)
                .assignedId(assignedId)
                .assignedType(assignedType)
                .build();
    }
    
    public static AssignmentResponseDTO error(String message, Long assetId) {
        return AssignmentResponseDTO.builder()
                .success(false)
                .message(message)
                .assetId(assetId)
                .build();
    }
} 