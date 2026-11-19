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
public class SampleCreateRequest {

    @NotBlank(message = "Sample code is required")
    private String sampleCode;

    @NotBlank(message = "Batch number is required")
    private String batchNumber;

    @NotBlank(message = "Material grade is required")
    private String materialGrade;

    @NotBlank(message = "Test method is required")
    private String testMethod;

    @NotBlank(message = "Unit is required")
    private String unit;

    @NotNull(message = "Minimum allowed value is required")
    private Double minAllowedValue;

    @NotNull(message = "Maximum allowed value is required")
    private Double maxAllowedValue;

    private String remarks;
}
