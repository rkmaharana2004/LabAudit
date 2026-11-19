package com.rkmaharana.labaudit.dto;

import com.rkmaharana.labaudit.model.SampleStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SampleStatusCountDto {
    private SampleStatus status;
    private long count;
}
