package com.inventory.system.model;

import lombok.Data;
import java.io.Serializable;

@Data
public class AssetTagAssignmentId implements Serializable {
    private Long asset;
    private Long tag;
} 