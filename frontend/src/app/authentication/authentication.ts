export const PERMISSION_CODES = [
  'PATIENT_READ',
  'PATIENT_WRITE',
  'EXAM_READ',
  'ORDER_CREATE',
  'SCHEDULE_MANAGE',
  'EXAM_CANCEL',
  'WORKLIST_READ',
  'EXAM_ACQUIRE',
  'REPORT_READ',
  'REPORT_WRITE',
  'EXAM_COMPLETE',
  'USER_MANAGE',
  'AUDIT_VIEW',
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

export interface CurrentUser {
  id: number;
  username: string;
  displayName: string;
  roles: string[];
  permissions: PermissionCode[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
  user: CurrentUser;
}

export interface AuthenticationError {
  status: number;
  error: string;
  message: string;
  fieldErrors?: Record<string, string>;
}
