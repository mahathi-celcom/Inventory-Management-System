package com.inventory.system.service.impl;

import com.inventory.system.dto.AssetAnalyticsSummaryDTO;
import com.inventory.system.dto.AssetReportDTO;
import com.inventory.system.model.Asset;
import com.inventory.system.repository.AssetAnalyticsRepository;
import com.inventory.system.service.AssetAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssetAnalyticsServiceImpl implements AssetAnalyticsService {
    
    private final AssetAnalyticsRepository analyticsRepository;
    
    @Override
    public AssetAnalyticsSummaryDTO getAnalyticsSummary() {
        log.info("Generating comprehensive analytics summary");
        
        try {
            // Get asset count by status
            Map<String, Long> assetCountByStatus = new HashMap<>();
            List<Object[]> statusResults = analyticsRepository.countAssetsByStatus();
            for (Object[] result : statusResults) {
                String status = (String) result[0];
                Long count = (Long) result[1];
                assetCountByStatus.put(status != null ? status : "Unknown", count);
            }
            
            // Get asset count by OS
            Map<String, Long> assetCountByOS = new HashMap<>();
            List<Object[]> osResults = analyticsRepository.countAssetsByOS();
            for (Object[] result : osResults) {
                String osName = (String) result[0];
                Long count = (Long) result[1];
                assetCountByOS.put(osName, count);
            }
            
            // Get asset count by department and type
            Map<String, Map<String, Long>> assetCountByDepartmentAndType = new HashMap<>();
            List<Object[]> deptTypeResults = analyticsRepository.countAssetsByDepartmentAndType();
            for (Object[] result : deptTypeResults) {
                String department = (String) result[0];
                String assetType = (String) result[1];
                Long count = (Long) result[2];
                
                assetCountByDepartmentAndType
                    .computeIfAbsent(department, k -> new HashMap<>())
                    .put(assetType, count);
            }
            
            // Get warranty status by asset type
            Map<String, AssetAnalyticsSummaryDTO.WarrantySummaryDTO> warrantyStatusByAssetType = new HashMap<>();
            List<Object[]> warrantyResults = analyticsRepository.getWarrantyStatusByAssetType();
            for (Object[] result : warrantyResults) {
                String assetType = (String) result[0];
                Long inWarranty = (Long) result[1];
                Long outOfWarranty = (Long) result[2];
                Long noWarranty = (Long) result[3];
                Long totalAssets = (Long) result[4];
                
                AssetAnalyticsSummaryDTO.WarrantySummaryDTO warrantySummary = 
                    AssetAnalyticsSummaryDTO.WarrantySummaryDTO.builder()
                        .assetType(assetType != null ? assetType : "Unknown")
                        .inWarranty(inWarranty)
                        .outOfWarranty(outOfWarranty)
                        .noWarranty(noWarranty)
                        .totalAssets(totalAssets)
                        .build();
                
                warrantyStatusByAssetType.put(assetType != null ? assetType : "Unknown", warrantySummary);
            }
            
            // Get asset aging
            List<AssetAnalyticsSummaryDTO.AssetAgingDTO> assetAging = new ArrayList<>();
            List<Object[]> agingResults = analyticsRepository.getAssetAging();
            for (Object[] result : agingResults) {
                String ageRange = (String) result[0];
                Long count = (Long) result[1];
                
                AssetAnalyticsSummaryDTO.AssetAgingDTO agingDTO = 
                    AssetAnalyticsSummaryDTO.AssetAgingDTO.builder()
                        .ageRange(ageRange)
                        .count(count)
                        .build();
                
                assetAging.add(agingDTO);
            }
            
            // Get asset count by category (Hardware/Software classification)
            Map<String, Long> assetCountByCategory = new HashMap<>();
            List<Object[]> categoryResults = analyticsRepository.countAssetsByCategory();
            for (Object[] result : categoryResults) {
                String category = (String) result[0];
                Long count = (Long) result[1];
                assetCountByCategory.put(category != null ? category : "Unknown", count);
            }
            
            AssetAnalyticsSummaryDTO summary = AssetAnalyticsSummaryDTO.builder()
                .assetCountByStatus(assetCountByStatus)
                .assetCountByOS(assetCountByOS)
                .assetCountByDepartmentAndType(assetCountByDepartmentAndType)
                .warrantyStatusByAssetType(warrantyStatusByAssetType)
                .assetAging(assetAging)
                .assetCountByCategory(assetCountByCategory)
                .build();
            
            log.info("Successfully generated analytics summary");
            return summary;
            
        } catch (Exception e) {
            log.error("Error generating analytics summary: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate analytics summary", e);
        }
    }
    
    @Override
    public List<AssetAnalyticsSummaryDTO.AssetAgingDTO> getAssetAging(String department, String assetType) {
        log.info("Getting asset aging data with filters - department: {}, assetType: {}", department, assetType);
        
        try {
            List<AssetAnalyticsSummaryDTO.AssetAgingDTO> agingData = new ArrayList<>();
            
            if (department != null && !department.trim().isEmpty()) {
                // Filter by department
                List<Object[]> results = analyticsRepository.getAssetAgingByDepartment(department);
                for (Object[] result : results) {
                    String ageRange = (String) result[0];
                    Long count = (Long) result[1];
                    String dept = (String) result[2];
                    
                    AssetAnalyticsSummaryDTO.AssetAgingDTO agingDTO = 
                        AssetAnalyticsSummaryDTO.AssetAgingDTO.builder()
                            .ageRange(ageRange)
                            .count(count)
                            .department(dept)
                            .build();
                    
                    agingData.add(agingDTO);
                }
            } else if (assetType != null && !assetType.trim().isEmpty()) {
                // Filter by asset type
                List<Object[]> results = analyticsRepository.getAssetAgingByAssetType(assetType);
                for (Object[] result : results) {
                    String ageRange = (String) result[0];
                    Long count = (Long) result[1];
                    String type = (String) result[2];
                    
                    AssetAnalyticsSummaryDTO.AssetAgingDTO agingDTO = 
                        AssetAnalyticsSummaryDTO.AssetAgingDTO.builder()
                            .ageRange(ageRange)
                            .count(count)
                            .assetType(type)
                            .build();
                    
                    agingData.add(agingDTO);
                }
            } else {
                // No filters
                List<Object[]> results = analyticsRepository.getAssetAging();
                for (Object[] result : results) {
                    String ageRange = (String) result[0];
                    Long count = (Long) result[1];
                    
                    AssetAnalyticsSummaryDTO.AssetAgingDTO agingDTO = 
                        AssetAnalyticsSummaryDTO.AssetAgingDTO.builder()
                            .ageRange(ageRange)
                            .count(count)
                            .build();
                    
                    agingData.add(agingDTO);
                }
            }
            
            return agingData;
            
        } catch (Exception e) {
            log.error("Error getting asset aging data: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get asset aging data", e);
        }
    }
    
    @Override
    public List<AssetReportDTO> getAssetsByAgeRange(String ageRange, String department, String assetType) {
        log.info("Getting assets by age range: {} with filters - department: {}, assetType: {}", 
                ageRange, department, assetType);
        
        try {
            List<Asset> assets;
            
            if (department != null && !department.trim().isEmpty()) {
                assets = analyticsRepository.getAssetsByAgeRangeAndDepartment(ageRange, department);
            } else if (assetType != null && !assetType.trim().isEmpty()) {
                assets = analyticsRepository.getAssetsByAgeRangeAndAssetType(ageRange, assetType);
            } else {
                assets = analyticsRepository.getAssetsByAgeRange(ageRange);
            }
            
            return assets.stream()
                .map(this::convertToReportDTO)
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            log.error("Error getting assets by age range: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get assets by age range", e);
        }
    }
    
    @Override
    public ByteArrayResource generateCSVReport(String ageRange, String department, String assetType) {
        log.info("Generating CSV report with filters - ageRange: {}, department: {}, assetType: {}", 
                ageRange, department, assetType);
        
        try {
            List<AssetReportDTO> assets = getAssetsByAgeRange(ageRange, department, assetType);
            return generateCSVFromAssets(assets);
            
        } catch (Exception e) {
            log.error("Error generating CSV report: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate CSV report", e);
        }
    }
    
    @Override
    public ByteArrayResource generateFullCSVReport() {
        log.info("Generating full CSV report");
        
        try {
            List<Asset> assets = analyticsRepository.findAll().stream()
                .filter(asset -> !asset.getDeleted())
                .collect(Collectors.toList());
            
            List<AssetReportDTO> reportDTOs = assets.stream()
                .map(this::convertToReportDTO)
                .collect(Collectors.toList());
            
            return generateCSVFromAssets(reportDTOs);
            
        } catch (Exception e) {
            log.error("Error generating full CSV report: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate full CSV report", e);
        }
    }
    
    private AssetReportDTO convertToReportDTO(Asset asset) {
        AssetReportDTO.AssetReportDTOBuilder builder = AssetReportDTO.builder()
            .assetId(asset.getAssetId())
            .name(asset.getName())
            .serialNumber(asset.getSerialNumber())
            .itAssetCode(asset.getItAssetCode())
            .status(asset.getStatus())
            .assetCategory(asset.getAssetCategory())
            .inventoryLocation(asset.getInventoryLocation())
            .poNumber(asset.getPoNumber())
            .invoiceNumber(asset.getInvoiceNumber())
            .acquisitionDate(asset.getAcquisitionDate())
            .acquisitionPrice(asset.getAcquisitionPrice())
            .currentPrice(asset.getCurrentPrice())
            .ownerType(asset.getOwnerType())
            .acquisitionType(asset.getAcquisitionType())
            .warrantyExpiry(asset.getWarrantyExpiry())
            .extendedWarrantyExpiry(asset.getExtendedWarrantyExpiry())
            .warrantyStatus(asset.getWarrantyStatus())
            .macAddress(asset.getMacAddress())
            .ipv4Address(asset.getIpv4Address())
            .createdAt(asset.getCreatedAt())
            .updatedAt(asset.getUpdatedAt())
            .licenseName(asset.getLicenseName())
            .licenseValidityPeriod(asset.getLicenseValidityPeriod())
            
            .licenseStatus(asset.getLicenseStatus())
            .leaseEndDate(asset.getLeaseEndDate())
            .rentalAmount(asset.getRentalAmount())
            .minContractPeriod(asset.getMinContractPeriod());
        
        // Set asset type info
        if (asset.getAssetType() != null) {
            builder.assetTypeName(asset.getAssetType().getName());
        }
        
        // Set make info
        if (asset.getMake() != null) {
            builder.makeName(asset.getMake().getName());
        }
        
        // Set model info
        if (asset.getModel() != null) {
            builder.modelName(asset.getModel().getName());
        }
        
        // Set current user info
        if (asset.getCurrentUser() != null) {
            builder.currentUserName(asset.getCurrentUser().getFullNameOrOfficeName())
                   .currentUserDepartment(asset.getCurrentUser().getDepartment())
                   .currentUserDesignation(asset.getCurrentUser().getDesignation());
        }
        
        // Set OS info
        if (asset.getOs() != null) {
            builder.osName(asset.getOs().getOsType());
        }
        
        if (asset.getOsVersion() != null) {
            builder.osVersion(asset.getOsVersion().getVersionNumber());
        }
        
        // Set vendor info
        if (asset.getVendor() != null) {
            builder.vendorName(asset.getVendor().getName());
        }
        
        // Calculate age range and days
        if (asset.getAcquisitionDate() != null) {
            long daysBetween = ChronoUnit.DAYS.between(asset.getAcquisitionDate(), LocalDate.now());
            builder.ageInDays(daysBetween);
            
            if (daysBetween < 365) {
                builder.ageRange("<1 year");
            } else if (daysBetween < 730) {
                builder.ageRange("1-2 years");
            } else if (daysBetween < 1095) {
                builder.ageRange("2-3 years");
            } else {
                builder.ageRange(">3 years");
            }
        } else {
            builder.ageRange("Unknown");
            builder.ageInDays(0L);
        }
        
        // Set assigned tags
        if (asset.getAssignedTags() != null && !asset.getAssignedTags().isEmpty()) {
            String tags = asset.getAssignedTags().stream()
                .map(tag -> tag.getName())
                .collect(Collectors.joining(", "));
            builder.assignedTags(tags);
        }
        
        return builder.build();
    }
    
    private ByteArrayResource generateCSVFromAssets(List<AssetReportDTO> assets) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        
        try (OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8)) {
            // Write CSV header
            writer.write("Asset ID,Name,Serial Number,IT Asset Code,Status,Category,Asset Type,Make,Model,");
            writer.write("Current User,Department,Designation,Location,OS,OS Version,PO Number,Invoice Number,");
            writer.write("Acquisition Date,Acquisition Price,Current Price,Owner Type,Acquisition Type,");
            writer.write("Warranty Expiry,Extended Warranty Expiry,Warranty Status,Vendor,MAC Address,IPv4 Address,");
            writer.write("Age Range,Age in Days,Assigned Tags,License Name,License Validity,");
            writer.write("License Status,Lease End Date,Rental Amount,Min Contract Period,Created At,Updated At\n");
            
            // Write data rows
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            
            for (AssetReportDTO asset : assets) {
                writer.write(String.format("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
                    escapeCsvValue(asset.getAssetId()),
                    escapeCsvValue(asset.getName()),
                    escapeCsvValue(asset.getSerialNumber()),
                    escapeCsvValue(asset.getItAssetCode()),
                    escapeCsvValue(asset.getStatus()),
                    escapeCsvValue(asset.getAssetCategory()),
                    escapeCsvValue(asset.getAssetTypeName()),
                    escapeCsvValue(asset.getMakeName()),
                    escapeCsvValue(asset.getModelName()),
                    escapeCsvValue(asset.getCurrentUserName()),
                    escapeCsvValue(asset.getCurrentUserDepartment()),
                    escapeCsvValue(asset.getCurrentUserDesignation()),
                    escapeCsvValue(asset.getInventoryLocation()),
                    escapeCsvValue(asset.getOsName()),
                    escapeCsvValue(asset.getOsVersion()),
                    escapeCsvValue(asset.getPoNumber()),
                    escapeCsvValue(asset.getInvoiceNumber()),
                    escapeCsvValue(asset.getAcquisitionDate() != null ? asset.getAcquisitionDate().format(dateFormatter) : ""),
                    escapeCsvValue(asset.getAcquisitionPrice()),
                    escapeCsvValue(asset.getCurrentPrice()),
                    escapeCsvValue(asset.getOwnerType()),
                    escapeCsvValue(asset.getAcquisitionType()),
                    escapeCsvValue(asset.getWarrantyExpiry() != null ? asset.getWarrantyExpiry().format(dateFormatter) : ""),
                    escapeCsvValue(asset.getExtendedWarrantyExpiry() != null ? asset.getExtendedWarrantyExpiry().format(dateFormatter) : ""),
                    escapeCsvValue(asset.getWarrantyStatus()),
                    escapeCsvValue(asset.getVendorName()),
                    escapeCsvValue(asset.getMacAddress()),
                    escapeCsvValue(asset.getIpv4Address()),
                    escapeCsvValue(asset.getAgeRange()),
                    escapeCsvValue(asset.getAgeInDays()),
                    escapeCsvValue(asset.getAssignedTags()),
                    escapeCsvValue(asset.getLicenseName()),
                    escapeCsvValue(asset.getLicenseValidityPeriod() != null ? asset.getLicenseValidityPeriod().format(dateFormatter) : ""),
    
                    escapeCsvValue(asset.getLicenseStatus()),
                    escapeCsvValue(asset.getLeaseEndDate() != null ? asset.getLeaseEndDate().format(dateFormatter) : ""),
                    escapeCsvValue(asset.getRentalAmount()),
                    escapeCsvValue(asset.getMinContractPeriod()),
                    escapeCsvValue(asset.getCreatedAt() != null ? asset.getCreatedAt().format(dateTimeFormatter) : ""),
                    escapeCsvValue(asset.getUpdatedAt() != null ? asset.getUpdatedAt().format(dateTimeFormatter) : "")
                ));
            }
        }
        
        return new ByteArrayResource(outputStream.toByteArray());
    }
    
    private String escapeCsvValue(Object value) {
        if (value == null) {
            return "";
        }
        
        String str = value.toString();
        if (str.contains(",") || str.contains("\"") || str.contains("\n")) {
            return "\"" + str.replace("\"", "\"\"") + "\"";
        }
        return str;
    }
} 