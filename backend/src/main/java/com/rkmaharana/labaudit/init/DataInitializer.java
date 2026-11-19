package com.rkmaharana.labaudit.init;

import com.rkmaharana.labaudit.model.AuditAction;
import com.rkmaharana.labaudit.model.AuditEntry;
import com.rkmaharana.labaudit.model.Equipment;
import com.rkmaharana.labaudit.model.EquipmentStatus;
import com.rkmaharana.labaudit.model.Role;
import com.rkmaharana.labaudit.model.Sample;
import com.rkmaharana.labaudit.model.SampleStatus;
import com.rkmaharana.labaudit.model.User;
import com.rkmaharana.labaudit.repository.EquipmentRepository;
import com.rkmaharana.labaudit.repository.SampleRepository;
import com.rkmaharana.labaudit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EquipmentRepository equipmentRepository;
    private final SampleRepository sampleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsers();
        seedEquipment();
        seedSamples();
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            log.info("Seeding initial users...");

            User admin = User.builder()
                    .username("admin")
                    .email("admin@labaudit.local")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .active(true)
                    .createdAt(Instant.now())
                    .build();

            User tech = User.builder()
                    .username("tech_arjun")
                    .email("arjun@labaudit.local")
                    .passwordHash(passwordEncoder.encode("tech123"))
                    .role(Role.TECHNICIAN)
                    .active(true)
                    .createdAt(Instant.now())
                    .build();

            User reviewer = User.builder()
                    .username("reviewer_sarah")
                    .email("sarah@labaudit.local")
                    .passwordHash(passwordEncoder.encode("reviewer123"))
                    .role(Role.REVIEWER)
                    .active(true)
                    .createdAt(Instant.now())
                    .build();

            userRepository.saveAll(List.of(admin, tech, reviewer));
            log.info("Seeded 3 users: admin, tech_arjun, reviewer_sarah");
        }
    }

    private void seedEquipment() {
        if (equipmentRepository.count() == 0) {
            log.info("Seeding initial equipment inventory...");

            Equipment eq1 = Equipment.builder()
                    .assetTag("UT-NDT-04")
                    .name("Ultrasonic Flaw Detector")
                    .category("NDT")
                    .serialNumber("SN-994821")
                    .lastCalibratedDate(LocalDate.now().minusMonths(3))
                    .calibrationDueDate(LocalDate.now().plusMonths(9))
                    .status(EquipmentStatus.ACTIVE)
                    .build();

            Equipment eq2 = Equipment.builder()
                    .assetTag("EXP-MIC-01")
                    .name("Expired Digital Caliper")
                    .category("Metrology")
                    .serialNumber("SN-CAL-0012")
                    .lastCalibratedDate(LocalDate.now().minusMonths(14))
                    .calibrationDueDate(LocalDate.now().minusMonths(2)) // Expired!
                    .status(EquipmentStatus.ACTIVE)
                    .build();

            Equipment eq3 = Equipment.builder()
                    .assetTag("SPEC-OPT-02")
                    .name("Optical Emission Spectrometer")
                    .category("Metallurgy")
                    .serialNumber("SN-OES-8819")
                    .lastCalibratedDate(LocalDate.now().minusMonths(1))
                    .calibrationDueDate(LocalDate.now().plusMonths(11))
                    .status(EquipmentStatus.ACTIVE)
                    .build();

            equipmentRepository.saveAll(List.of(eq1, eq2, eq3));
            log.info("Seeded 3 lab instruments (1 intentionally expired for testing compliance guard)");
        }
    }

    private void seedSamples() {
        if (sampleRepository.count() == 0) {
            log.info("Seeding sample test records...");

            Equipment eq1 = equipmentRepository.findByAssetTag("UT-NDT-04").orElse(null);
            String eqId = eq1 != null ? eq1.getId() : null;

            List<AuditEntry> audit1 = new ArrayList<>();
            audit1.add(AuditEntry.builder()
                    .action(AuditAction.SAMPLE_REGISTERED)
                    .fromStatus(null)
                    .toStatus(SampleStatus.RECEIVED)
                    .performedBy("tech_arjun")
                    .remarks("Batch intake verified")
                    .timestamp(Instant.now().minusSeconds(7200))
                    .build());
            audit1.add(AuditEntry.builder()
                    .action(AuditAction.RESULT_SUBMITTED)
                    .fromStatus(SampleStatus.IN_TESTING)
                    .toStatus(SampleStatus.COMPLETED)
                    .performedBy("tech_arjun")
                    .remarks("Measured 12.24 mm using UT-NDT-04")
                    .timestamp(Instant.now().minusSeconds(3600))
                    .build());

            Sample s1 = Sample.builder()
                    .sampleCode("SMP-2026-0142")
                    .batchNumber("BCH-AERO-88")
                    .materialGrade("Ti-6Al-4V")
                    .testMethod("ASTM E114 Ultrasonic Inspection")
                    .unit("mm")
                    .minAllowedValue(12.0)
                    .maxAllowedValue(12.5)
                    .measuredValue(12.24)
                    .outOfRange(false)
                    .equipmentId(eqId)
                    .status(SampleStatus.COMPLETED)
                    .auditTrail(audit1)
                    .createdAt(Instant.now().minusSeconds(7200))
                    .updatedAt(Instant.now().minusSeconds(3600))
                    .build();

            List<AuditEntry> audit2 = new ArrayList<>();
            audit2.add(AuditEntry.builder()
                    .action(AuditAction.SAMPLE_REGISTERED)
                    .fromStatus(null)
                    .toStatus(SampleStatus.RECEIVED)
                    .performedBy("tech_arjun")
                    .remarks("Intake batch verified for aircraft structural fastener")
                    .timestamp(Instant.now().minusSeconds(1800))
                    .build());

            Sample s2 = Sample.builder()
                    .sampleCode("SMP-2026-0143")
                    .batchNumber("BCH-AERO-89")
                    .materialGrade("Inconel 718")
                    .testMethod("Tensile Yield Testing")
                    .unit("MPa")
                    .minAllowedValue(1000.0)
                    .maxAllowedValue(1150.0)
                    .outOfRange(false)
                    .status(SampleStatus.RECEIVED)
                    .auditTrail(audit2)
                    .createdAt(Instant.now().minusSeconds(1800))
                    .updatedAt(Instant.now().minusSeconds(1800))
                    .build();

            sampleRepository.saveAll(List.of(s1, s2));
            log.info("Seeded 2 samples: 1 COMPLETED, 1 RECEIVED");
        }
    }
}
