package com.rkmaharana.labaudit.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rkmaharana.labaudit.config.CorsConfig;
import com.rkmaharana.labaudit.config.SecurityConfig;
import com.rkmaharana.labaudit.dto.ReviewRequest;
import com.rkmaharana.labaudit.dto.SampleCreateRequest;
import com.rkmaharana.labaudit.model.Sample;
import com.rkmaharana.labaudit.model.SampleStatus;
import com.rkmaharana.labaudit.security.CustomUserDetailsService;
import com.rkmaharana.labaudit.security.JwtAuthenticationFilter;
import com.rkmaharana.labaudit.security.JwtService;
import com.rkmaharana.labaudit.service.SampleService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SampleController.class)
@Import({SecurityConfig.class, CorsConfig.class, JwtAuthenticationFilter.class})
class SampleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SampleService sampleService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("Sample intake: TECHNICIAN role can create sample (201 Created)")
    @WithMockUser(username = "tech_arjun", roles = {"TECHNICIAN"})
    void createSample_AsTechnician_ReturnsCreated() throws Exception {
        SampleCreateRequest request = SampleCreateRequest.builder()
                .sampleCode("SMP-2026-0099")
                .batchNumber("BCH-TEST")
                .materialGrade("Steel 316L")
                .testMethod("Hardness ASTM")
                .unit("HRC")
                .minAllowedValue(25.0)
                .maxAllowedValue(30.0)
                .remarks("Intake test")
                .build();

        Sample created = Sample.builder()
                .id("sample-id-1")
                .sampleCode("SMP-2026-0099")
                .batchNumber("BCH-TEST")
                .status(SampleStatus.RECEIVED)
                .auditTrail(new ArrayList<>())
                .build();

        when(sampleService.createSample(any(SampleCreateRequest.class), eq("tech_arjun")))
                .thenReturn(created);

        mockMvc.perform(post("/api/v1/samples")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sampleCode").value("SMP-2026-0099"))
                .andExpect(jsonPath("$.status").value("RECEIVED"));
    }

    @Test
    @DisplayName("RBAC Guard: TECHNICIAN role is forbidden from approving/reviewing sample (403 Forbidden)")
    @WithMockUser(username = "tech_arjun", roles = {"TECHNICIAN"})
    void reviewSample_AsTechnician_ReturnsForbidden() throws Exception {
        ReviewRequest request = ReviewRequest.builder()
                .approved(true)
                .remarks("Technician attempting unauthorized approval")
                .build();

        mockMvc.perform(patch("/api/v1/samples/sample-id-1/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("RBAC Guard: REVIEWER role can approve sample (200 OK)")
    @WithMockUser(username = "reviewer_sarah", roles = {"REVIEWER"})
    void reviewSample_AsReviewer_ReturnsOk() throws Exception {
        ReviewRequest request = ReviewRequest.builder()
                .approved(true)
                .remarks("Approved by QC Reviewer")
                .build();

        Sample reviewed = Sample.builder()
                .id("sample-id-1")
                .sampleCode("SMP-2026-0099")
                .status(SampleStatus.COMPLETED)
                .build();

        when(sampleService.reviewSample(eq("sample-id-1"), any(ReviewRequest.class), eq("reviewer_sarah")))
                .thenReturn(reviewed);

        mockMvc.perform(patch("/api/v1/samples/sample-id-1/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    @DisplayName("Authentication Guard: Unauthenticated requests return 401 or 403")
    void getSamples_Unauthenticated_ReturnsUnauthorizedOrForbidden() throws Exception {
        mockMvc.perform(post("/api/v1/samples")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }
}
