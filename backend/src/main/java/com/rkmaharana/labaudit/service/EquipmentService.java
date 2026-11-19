package com.rkmaharana.labaudit.service;

import com.rkmaharana.labaudit.dto.CalibrationUpdateRequest;
import com.rkmaharana.labaudit.dto.EquipmentCreateRequest;
import com.rkmaharana.labaudit.exception.ResourceNotFoundException;
import com.rkmaharana.labaudit.model.Equipment;
import com.rkmaharana.labaudit.model.EquipmentStatus;
import com.rkmaharana.labaudit.repository.EquipmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;

    public List<Equipment> getAllEquipment() {
        return equipmentRepository.findAll();
    }

    public Equipment getEquipmentById(String id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with ID: " + id));
    }

    public Equipment createEquipment(EquipmentCreateRequest request, String performedBy) {
        if (equipmentRepository.existsByAssetTag(request.getAssetTag())) {
            throw new IllegalArgumentException("Equipment with asset tag already exists: " + request.getAssetTag());
        }

        Equipment equipment = Equipment.builder()
                .assetTag(request.getAssetTag())
                .name(request.getName())
                .category(request.getCategory())
                .serialNumber(request.getSerialNumber())
                .lastCalibratedDate(request.getLastCalibratedDate())
                .calibrationDueDate(request.getCalibrationDueDate())
                .status(request.getStatus() != null ? request.getStatus() : EquipmentStatus.ACTIVE)
                .build();

        log.info("Equipment registered: {} by {}", equipment.getAssetTag(), performedBy);
        return equipmentRepository.save(equipment);
    }

    public Equipment renewCalibration(String id, CalibrationUpdateRequest request, String performedBy) {
        Equipment equipment = getEquipmentById(id);

        if (request.getCalibrationDueDate().isBefore(request.getLastCalibratedDate())) {
            throw new IllegalArgumentException("Calibration due date cannot be before last calibrated date");
        }

        equipment.setLastCalibratedDate(request.getLastCalibratedDate());
        equipment.setCalibrationDueDate(request.getCalibrationDueDate());
        equipment.setStatus(EquipmentStatus.ACTIVE);

        log.info("Calibration renewed for {}: new due date {} by {}",
                equipment.getAssetTag(), equipment.getCalibrationDueDate(), performedBy);
        return equipmentRepository.save(equipment);
    }
}
