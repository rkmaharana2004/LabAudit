package com.rkmaharana.labaudit.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "equipment")
public class Equipment {

    @Id
    private String id;

    @Indexed(unique = true)
    private String assetTag;

    private String name;

    private String category;

    private String serialNumber;

    private LocalDate lastCalibratedDate;

    private LocalDate calibrationDueDate;

    @Builder.Default
    private EquipmentStatus status = EquipmentStatus.ACTIVE;
}
