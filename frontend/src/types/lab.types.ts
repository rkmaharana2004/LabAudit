export type Role = 'TECHNICIAN' | 'REVIEWER' | 'ADMIN';

export type EquipmentStatus = 'ACTIVE' | 'OUT_OF_SERVICE';

export type SampleStatus =
  | 'RECEIVED'
  | 'IN_TESTING'
  | 'PENDING_REVIEW'
  | 'COMPLETED'
  | 'NON_CONFORMANCE'
  | 'RETEST_REQUIRED';

export type AuditAction =
  | 'SAMPLE_REGISTERED'
  | 'TEST_STARTED'
  | 'RESULT_SUBMITTED'
  | 'SAMPLE_REVIEWED'
  | 'CALIBRATION_RENEWED';

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  username: string;
  email: string;
  role: Role;
  expiresIn: number;
}

export interface Equipment {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  serialNumber: string;
  lastCalibratedDate: string;
  calibrationDueDate: string;
  status: EquipmentStatus;
}

export interface AuditEntry {
  action: AuditAction;
  fromStatus: SampleStatus | null;
  toStatus: SampleStatus;
  performedBy: string;
  remarks: string;
  timestamp: string;
}

export interface Sample {
  id: string;
  sampleCode: string;
  batchNumber: string;
  materialGrade: string;
  testMethod: string;
  unit: string;
  minAllowedValue: number;
  maxAllowedValue: number;
  measuredValue?: number;
  outOfRange?: boolean;
  equipmentId?: string;
  status: SampleStatus;
  auditTrail: AuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface SampleStats {
  total: number;
  byStatus: Record<SampleStatus, number>;
}

export interface SampleCreateRequest {
  sampleCode: string;
  batchNumber: string;
  materialGrade: string;
  testMethod: string;
  unit: string;
  minAllowedValue: number;
  maxAllowedValue: number;
  remarks?: string;
}

export interface TestResultRequest {
  equipmentId: string;
  measuredValue: number;
  remarks?: string;
}

export interface ReviewRequest {
  approved: boolean;
  remarks: string;
}

export interface EquipmentCreateRequest {
  assetTag: string;
  name: string;
  category: string;
  serialNumber: string;
  lastCalibratedDate: string;
  calibrationDueDate: string;
  status?: EquipmentStatus;
}

export interface CalibrationUpdateRequest {
  lastCalibratedDate: string;
  calibrationDueDate: string;
  remarks?: string;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: Record<string, string>;
}
