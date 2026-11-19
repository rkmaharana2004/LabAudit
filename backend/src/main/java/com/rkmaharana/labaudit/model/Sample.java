package com.rkmaharana.labaudit.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "samples")
public class Sample {

    @Id
    private String id;

    @Indexed(unique = true)
    private String sampleCode;

    @Indexed
    private String batchNumber;

    private String materialGrade;

    private String testMethod;

    private String unit;

    private Double minAllowedValue;

    private Double maxAllowedValue;

    private Double measuredValue;

    @Builder.Default
    private Boolean outOfRange = false;

    private String equipmentId;

    @Indexed
    @Builder.Default
    private SampleStatus status = SampleStatus.RECEIVED;

    @Builder.Default
    private List<AuditEntry> auditTrail = new ArrayList<>();

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
