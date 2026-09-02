import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, switchMap, throwError } from 'rxjs';
import { Exam } from '../exams/exam';
import { Patient } from '../patients/patient';
import { ExamStatus, ExamView, Modality, PatientSummary, ScheduleExamRequest } from './schedule';

interface ScheduleExamResponse {
  examId: number;
  status: ExamStatus;
  scheduleId: number;
  scheduledStart: string;
  stationAeTitle: string;
  createdAt: string;
  updatedAt: string;
}

interface WorklistResponse {
  patientId: number;
  medicalRecordNumber: string;
  patientFirstName: string;
  patientLastName: string;
  examId: number;
  accessionNumber: string;
  requestedProcedure: string;
  modality: Modality;
  status: 'SCHEDULED';
  scheduledStart: string;
  stationAeTitle: string;
}

interface ApiErrorResponse {
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ScheduleApi {
  private readonly http = inject(HttpClient);
  private readonly examsUrl = '/api/exams';

  listExams(): Observable<ExamView[]> {
    return forkJoin({
      exams: this.http.get<Exam[]>(this.examsUrl),
      patients: this.http.get<Patient[]>('/api/patients'),
      worklist: this.http.get<WorklistResponse[]>('/api/worklist'),
    }).pipe(
      map(({ exams, patients, worklist }) => this.toExamViews(exams, patients, worklist)),
      catchError((error: unknown) => this.toApplicationError(error)),
    );
  }

  schedule(examId: number, request: ScheduleExamRequest): Observable<ExamView> {
    return this.saveSchedule(examId, request);
  }

  reschedule(examId: number, request: ScheduleExamRequest): Observable<ExamView> {
    return this.saveSchedule(examId, request);
  }

  cancel(examId: number): Observable<ExamView> {
    return this.http.post<Exam>(`${this.examsUrl}/${examId}/cancel`, null).pipe(
      switchMap(() => this.reloadExam(examId)),
      catchError((error: unknown) => this.toApplicationError(error)),
    );
  }

  private saveSchedule(examId: number, request: ScheduleExamRequest): Observable<ExamView> {
    return this.http.put<ScheduleExamResponse>(`${this.examsUrl}/${examId}/schedule`, request).pipe(
      switchMap(() => this.reloadExam(examId)),
      catchError((error: unknown) => this.toApplicationError(error)),
    );
  }

  private reloadExam(examId: number): Observable<ExamView> {
    return this.listExams().pipe(
      map((exams) => {
        const exam = exams.find((candidate) => candidate.id === examId);
        if (!exam) {
          throw new Error(`Exam ${examId} was not returned after it was updated.`);
        }
        return exam;
      }),
    );
  }

  private toExamViews(
    exams: Exam[],
    patients: Patient[],
    worklist: WorklistResponse[],
  ): ExamView[] {
    const patientsById = new Map(patients.map((patient) => [patient.id, patient]));
    const worklistByExamId = new Map(worklist.map((item) => [item.examId, item]));

    return exams.map((exam) => {
      const patient = patientsById.get(exam.patientId);
      if (!patient) {
        throw new Error(`Patient ${exam.patientId} for exam ${exam.id} was not returned.`);
      }

      const worklistItem = worklistByExamId.get(exam.id);
      return {
        id: exam.id,
        accessionNumber: exam.accessionNumber,
        requestedProcedure: exam.requestedProcedure,
        modality: exam.modality,
        status: exam.status,
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
        patient: this.toPatientSummary(patient),
        schedule: worklistItem
          ? {
              scheduledStart: worklistItem.scheduledStart,
              stationAeTitle: worklistItem.stationAeTitle,
            }
          : null,
      };
    });
  }

  private toPatientSummary(patient: Patient): PatientSummary {
    return {
      id: patient.id,
      medicalRecordNumber: patient.medicalRecordNumber,
      firstName: patient.firstName,
      lastName: patient.lastName,
    };
  }

  private toApplicationError(error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      const response = error.error as ApiErrorResponse | null;
      const message = response?.message?.trim();
      return throwError(
        () => new Error(message || 'The scheduling request could not be completed.'),
      );
    }
    return throwError(() =>
      error instanceof Error ? error : new Error('The scheduling request could not be completed.'),
    );
  }
}
