export type Modality = 'CT' | 'MR' | 'DX' | 'US';

export type ExamStatus =
  'ORDERED' | 'SCHEDULED' | 'ACQUIRED' | 'REPORTED' | 'COMPLETED' | 'CANCELLED';

export interface PatientSummary {
  id: number;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
}

export interface ExamScheduleSummary {
  id?: number;
  scheduledStart: string;
  stationAeTitle: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamView {
  id: number;
  accessionNumber: string;
  requestedProcedure: string;
  modality: Modality;
  status: ExamStatus;
  createdAt: string;
  updatedAt: string;
  patient: PatientSummary;
  schedule: ExamScheduleSummary | null;
}

export interface ScheduleExamRequest {
  scheduledStart: string;
  stationAeTitle: string;
}

export const MODALITY_OPTIONS: ReadonlyArray<{ value: Modality; label: string }> = [
  { value: 'CT', label: 'CT' },
  { value: 'MR', label: 'MRI' },
  { value: 'DX', label: 'X-ray' },
  { value: 'US', label: 'Ultrasound' },
];

export function patientName(patient: PatientSummary): string {
  return `${patient.firstName} ${patient.lastName}`;
}

export function localDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function localTimeValue(value: Date): string {
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function localDateTimeToIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}
