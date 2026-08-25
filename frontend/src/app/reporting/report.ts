export type ReportingExamStatus = 'ACQUIRED' | 'REPORTED' | 'COMPLETED';

export type ReportingModality = 'CT' | 'MR' | 'DX' | 'US';

export interface ReportingPatientSummary {
  id: number;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
}

export interface ReportingScheduleSummary {
  scheduledStart: string;
  stationAeTitle: string;
}

export interface SubmittedReport {
  id: number;
  examId: number;
  authorUserId: number;
  reportText: string;
  submittedAt: string;
}

export interface ReportingExamView {
  id: number;
  accessionNumber: string;
  requestedProcedure: string;
  modality: ReportingModality;
  status: ReportingExamStatus;
  createdAt: string;
  updatedAt: string;
  patient: ReportingPatientSummary;
  schedule: ReportingScheduleSummary | null;
  report: SubmittedReport | null;
}

export interface SubmitReportRequest {
  reportText: string;
}

export type ReportViewFilter = 'NEEDS_REPORT' | 'SUBMITTED' | 'COMPLETED';

export function reportingPatientName(patient: ReportingPatientSummary): string {
  return `${patient.firstName} ${patient.lastName}`;
}

export function reportingModalityLabel(modality: ReportingModality): string {
  return (
    {
      CT: 'CT',
      MR: 'MRI',
      DX: 'X-ray',
      US: 'Ultrasound',
    } as const
  )[modality];
}
