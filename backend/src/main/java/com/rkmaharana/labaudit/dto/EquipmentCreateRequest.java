package com.rkmaharana.labaudit.dto;

import com.rkmaharana.labaudit.model.EquipmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentCreateRequest {

    @NotBlank(message = "Asset tag is required")
    private String assetTag;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Serial number is required")
    private String serialNumber;

    @NotNull(message = "Last calibrated date is required")
    private LocalDate lastCalibratedDate;

    @NotNull(message = "Calibration due date is required")
    private LocalDate calibrationDueDate;

    @Builder.Default
    private EquipmentStatus status = EquipmentStatus.ACTIVE;
}
