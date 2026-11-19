package com.rkmaharana.labaudit.controller;

import com.rkmaharana.labaudit.dto.ReviewRequest;
import com.rkmaharana.labaudit.dto.SampleCreateRequest;
import com.rkmaharana.labaudit.dto.TestResultRequest;
import com.rkmaharana.labaudit.model.Sample;
import com.rkmaharana.labaudit.model.SampleStatus;
import com.rkmaharana.labaudit.service.SampleService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/samples")
@RequiredArgsConstructor
@Tag(name = "Samples", description = "Endpoints for sample intake, test execution, acceptance validation, and reviews")
@SecurityRequirement(name = "BearerAuth")
public class SampleController {

    private final SampleService sampleService;

    @GetMapping
    @Operation(summary = "Search & filter samples by status, batchNumber, or outOfRange flag")
    public ResponseEntity<List<Sample>> getSamples(
            @RequestParam(required = false) SampleStatus status,
            @RequestParam(required = false) String batchNumber,
            @RequestParam(required = false) Boolean outOfRange) {
        return ResponseEntity.ok(sampleService.findSamples(status, batchNumber, outOfRange));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get aggregated sample counts by status for metrics and dashboard")
    public ResponseEntity<Map<String, Object>> getSampleStats() {
        return ResponseEntity.ok(sampleService.getSampleStats());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve sample details including full immutable audit trail")
    public ResponseEntity<Sample> getSampleById(@PathVariable String id) {
        return ResponseEntity.ok(sampleService.getSampleById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    @Operation(summary = "Register intake of a new test sample (RECEIVED status)")
    public ResponseEntity<Sample> createSample(
            @Valid @RequestBody SampleCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "system";
        return ResponseEntity.status(HttpStatus.CREATED).body(sampleService.createSample(request, username));
    }

    @PostMapping("/{id}/start-test")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    @Operation(summary = "Commence testing on a received or re-test required sample (transitions to IN_TESTING)")
    public ResponseEntity<Sample> startTesting(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "system";
        return ResponseEntity.ok(sampleService.startTesting(id, username));
    }

    @PostMapping("/{id}/results")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Submit test measurement with automatic calibration check & acceptance limit validation")
    public ResponseEntity<Sample> submitTestResult(
            @PathVariable String id,
            @Valid @RequestBody TestResultRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "system";
        return ResponseEntity.ok(sampleService.submitTestResult(id, request, username));
    }

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('REVIEWER', 'ADMIN')")
    @Operation(summary = "Approve (COMPLETED) or request retest (RETEST_REQUIRED) for a pending sample")
    public ResponseEntity<Sample> reviewSample(
            @PathVariable String id,
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "system";
        return ResponseEntity.ok(sampleService.reviewSample(id, request, username));
    }
}
