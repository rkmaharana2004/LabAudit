# LabAudit — Sample & Calibration Management System

A LIMS-inspired full-stack web application built with **Java 8+, Spring Boot, Spring Security (JWT), MongoDB, JUnit 5/Mockito**, and a **React + TypeScript** frontend. Designed to mirror audit-ready laboratory workflows, calibration compliance checks, and role-based quality approvals.

---

## 1. Repository & Monorepo Structure

```text
LabAudit/
├── README.md
├── docker-compose.yml              # Local MongoDB container setup
├── backend/                        # Spring Boot (Java 17 / Java 8+ compatible APIs)
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/rkmaharana/labaudit/
│       │   ├── LabAuditApplication.java
│       │   ├── config/
│       │   │   ├── CorsConfig.java
│       │   │   ├── OpenApiConfig.java
│       │   │   └── SecurityConfig.java
│       │   ├── security/
│       │   │   ├── JwtService.java
│       │   │   ├── JwtAuthenticationFilter.java
│       │   │   └── CustomUserDetailsService.java
│       │   ├── model/
│       │   │   ├── User.java
│       │   │   ├── Equipment.java
│       │   │   ├── Sample.java
│       │   │   └── AuditEntry.java
│       │   ├── dto/
│       │   │   ├── AuthRequest.java
│       │   │   ├── AuthResponse.java
│       │   │   ├── SampleCreateRequest.java
│       │   │   ├── TestResultRequest.java
│       │   │   └── ApiErrorResponse.java
│       │   ├── repository/
│       │   │   ├── UserRepository.java
│       │   │   ├── EquipmentRepository.java
│       │   │   └── SampleRepository.java
│       │   ├── service/
│       │   │   ├── AuthService.java
│       │   │   ├── EquipmentService.java
│       │   │   └── SampleService.java
│       │   ├── controller/
│       │   │   ├── AuthController.java
│       │   │   ├── EquipmentController.java
│       │   │   └── SampleController.java
│       │   └── exception/
│       │       ├── GlobalExceptionHandler.java
│       │       ├── CalibrationExpiredException.java
│       │       └── ResourceNotFoundException.java
│       ├── main/resources/
│       │   └── application.yml
│       └── test/java/com/rkmaharana/labaudit/
│           ├── service/
│           │   └── SampleServiceTest.java
│           └── controller/
│               └── SampleControllerTest.java
└── frontend/                       # React + TypeScript (Vite)
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── api/
        │   └── axiosClient.ts
        ├── types/
        │   └── lab.types.ts
        ├── context/
        │   └── AuthContext.tsx
        ├── components/
        │   ├── Navbar.tsx
        │   ├── ProtectedRoute.tsx
        │   └── StatusBadge.tsx
        └── pages/
            ├── LoginPage.tsx
            ├── DashboardPage.tsx
            ├── SamplesPage.tsx
            ├── SampleDetailPage.tsx
            └── EquipmentPage.tsx
```

---

## 2. Core Domain Rules (Interview Highlights)

1. **Calibration Expiry Guard:** Before a technician can submit a test measurement using an instrument, `SampleService` checks `equipment.getCalibrationDueDate().isBefore(LocalDate.now())`. If expired, it throws `CalibrationExpiredException` (HTTP `422 Unprocessable Entity`), blocking non-compliant data entry.
2. **Automated Acceptance Limit Validation:** Each sample defines `minAllowedValue` and `maxAllowedValue`. When a result is logged, the backend automatically sets `outOfRange = (measuredValue < min || measuredValue > max)` and transitions status to `NON_CONFORMANCE` or `PENDING_REVIEW`.
3. **Immutable Audit Trail:** Every state transition (`RECEIVED` $\rightarrow$ `IN_TESTING` $\rightarrow$ `PENDING_REVIEW` $\rightarrow$ `COMPLETED` / `NON_CONFORMANCE`) appends an embedded `AuditEntry` containing `action`, `fromStatus`, `toStatus`, `performedBy` (username + role), `remarks`, and `timestamp`.
4. **Role-Based Access Control (RBAC):**
   - `TECHNICIAN`: Register samples, start testing, submit test measurements.
   - `REVIEWER`: Approve or reject `PENDING_REVIEW` samples into `COMPLETED` or `RETEST_REQUIRED`.
   - `ADMIN`: Manage users, register lab equipment, and update calibration dates.

---

## 3. MongoDB Document Schemas

### `users` Collection
```json
{
  "_id": "673f10a1b2c3d4e5f6000001",
  "username": "tech_arjun",
  "email": "arjun@labaudit.local",
  "passwordHash": "$2a$10$...",
  "role": "TECHNICIAN",
  "active": true,
  "createdAt": "2026-11-19T10:00:00Z"
}
```

### `equipment` Collection
```json
{
  "_id": "673f10a1b2c3d4e5f6000010",
  "assetTag": "UT-NDT-04",
  "name": "Ultrasonic Flaw Detector",
  "category": "NDT",
  "serialNumber": "SN-994821",
  "lastCalibratedDate": "2026-05-15",
  "calibrationDueDate": "2026-11-30",
  "status": "ACTIVE"
}
```

### `samples` Collection (with Embedded Audit History)
```json
{
  "_id": "673f10a1b2c3d4e5f6000099",
  "sampleCode": "SMP-2026-0142",
  "batchNumber": "BCH-AERO-88",
  "materialGrade": "Ti-6Al-4V",
  "testMethod": "ASTM E114 Ultrasonic Inspection",
  "unit": "mm",
  "minAllowedValue": 12.0,
  "maxAllowedValue": 12.5,
  "measuredValue": 12.24,
  "outOfRange": false,
  "equipmentId": "673f10a1b2c3d4e5f6000010",
  "status": "COMPLETED",
  "auditTrail": [
    {
      "action": "SAMPLE_REGISTERED",
      "fromStatus": null,
      "toStatus": "RECEIVED",
      "performedBy": "tech_arjun",
      "remarks": "Batch intake verified",
      "timestamp": "2026-11-19T11:05:00Z"
    },
    {
      "action": "RESULT_SUBMITTED",
      "fromStatus": "IN_TESTING",
      "toStatus": "PENDING_REVIEW",
      "performedBy": "tech_arjun",
      "remarks": "Measured 12.24 mm using UT-NDT-04",
      "timestamp": "2026-11-19T11:42:00Z"
    }
  ],
  "createdAt": "2026-11-19T11:05:00Z",
  "updatedAt": "2026-11-19T12:10:00Z"
}
```

---

## 4. REST API Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public / Admin | Register user with role |
| `POST` | `/api/v1/auth/login` | Public | Authenticate & return JWT + role |
| `GET` | `/api/v1/equipment` | Authenticated | List all lab instruments + calibration status |
| `POST` | `/api/v1/equipment` | `ADMIN` | Register new calibrated equipment |
| `PATCH` | `/api/v1/equipment/{id}/calibrate` | `ADMIN` | Renew calibration dates |
| `GET` | `/api/v1/samples` | Authenticated | Filter samples by `status`, `batchNumber`, or `outOfRange` |
| `POST` | `/api/v1/samples` | `TECHNICIAN`, `ADMIN` | Intake a new test sample (`RECEIVED`) |
| `POST` | `/api/v1/samples/{id}/results` | `TECHNICIAN` | Submit test measurement (runs calibration + range checks) |
| `PATCH` | `/api/v1/samples/{id}/review` | `REVIEWER`, `ADMIN` | Approve (`COMPLETED`) or request retest (`RETEST_REQUIRED`) |
| `GET` | `/api/v1/samples/stats` | Authenticated | MongoDB aggregation summary by sample status |

---

## 5. Step-by-Step Build Checklist

1. **Bootstrap Backend:** Generate Spring Boot project (`Web`, `Security`, `Data MongoDB`, `Validation`, `Lombok`, `Springdoc OpenAPI`) and verify connection to local MongoDB (`mongodb://localhost:27017/labaudit`).
2. **Security & Exception Layer:** Implement `JwtService`, `JwtAuthenticationFilter`, `SecurityConfig` (with CORS for `http://localhost:5173`), and `@RestControllerAdvice` returning structured `ApiErrorResponse` JSON.
3. **Business Logic & Aggregations:** Implement `SampleService` with Java 8 `Optional` and Streams for filtering/audit formatting, plus `@Aggregation` queries in `SampleRepository` for dashboard counts.
4. **Unit & Slice Tests:** Write JUnit 5 + Mockito tests in `SampleServiceTest` covering:
   - Rejecting test submission when equipment calibration is expired.
   - Flagging `outOfRange = true` when measurement exceeds `maxAllowedValue`.
   - Appending audit entries on every state change.
5. **React + TypeScript Frontend:** Scaffold with `npm create vite@latest frontend -- --template react-ts`, build typed API client (`axiosClient.ts`), login screen, sample workflow table, calibration warning badges, and an audit-trail modal.