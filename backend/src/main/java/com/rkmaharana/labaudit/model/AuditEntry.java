package com.rkmaharana.labaudit.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditEntry {

    private AuditAction action;

    private SampleStatus fromStatus;

    private SampleStatus toStatus;

    private String performedBy;

    private String remarks;

    @Builder.Default
    private Instant timestamp = Instant.now();
}
