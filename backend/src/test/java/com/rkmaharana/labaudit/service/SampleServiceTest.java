package com.rkmaharana.labaudit.service;

import com.rkmaharana.labaudit.dto.ReviewRequest;
import com.rkmaharana.labaudit.dto.SampleCreateRequest;
import com.rkmaharana.labaudit.dto.TestResultRequest;
import com.rkmaharana.labaudit.exception.CalibrationExpiredException;
import com.rkmaharana.labaudit.model.AuditAction;
import com.rkmaharana.labaudit.model.Equipment;
import com.rkmaharana.labaudit.model.EquipmentStatus;
import com.rkmaharana.labaudit.model.Sample;
import com.rkmaharana.labaudit.model.SampleStatus;
import com.rkmaharana.labaudit.repository.EquipmentRepository;
import com.rkmaharana.labaudit.repository.SampleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SampleServiceTest {

    @Mock
    private SampleRepository sampleRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private SampleService sampleService;

    private Sample sample;
    private Equipment validEquipment;
    private Equipment expiredEquipment;

    @BeforeEach
    void setUp() {
        sample = Sample.builder()
                .id("sample-123")
                .sampleCode("SMP-2026-0001")
                .batchNumber("BCH-001")
                .materialGrade("Ti-6Al-4V")
                .testMethod("ASTM E114")
                .unit("mm")
                .minAllowedValue(10.0)
                .maxAllowedValue(15.0)
                .status(SampleStatus.IN_TESTING)
                .auditTrail(new ArrayList<>())
                .build();

        validEquipment = Equipment.builder()
                .id("eq-valid")
                .assetTag("UT-NDT-04")
                .name("Ultrasonic Flaw Detector")
                .lastCalibratedDate(LocalDate.now().minusMonths(1))
                .calibrationDueDate(LocalDate.now().plusMonths(5))
                .status(EquipmentStatus.ACTIVE)
                .build();

        expiredEquipment = Equipment.builder()
                .id("eq-expired")
                .assetTag("EXP-CAL-01")
                .name("Expired Gauge")
                .lastCalibratedDate(LocalDate.now().minusMonths(14))
                .calibrationDueDate(LocalDate.now().minusDays(5)) // Expired!
                .status(EquipmentStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("Sample intake initializes RECEIVED status and appends initial audit entry")
    void createSample_Success_AppendsAuditEntry() {
        SampleCreateRequest request = SampleCreateRequest.builder()
                .sampleCode("SMP-NEW-01")
                .batchNumber("BCH-NEW")
                .materialGrade("Al-7075")
                .testMethod("Hardness Test")
                .unit("HRB")
                .minAllowedValue(80.0)
                .maxAllowedValue(90.0)
                .remarks("Intake note")
                .build();

        when(sampleRepository.existsBySampleCode("SMP-NEW-01")).thenReturn(false);
        when(sampleRepository.save(any(Sample.class))).thenAnswer(inv -> inv.getArgument(0));

        Sample result = sampleService.createSample(request, "tech_arjun");

        assertThat(result.getStatus()).isEqualTo(SampleStatus.RECEIVED);
        assertThat(result.getAuditTrail()).hasSize(1);
        assertThat(result.getAuditTrail().get(0).getAction()).isEqualTo(AuditAction.SAMPLE_REGISTERED);
        assertThat(result.getAuditTrail().get(0).getPerformedBy()).isEqualTo("tech_arjun");
        verify(sampleRepository).save(any(Sample.class));
    }

    @Test
    @DisplayName("Calibration Expiry Guard: Throws CalibrationExpiredException when equipment calibration is overdue")
    void submitTestResult_ExpiredCalibration_ThrowsCalibrationExpiredException() {
        TestResultRequest request = TestResultRequest.builder()
                .equipmentId("eq-expired")
                .measuredValue(12.5)
                .build();

        when(sampleRepository.findById("sample-123")).thenReturn(Optional.of(sample));
        when(equipmentRepository.findById("eq-expired")).thenReturn(Optional.of(expiredEquipment));

        assertThatThrownBy(() -> sampleService.submitTestResult("sample-123", request, "tech_arjun"))
                .isInstanceOf(CalibrationExpiredException.class)
                .hasMessageContaining("calibration expired");
    }

    @Test
    @DisplayName("Automated Range Check: Flags outOfRange = true and status = NON_CONFORMANCE when measured value exceeds max")
    void submitTestResult_ValueExceedsMax_SetsOutOfRangeAndNonConformance() {
        TestResultRequest request = TestResultRequest.builder()
                .equipmentId("eq-valid")
                .measuredValue(16.5) // Max is 15.0
                .build();

        when(sampleRepository.findById("sample-123")).thenReturn(Optional.of(sample));
        when(equipmentRepository.findById("eq-valid")).thenReturn(Optional.of(validEquipment));
        when(sampleRepository.save(any(Sample.class))).thenAnswer(inv -> inv.getArgument(0));

        Sample result = sampleService.submitTestResult("sample-123", request, "tech_arjun");

        assertThat(result.getOutOfRange()).isTrue();
        assertThat(result.getStatus()).isEqualTo(SampleStatus.NON_CONFORMANCE);
        assertThat(result.getMeasuredValue()).isEqualTo(16.5);
        assertThat(result.getAuditTrail()).hasSize(1);
        assertThat(result.getAuditTrail().get(0).getAction()).isEqualTo(AuditAction.RESULT_SUBMITTED);
        assertThat(result.getAuditTrail().get(0).getToStatus()).isEqualTo(SampleStatus.NON_CONFORMANCE);
    }

    @Test
    @DisplayName("Automated Range Check: Flags outOfRange = true and status = NON_CONFORMANCE when measured value is below min")
    void submitTestResult_ValueBelowMin_SetsOutOfRangeAndNonConformance() {
        TestResultRequest request = TestResultRequest.builder()
                .equipmentId("eq-valid")
                .measuredValue(8.2) // Min is 10.0
                .build();

        when(sampleRepository.findById("sample-123")).thenReturn(Optional.of(sample));
        when(equipmentRepository.findById("eq-valid")).thenReturn(Optional.of(validEquipment));
        when(sampleRepository.save(any(Sample.class))).thenAnswer(inv -> inv.getArgument(0));

        Sample result = sampleService.submitTestResult("sample-123", request, "tech_arjun");

        assertThat(result.getOutOfRange()).isTrue();
        assertThat(result.getStatus()).isEqualTo(SampleStatus.NON_CONFORMANCE);
        assertThat(result.getAuditTrail().get(0).getToStatus()).isEqualTo(SampleStatus.NON_CONFORMANCE);
    }

    @Test
    @DisplayName("Automated Range Check: Compliant value sets outOfRange = false and status = PENDING_REVIEW")
    void submitTestResult_ValueWithinRange_SetsPendingReview() {
        TestResultRequest request = TestResultRequest.builder()
                .equipmentId("eq-valid")
                .measuredValue(12.3) // Range 10.0 - 15.0
                .build();

        when(sampleRepository.findById("sample-123")).thenReturn(Optional.of(sample));
        when(equipmentRepository.findById("eq-valid")).thenReturn(Optional.of(validEquipment));
        when(sampleRepository.save(any(Sample.class))).thenAnswer(inv -> inv.getArgument(0));

        Sample result = sampleService.submitTestResult("sample-123", request, "tech_arjun");

        assertThat(result.getOutOfRange()).isFalse();
        assertThat(result.getStatus()).isEqualTo(SampleStatus.PENDING_REVIEW);
        assertThat(result.getAuditTrail().get(0).getToStatus()).isEqualTo(SampleStatus.PENDING_REVIEW);
    }

    @Test
    @DisplayName("Review Approval: Reviewer approval transitions sample to COMPLETED and appends audit entry")
    void reviewSample_Approve_SetsCompletedAndAppendsAudit() {
        sample.setStatus(SampleStatus.PENDING_REVIEW);

        ReviewRequest request = ReviewRequest.builder()
                .approved(true)
                .remarks("Conforms to quality specifications")
                .build();

        when(sampleRepository.findById("sample-123")).thenReturn(Optional.of(sample));
        when(sampleRepository.save(any(Sample.class))).thenAnswer(inv -> inv.getArgument(0));

        Sample result = sampleService.reviewSample("sample-123", request, "reviewer_sarah");

        assertThat(result.getStatus()).isEqualTo(SampleStatus.COMPLETED);
        assertThat(result.getAuditTrail()).hasSize(1);
        assertThat(result.getAuditTrail().get(0).getAction()).isEqualTo(AuditAction.SAMPLE_REVIEWED);
        assertThat(result.getAuditTrail().get(0).getFromStatus()).isEqualTo(SampleStatus.PENDING_REVIEW);
        assertThat(result.getAuditTrail().get(0).getToStatus()).isEqualTo(SampleStatus.COMPLETED);
        assertThat(result.getAuditTrail().get(0).getPerformedBy()).isEqualTo("reviewer_sarah");
    }

    @Test
    @DisplayName("Review Rejection: Reviewer rejection transitions sample to RETEST_REQUIRED")
    void reviewSample_Reject_SetsRetestRequiredAndAppendsAudit() {
        sample.setStatus(SampleStatus.NON_CONFORMANCE);

        ReviewRequest request = ReviewRequest.builder()
                .approved(false)
                .remarks("Retest with secondary probe required")
                .build();

        when(sampleRepository.findById("sample-123")).thenReturn(Optional.of(sample));
        when(sampleRepository.save(any(Sample.class))).thenAnswer(inv -> inv.getArgument(0));

        Sample result = sampleService.reviewSample("sample-123", request, "reviewer_sarah");

        assertThat(result.getStatus()).isEqualTo(SampleStatus.RETEST_REQUIRED);
        assertThat(result.getAuditTrail().get(0).getToStatus()).isEqualTo(SampleStatus.RETEST_REQUIRED);
    }
}
