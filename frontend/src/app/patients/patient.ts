export type PatientSex = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';

export interface Patient {
  id: number;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: PatientSex;
  createdAt: string;
  updatedAt: string;
}

export interface PatientRequest {
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: PatientSex;
}

export interface ApiError {
  message?: string;
  fieldErrors?: Record<string, string>;
}

const SEX_LABELS: Record<PatientSex, string> = {
  FEMALE: 'Female',
  MALE: 'Male',
  OTHER: 'Other',
  UNKNOWN: 'Unknown',
};

export function patientSexLabel(sex: PatientSex): string {
  return SEX_LABELS[sex];
}

export function patientDisplayName(patient: Patient): string {
  return `${patient.lastName}, ${patient.firstName}`;
}
