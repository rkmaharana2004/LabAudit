package com.rkmaharana.labaudit.dto;

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
public class CalibrationUpdateRequest {

    @NotNull(message = "Last calibrated date is required")
    private LocalDate lastCalibratedDate;

    @NotNull(message = "Calibration due date is required")
    private LocalDate calibrationDueDate;

    private String remarks;
}
