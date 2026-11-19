# LabAudit — Sample & Calibration Management System

A production-grade, LIMS-inspired full-stack web application mirroring audit-ready laboratory workflows, calibration compliance checks, and role-based quality approvals. Compliant with ISO 17025 data integrity principles.

---

## 1. System Architecture

```text
LabAudit/
├── docker-compose.yml              # Local MongoDB 7.0 container setup
├── backend/                        # Spring Boot 3.3.5 / Java 21 REST API
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/rkmaharana/labaudit/
│       │   ├── LabAuditApplication.java
│       │   ├── config/             # SecurityConfig, CorsConfig, OpenApiConfig, MongoConfig
│       │   ├── security/           # JwtService, JwtAuthenticationFilter, CustomUserDetailsService
│       │   ├── model/              # User, Equipment, Sample, AuditEntry
│       │   ├── dto/                # AuthRequest, SampleCreateRequest, TestResultRequest, ApiErrorResponse
│       │   ├── repository/         # UserRepository, EquipmentRepository, SampleRepository
│       │   ├── service/            # AuthService, EquipmentService, SampleService
│       │   ├── controller/         # AuthController, EquipmentController, SampleController
│       │   ├── exception/          # GlobalExceptionHandler, CalibrationExpiredException
│       │   └── init/               # DataInitializer (Automated seeding)
│       └── test/java/com/rkmaharana/labaudit/
│           ├── service/SampleServiceTest.java
│           └── controller/SampleControllerTest.java
└── frontend/                       # React 19 + TypeScript (Vite + Tailwind CSS)
    ├── package.json
    ├── src/
    │   ├── api/axiosClient.ts      # Axios instance with JWT interceptor
    │   ├── types/lab.types.ts      # TypeScript interfaces
    │   ├── context/AuthContext.tsx  # Authentication & RBAC state
    │   ├── components/             # Navbar, ProtectedRoute, StatusBadge, AuditTrailModal
    │   └── pages/                  # LoginPage, DashboardPage, SamplesPage, SampleDetailPage, EquipmentPage
```

---

## 2. Core Domain Rules & Quality Controls

1. **Calibration Expiry Guard:**
   Before a technician can log a test measurement using an instrument, `SampleService` verifies `equipment.getCalibrationDueDate().isBefore(LocalDate.now())`. If expired, it aborts the submission and throws `CalibrationExpiredException` (HTTP `422 Unprocessable Entity`), preventing non-compliant data from entering the system.
2. **Automated Acceptance Limit Validation:**
   Each test sample defines a tolerance range: `minAllowedValue` and `maxAllowedValue`. When a measurement is logged:
   - Within tolerance: flags `outOfRange = false` and transitions status to `PENDING_REVIEW`.
   - Outside tolerance: flags `outOfRange = true` and transitions status to `NON_CONFORMANCE`.
3. **Immutable Audit Trail:**
   Every lifecycle transition (`RECEIVED` $\rightarrow$ `IN_TESTING` $\rightarrow$ `PENDING_REVIEW` $\rightarrow$ `COMPLETED` / `NON_CONFORMANCE` / `RETEST_REQUIRED`) appends an embedded `AuditEntry` containing action, prior status, new status, actor username, detailed remarks, and UTC timestamp.
4. **Role-Based Access Control (RBAC):**
   - `TECHNICIAN`: Intake samples, start test workflows, submit test measurements.
   - `REVIEWER`: Quality review, approve (`COMPLETED`) or request re-testing (`RETEST_REQUIRED`).
   - `ADMIN`: User management, instrument registration, and calibration renewal.

---

## 3. Quickstart & Local Setup

### Prerequisites
- **Java 21 LTS**
- **Node.js 20+** and **npm**
- **Docker & Docker Compose**

### 1. Start MongoDB Container
```bash
docker compose up -d
```
MongoDB will start and listen on `localhost:27017` with persistent storage volume `labaudit_mongodb_data`.

### 2. Start Spring Boot Backend
```bash
cd backend
./mvnw clean spring-boot:run
```
Backend starts on `http://localhost:8080`.
- **Swagger OpenAPI Docs:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI Schema:** [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

### 3. Start React + TypeScript Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend development server starts on `http://localhost:5173`.

---

## 4. Pre-Seeded Demo Accounts

The application automatically seeds three role accounts with out-of-the-box demo credentials on first startup:

| Username | Password | Role | Capabilities |
| :--- | :--- | :--- | :--- |
| `tech_arjun` | `tech123` | `TECHNICIAN` | Sample intake, test execution, measurement entry |
| `reviewer_sarah` | `reviewer123` | `REVIEWER` | Quality approval / rejection disposition |
| `admin` | `admin123` | `ADMIN` | Instrument registration, calibration renewal, full access |

*(Quick-switch buttons are available on the login page for instant role toggling).*

---

## 5. REST API Endpoints

| Method | Endpoint | Access Rule | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new user account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate & issue signed JWT |
| `GET` | `/api/v1/equipment` | Authenticated | List all lab instruments & calibration status |
| `GET` | `/api/v1/equipment/{id}` | Authenticated | Get equipment details by ID |
| `POST` | `/api/v1/equipment` | `ADMIN` | Register new calibrated lab instrument |
| `PATCH` | `/api/v1/equipment/{id}/calibrate` | `ADMIN` | Renew calibration dates |
| `GET` | `/api/v1/samples` | Authenticated | Filter samples by `status`, `batchNumber`, `outOfRange` |
| `GET` | `/api/v1/samples/stats` | Authenticated | MongoDB status aggregation counts |
| `GET` | `/api/v1/samples/{id}` | Authenticated | Retrieve sample details & full audit trail |
| `POST` | `/api/v1/samples` | `TECHNICIAN`, `ADMIN` | Intake a new test sample (`RECEIVED`) |
| `POST` | `/api/v1/samples/{id}/start-test` | `TECHNICIAN`, `ADMIN` | Commence testing (`IN_TESTING`) |
| `POST` | `/api/v1/samples/{id}/results` | `TECHNICIAN` | Submit measurement (triggers calibration + range guard) |
| `PATCH` | `/api/v1/samples/{id}/review` | `REVIEWER`, `ADMIN` | Approve (`COMPLETED`) or reject (`RETEST_REQUIRED`) |

---

## 6. Running Automated Tests

Run the backend unit and slice test suite:
```bash
cd backend
./mvnw clean test
```

Test coverage includes:
- `SampleServiceTest`: Calibration expiry guard rejection (422), range validation (`outOfRange = true/false`), state transitions, and immutable audit logging.
- `SampleControllerTest`: MockMvc slice testing RBAC authorization, role constraints, and status responses.
