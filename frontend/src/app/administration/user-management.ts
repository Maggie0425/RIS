export type RoleCode = 'ADMIN' | 'RECEPTIONIST' | 'TECHNOLOGIST' | 'RADIOLOGIST';

export interface ManagedUser {
  id: number;
  username: string;
  displayName: string;
  enabled: boolean;
  roles: RoleCode[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  displayName: string;
  password: string;
  roles: RoleCode[];
}

export interface ApiError {
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const ROLE_OPTIONS: readonly { value: RoleCode; label: string }[] = [
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'TECHNOLOGIST', label: 'Technologist' },
  { value: 'RADIOLOGIST', label: 'Radiologist' },
];
