package com.rkmaharana.labaudit.service;

import com.rkmaharana.labaudit.dto.ReviewRequest;
import com.rkmaharana.labaudit.dto.SampleCreateRequest;
import com.rkmaharana.labaudit.dto.SampleStatusCountDto;
import com.rkmaharana.labaudit.dto.TestResultRequest;
import com.rkmaharana.labaudit.exception.CalibrationExpiredException;
import com.rkmaharana.labaudit.exception.ResourceNotFoundException;
import com.rkmaharana.labaudit.model.AuditAction;
import com.rkmaharana.labaudit.model.AuditEntry;
import com.rkmaharana.labaudit.model.Equipment;
import com.rkmaharana.labaudit.model.EquipmentStatus;
import com.rkmaharana.labaudit.model.Sample;
import com.rkmaharana.labaudit.model.SampleStatus;
import com.rkmaharana.labaudit.repository.EquipmentRepository;
import com.rkmaharana.labaudit.repository.SampleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SampleService {

    private final SampleRepository sampleRepository;
    private final EquipmentRepository equipmentRepository;
    private final MongoTemplate mongoTemplate;

    public Sample createSample(SampleCreateRequest request, String performedBy) {
        if (sampleRepository.existsBySampleCode(request.getSampleCode())) {
            throw new IllegalArgumentException("Sample code already registered: " + request.getSampleCode());
        }

        if (request.getMinAllowedValue() > request.getMaxAllowedValue()) {
            throw new IllegalArgumentException("minAllowedValue cannot exceed maxAllowedValue");
        }

        AuditEntry initialAudit = AuditEntry.builder()
                .action(AuditAction.SAMPLE_REGISTERED)
                .fromStatus(null)
                .toStatus(SampleStatus.RECEIVED)
                .performedBy(performedBy)
                .remarks(request.getRemarks() != null && !request.getRemarks().isBlank()
                        ? request.getRemarks()
                        : "Batch intake intake and verification completed")
                .timestamp(Instant.now())
                .build();

        List<AuditEntry> auditTrail = new ArrayList<>();
        auditTrail.add(initialAudit);

        Sample sample = Sample.builder()
                .sampleCode(request.getSampleCode())
                .batchNumber(request.getBatchNumber())
                .materialGrade(request.getMaterialGrade())
                .testMethod(request.getTestMethod())
                .unit(request.getUnit())
                .minAllowedValue(request.getMinAllowedValue())
                .maxAllowedValue(request.getMaxAllowedValue())
                .status(SampleStatus.RECEIVED)
                .outOfRange(false)
                .auditTrail(auditTrail)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        log.info("New sample registered: {} by {}", sample.getSampleCode(), performedBy);
        return sampleRepository.save(sample);
    }

    public Sample startTesting(String id, String performedBy) {
        Sample sample = getSampleById(id);

        if (sample.getStatus() != SampleStatus.RECEIVED && sample.getStatus() != SampleStatus.RETEST_REQUIRED) {
            throw new IllegalStateException("Sample cannot begin testing from status: " + sample.getStatus());
        }

        SampleStatus prevStatus = sample.getStatus();
        sample.setStatus(SampleStatus.IN_TESTING);
        sample.setUpdatedAt(Instant.now());

        AuditEntry auditEntry = AuditEntry.builder()
                .action(AuditAction.TEST_STARTED)
                .fromStatus(prevStatus)
                .toStatus(SampleStatus.IN_TESTING)
                .performedBy(performedBy)
                .remarks("Testing process initiated")
                .timestamp(Instant.now())
                .build();

        sample.getAuditTrail().add(auditEntry);
        log.info("Sample {} transitioned to IN_TESTING by {}", sample.getSampleCode(), performedBy);
        return sampleRepository.save(sample);
    }

    public Sample submitTestResult(String id, TestResultRequest request, String performedBy) {
        Sample sample = getSampleById(id);

        // Auto-transition to IN_TESTING if currently in RECEIVED or RETEST_REQUIRED
        SampleStatus fromStatus = sample.getStatus();
        if (fromStatus == SampleStatus.RECEIVED || fromStatus == SampleStatus.RETEST_REQUIRED) {
            fromStatus = SampleStatus.IN_TESTING;
        } else if (fromStatus != SampleStatus.IN_TESTING) {
            throw new IllegalStateException("Results can only be submitted for samples in IN_TESTING status (current: " + fromStatus + ")");
        }

        // Equipment verification
        Equipment equipment = equipmentRepository.findById(request.getEquipmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with ID: " + request.getEquipmentId()));

        if (equipment.getStatus() != EquipmentStatus.ACTIVE) {
            throw new IllegalStateException("Equipment " + equipment.getAssetTag() + " is currently " + equipment.getStatus());
        }

        // Rule 1: Calibration Expiry Guard
        if (equipment.getCalibrationDueDate().isBefore(LocalDate.now())) {
            log.warn("Calibration check failed for instrument {}: expired on {}",
                    equipment.getAssetTag(), equipment.getCalibrationDueDate());
            throw new CalibrationExpiredException(
                    "Equipment " + equipment.getAssetTag() + " calibration expired on "
                            + equipment.getCalibrationDueDate() + ". Testing blocked for non-compliance."
            );
        }

        // Rule 2: Automated Acceptance Limit Validation
        double measured = request.getMeasuredValue();
        boolean isOutOfRange = measured < sample.getMinAllowedValue() || measured > sample.getMaxAllowedValue();
        SampleStatus toStatus = isOutOfRange ? SampleStatus.NON_CONFORMANCE : SampleStatus.PENDING_REVIEW;

        sample.setEquipmentId(equipment.getId());
        sample.setMeasuredValue(measured);
        sample.setOutOfRange(isOutOfRange);
        sample.setStatus(toStatus);
        sample.setUpdatedAt(Instant.now());

        // Rule 3: Immutable Audit Trail
        String defaultRemark = String.format("Measured %.2f %s using %s (%s)",
                measured, sample.getUnit(), equipment.getName(), equipment.getAssetTag());
        String remarks = (request.getRemarks() != null && !request.getRemarks().isBlank())
                ? request.getRemarks()
                : defaultRemark;

        if (isOutOfRange) {
            remarks += String.format(" [OUT OF SPEC: Range is %.2f - %.2f %s]",
                    sample.getMinAllowedValue(), sample.getMaxAllowedValue(), sample.getUnit());
        }

        AuditEntry auditEntry = AuditEntry.builder()
                .action(AuditAction.RESULT_SUBMITTED)
                .fromStatus(fromStatus)
                .toStatus(toStatus)
                .performedBy(performedBy)
                .remarks(remarks)
                .timestamp(Instant.now())
                .build();

        sample.getAuditTrail().add(auditEntry);
        log.info("Test result logged for {}: val={}, outOfRange={}, toStatus={} by {}",
                sample.getSampleCode(), measured, isOutOfRange, toStatus, performedBy);

        return sampleRepository.save(sample);
    }

    public Sample reviewSample(String id, ReviewRequest request, String reviewer) {
        Sample sample = getSampleById(id);

        if (sample.getStatus() != SampleStatus.PENDING_REVIEW && sample.getStatus() != SampleStatus.NON_CONFORMANCE) {
            throw new IllegalStateException("Only samples in PENDING_REVIEW or NON_CONFORMANCE can be reviewed (current: " + sample.getStatus() + ")");
        }

        SampleStatus prevStatus = sample.getStatus();
        SampleStatus newStatus = request.isApproved() ? SampleStatus.COMPLETED : SampleStatus.RETEST_REQUIRED;

        sample.setStatus(newStatus);
        sample.setUpdatedAt(Instant.now());

        AuditEntry auditEntry = AuditEntry.builder()
                .action(AuditAction.SAMPLE_REVIEWED)
                .fromStatus(prevStatus)
                .toStatus(newStatus)
                .performedBy(reviewer)
                .remarks(request.getRemarks())
                .timestamp(Instant.now())
                .build();

        sample.getAuditTrail().add(auditEntry);
        log.info("Sample {} reviewed: from={} to={} by {}", sample.getSampleCode(), prevStatus, newStatus, reviewer);
        return sampleRepository.save(sample);
    }

    public Sample getSampleById(String id) {
        return sampleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sample not found with ID: " + id));
    }

    public List<Sample> findSamples(SampleStatus status, String batchNumber, Boolean outOfRange) {
        Query query = new Query();

        if (status != null) {
            query.addCriteria(Criteria.where("status").is(status));
        }
        if (batchNumber != null && !batchNumber.isBlank()) {
            query.addCriteria(Criteria.where("batchNumber").regex(".*" + batchNumber.trim() + ".*", "i"));
        }
        if (outOfRange != null) {
            query.addCriteria(Criteria.where("outOfRange").is(outOfRange));
        }

        return mongoTemplate.find(query, Sample.class);
    }

    public Map<String, Object> getSampleStats() {
        List<SampleStatusCountDto> statusCounts = sampleRepository.countSamplesByStatus();
        long total = sampleRepository.count();

        Map<String, Long> countMap = new HashMap<>();
        for (SampleStatus status : SampleStatus.values()) {
            countMap.put(status.name(), 0L);
        }

        for (SampleStatusCountDto sc : statusCounts) {
            if (sc.getStatus() != null) {
                countMap.put(sc.getStatus().name(), sc.getCount());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("total", total);
        response.put("byStatus", countMap);
        return response;
    }
}
