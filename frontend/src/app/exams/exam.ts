export type Modality = 'CT' | 'MR' | 'DX' | 'US';

export type ExamStatus =
  | 'ORDERED'
  | 'SCHEDULED'
  | 'ACQUIRED'
  | 'REPORTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Exam {
  id: number;
  patientId: number;
  createdBy: number;
  accessionNumber: string;
  requestedProcedure: string;
  modality: Modality;
  status: ExamStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExamRequest {
  patientId: number;
  requestedProcedure: string;
  modality: Modality;
}

export const MODALITY_OPTIONS: { value: Modality; label: string }[] = [
  { value: 'CT', label: 'CT — Computed tomography' },
  { value: 'MR', label: 'MR — Magnetic resonance' },
  { value: 'DX', label: 'DX — Digital radiography' },
  { value: 'US', label: 'US — Ultrasound' },
];

const STATUS_LABELS: Record<ExamStatus, string> = {
  ORDERED: 'Ordered',
  SCHEDULED: 'Scheduled',
  ACQUIRED: 'Acquired',
  REPORTED: 'Reported',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function modalityLabel(modality: Modality): string {
  return (
    MODALITY_OPTIONS.find((option) => option.value === modality)?.label ??
    modality
  );
}

export function examStatusLabel(status: ExamStatus): string {
  return STATUS_LABELS[status];
}