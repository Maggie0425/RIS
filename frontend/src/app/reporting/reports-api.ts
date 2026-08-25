import { Injectable } from '@angular/core';
import { defer, delay, Observable, of, throwError } from 'rxjs';
import { ReportingExamView, ReportingPatientSummary, SubmitReportRequest } from './report';

@Injectable({ providedIn: 'root' })
export class ReportsApi {
  // Temporary in-memory boundary. Replace these method bodies with HttpClient calls when the
  // exam/report controllers exist; the page does not need to change.
  private exams = this.createSeedExams();
  private nextReportId = 9003;

  listExams(): Observable<ReportingExamView[]> {
    return defer(() => of(this.cloneExams()).pipe(delay(180)));
  }

  submitReport(examId: number, request: SubmitReportRequest): Observable<ReportingExamView> {
    return defer(() => {
      const exam = this.exams.find((candidate) => candidate.id === examId);
      if (!exam) return throwError(() => new Error('The examination was not found.'));
      if (exam.status !== 'ACQUIRED' || exam.report) {
        return throwError(
          () => new Error('Only an acquired exam without a report can be reported.'),
        );
      }

      const reportText = request.reportText.trim();
      if (!reportText) return throwError(() => new Error('Report text is required.'));

      const now = new Date().toISOString();
      const reported: ReportingExamView = {
        ...exam,
        status: 'REPORTED',
        updatedAt: now,
        report: {
          id: this.nextReportId++,
          examId,
          authorUserId: 4,
          reportText,
          submittedAt: now,
        },
      };
      this.replace(reported);
      return of(this.clone(reported)).pipe(delay(220));
    });
  }

  completeExam(examId: number): Observable<ReportingExamView> {
    return defer(() => {
      const exam = this.exams.find((candidate) => candidate.id === examId);
      if (!exam) return throwError(() => new Error('The examination was not found.'));
      if (exam.status !== 'REPORTED' || !exam.report) {
        return throwError(() => new Error('Only a reported exam can be completed.'));
      }

      const completed: ReportingExamView = {
        ...exam,
        status: 'COMPLETED',
        updatedAt: new Date().toISOString(),
      };
      this.replace(completed);
      return of(this.clone(completed)).pipe(delay(220));
    });
  }

  private replace(updated: ReportingExamView): void {
    this.exams = this.exams.map((exam) => (exam.id === updated.id ? updated : exam));
  }

  private createSeedExams(): ReportingExamView[] {
    const patients: ReportingPatientSummary[] = [
      { id: 1, medicalRecordNumber: 'SYN-000001', firstName: 'Qubing', lastName: 'Huo' },
      { id: 3, medicalRecordNumber: 'SYN-000003', firstName: 'Julius', lastName: 'Caesar' },
      { id: 4, medicalRecordNumber: 'SYN-000004', firstName: 'Napoleon', lastName: 'Bonaparte' },
    ];
    const now = new Date().toISOString();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [
      {
        id: 103,
        accessionNumber: 'SYN-ACC-0003',
        requestedProcedure: 'MRI brain',
        modality: 'MR',
        status: 'ACQUIRED',
        createdAt: now,
        updatedAt: now,
        patient: patients[1],
        schedule: {
          scheduledStart: this.atTime(today, -1, 11).toISOString(),
          stationAeTitle: 'MRI_1',
        },
        report: null,
      },
      {
        id: 104,
        accessionNumber: 'SYN-ACC-0004',
        requestedProcedure: 'CT chest',
        modality: 'CT',
        status: 'REPORTED',
        createdAt: now,
        updatedAt: now,
        patient: patients[2],
        schedule: {
          scheduledStart: this.atTime(today, -2, 12).toISOString(),
          stationAeTitle: 'CT_1',
        },
        report: {
          id: 9001,
          examId: 104,
          authorUserId: 4,
          reportText: 'Synthetic report: no acute abnormality identified.',
          submittedAt: this.atTime(today, -2, 15).toISOString(),
        },
      },
      {
        id: 105,
        accessionNumber: 'SYN-ACC-0005',
        requestedProcedure: 'Abdominal ultrasound',
        modality: 'US',
        status: 'COMPLETED',
        createdAt: now,
        updatedAt: now,
        patient: patients[0],
        schedule: {
          scheduledStart: this.atTime(today, -3, 13).toISOString(),
          stationAeTitle: 'US_1',
        },
        report: {
          id: 9002,
          examId: 105,
          authorUserId: 4,
          reportText: 'Synthetic report: examination completed without significant finding.',
          submittedAt: this.atTime(today, -3, 16).toISOString(),
        },
      },
    ];
  }

  private atTime(day: Date, dayOffset: number, hour: number): Date {
    const value = new Date(day);
    value.setDate(value.getDate() + dayOffset);
    value.setHours(hour, 0, 0, 0);
    return value;
  }

  private cloneExams(): ReportingExamView[] {
    return this.exams.map((exam) => this.clone(exam));
  }

  private clone(exam: ReportingExamView): ReportingExamView {
    return {
      ...exam,
      patient: { ...exam.patient },
      schedule: exam.schedule ? { ...exam.schedule } : null,
      report: exam.report ? { ...exam.report } : null,
    };
  }
}
