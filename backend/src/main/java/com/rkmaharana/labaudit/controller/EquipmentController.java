package com.rkmaharana.labaudit.controller;

import com.rkmaharana.labaudit.dto.CalibrationUpdateRequest;
import com.rkmaharana.labaudit.dto.EquipmentCreateRequest;
import com.rkmaharana.labaudit.model.Equipment;
import com.rkmaharana.labaudit.service.EquipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/equipment")
@RequiredArgsConstructor
@Tag(name = "Equipment", description = "Endpoints for managing laboratory instruments and calibration lifecycles")
@SecurityRequirement(name = "BearerAuth")
public class EquipmentController {

    private final EquipmentService equipmentService;

    @GetMapping
    @Operation(summary = "List all lab equipment with calibration details")
    public ResponseEntity<List<Equipment>> getAllEquipment() {
        return ResponseEntity.ok(equipmentService.getAllEquipment());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get single equipment details by ID")
    public ResponseEntity<Equipment> getEquipmentById(@PathVariable String id) {
        return ResponseEntity.ok(equipmentService.getEquipmentById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Register a new calibrated lab instrument (ADMIN only)")
    public ResponseEntity<Equipment> createEquipment(
            @Valid @RequestBody EquipmentCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "system";
        return ResponseEntity.status(HttpStatus.CREATED).body(equipmentService.createEquipment(request, username));
    }

    @PatchMapping("/{id}/calibrate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Renew equipment calibration dates (ADMIN only)")
    public ResponseEntity<Equipment> renewCalibration(
            @PathVariable String id,
            @Valid @RequestBody CalibrationUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "system";
        return ResponseEntity.ok(equipmentService.renewCalibration(id, request, username));
    }
}
