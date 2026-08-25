import { Injectable } from '@angular/core';
import { defer, delay, Observable, of, throwError } from 'rxjs';
import { ExamStatus, ExamView, Modality, PatientSummary, ScheduleExamRequest } from './schedule';

@Injectable({ providedIn: 'root' })
export class ScheduleApi {
  // Temporary in-memory data source. These methods form the replaceable API boundary; the
  // components can stay unchanged when this implementation moves to HttpClient.
  private exams: ExamView[] = this.createSeedExams();
  private nextScheduleId = 5010;

  listExams(): Observable<ExamView[]> {
    return defer(() => of(this.cloneExams()).pipe(delay(180)));
  }

  schedule(examId: number, request: ScheduleExamRequest): Observable<ExamView> {
    return defer(() => {
      const current = this.exams.find((exam) => exam.id === examId);
      if (!current) return throwError(() => new Error('The exam order was not found.'));
      if (current.status !== 'ORDERED' || current.schedule) {
        return throwError(
          () => new Error('Only an ordered exam without a schedule can be scheduled.'),
        );
      }

      const now = new Date().toISOString();
      const scheduled: ExamView = {
        ...current,
        status: 'SCHEDULED',
        updatedAt: now,
        schedule: {
          id: this.nextScheduleId++,
          scheduledStart: request.scheduledStart,
          stationAeTitle: request.stationAeTitle.trim(),
          createdAt: now,
          updatedAt: now,
        },
      };
      this.replace(scheduled);
      return of(this.clone(scheduled)).pipe(delay(220));
    });
  }

  reschedule(examId: number, request: ScheduleExamRequest): Observable<ExamView> {
    return defer(() => {
      const current = this.exams.find((exam) => exam.id === examId);
      if (!current) return throwError(() => new Error('The scheduled exam was not found.'));
      if (current.status !== 'SCHEDULED' || !current.schedule) {
        return throwError(() => new Error('Only a scheduled exam can be rescheduled.'));
      }

      const now = new Date().toISOString();
      const updated: ExamView = {
        ...current,
        updatedAt: now,
        schedule: {
          ...current.schedule,
          scheduledStart: request.scheduledStart,
          stationAeTitle: request.stationAeTitle.trim(),
          updatedAt: now,
        },
      };
      this.replace(updated);
      return of(this.clone(updated)).pipe(delay(220));
    });
  }

  cancel(examId: number): Observable<ExamView> {
    return defer(() => {
      const current = this.exams.find((exam) => exam.id === examId);
      if (!current) return throwError(() => new Error('The exam was not found.'));
      if (current.status !== 'ORDERED' && current.status !== 'SCHEDULED') {
        return throwError(() => new Error('This exam can no longer be cancelled.'));
      }

      const cancelled: ExamView = {
        ...current,
        status: 'CANCELLED',
        updatedAt: new Date().toISOString(),
      };
      this.replace(cancelled);
      return of(this.clone(cancelled)).pipe(delay(220));
    });
  }

  private replace(updated: ExamView): void {
    this.exams = this.exams.map((exam) => (exam.id === updated.id ? updated : exam));
  }

  private createSeedExams(): ExamView[] {
    const weekStart = this.startOfWeek(new Date());
    const patients: PatientSummary[] = [
      { id: 1, medicalRecordNumber: 'SYN-000001', firstName: 'Qubing', lastName: 'Huo' },
      { id: 2, medicalRecordNumber: 'SYN-000002', firstName: 'Fei', lastName: 'Yue' },
      { id: 3, medicalRecordNumber: 'SYN-000003', firstName: 'Julius', lastName: 'Caesar' },
      { id: 4, medicalRecordNumber: 'SYN-000004', firstName: 'Napoleon', lastName: 'Bonaparte' },
    ];
    const seeds: Array<{
      id: number;
      patient: PatientSummary;
      accession: string;
      procedure: string;
      modality: Modality;
      status: ExamStatus;
      day?: number;
      time?: string;
      station?: string;
    }> = [
      {
        id: 101,
        patient: patients[0],
        accession: 'SYN-ACC-0001',
        procedure: 'CT abdomen',
        modality: 'CT',
        status: 'ORDERED',
      },
      {
        id: 102,
        patient: patients[1],
        accession: 'SYN-ACC-0002',
        procedure: 'Chest X-ray',
        modality: 'DX',
        status: 'SCHEDULED',
        day: 1,
        time: '10:00',
        station: 'XRAY_1',
      },
      {
        id: 103,
        patient: patients[2],
        accession: 'SYN-ACC-0007',
        procedure: 'MRI knee',
        modality: 'MR',
        status: 'SCHEDULED',
        day: 2,
        time: '11:00',
        station: 'MRI_1',
      },
      {
        id: 104,
        patient: patients[3],
        accession: 'SYN-ACC-0008',
        procedure: 'CT chest',
        modality: 'CT',
        status: 'SCHEDULED',
        day: 3,
        time: '12:00',
        station: 'CT_1',
      },
      {
        id: 105,
        patient: patients[0],
        accession: 'SYN-ACC-0009',
        procedure: 'Abdominal ultrasound',
        modality: 'US',
        status: 'SCHEDULED',
        day: 4,
        time: '13:00',
        station: 'US_1',
      },
      {
        id: 106,
        patient: patients[1],
        accession: 'SYN-ACC-0010',
        procedure: 'CT head',
        modality: 'CT',
        status: 'ORDERED',
      },
      {
        id: 107,
        patient: patients[2],
        accession: 'SYN-ACC-0011',
        procedure: 'Wrist X-ray',
        modality: 'DX',
        status: 'ORDERED',
      },
      {
        id: 108,
        patient: patients[3],
        accession: 'SYN-ACC-0012',
        procedure: 'Pelvic ultrasound',
        modality: 'US',
        status: 'CANCELLED',
      },
    ];
    const now = new Date().toISOString();
    return seeds.map((seed, index) => {
      let schedule = null;
      if (seed.day !== undefined && seed.time && seed.station) {
        const scheduledStart = new Date(weekStart);
        scheduledStart.setDate(scheduledStart.getDate() + seed.day);
        const [hours, minutes] = seed.time.split(':').map(Number);
        scheduledStart.setHours(hours, minutes, 0, 0);
        schedule = {
          id: 5001 + index,
          scheduledStart: scheduledStart.toISOString(),
          stationAeTitle: seed.station,
          createdAt: now,
          updatedAt: now,
        };
      }
      return {
        id: seed.id,
        accessionNumber: seed.accession,
        requestedProcedure: seed.procedure,
        modality: seed.modality,
        status: seed.status,
        createdAt: now,
        updatedAt: now,
        patient: { ...seed.patient },
        schedule,
      };
    });
  }

  private startOfWeek(value: Date): Date {
    const start = new Date(value);
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private cloneExams(): ExamView[] {
    return this.exams.map((exam) => this.clone(exam));
  }

  private clone(exam: ExamView): ExamView {
    return {
      ...exam,
      patient: { ...exam.patient },
      schedule: exam.schedule ? { ...exam.schedule } : null,
    };
  }
}
