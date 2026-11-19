package com.rkmaharana.labaudit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestResultRequest {

    @NotBlank(message = "Equipment ID is required")
    private String equipmentId;

    @NotNull(message = "Measured value is required")
    private Double measuredValue;

    private String remarks;
}
