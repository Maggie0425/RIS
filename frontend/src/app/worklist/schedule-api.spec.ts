import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable } from 'rxjs';
import { ExamView, ScheduleExamRequest } from './schedule';
import { ScheduleApi } from './schedule-api';

describe('ScheduleApi', () => {
  let api: ScheduleApi;
  let http: HttpTestingController;

  const initialRequest: ScheduleExamRequest = {
    scheduledStart: '2030-01-15T10:30:00Z',
    stationAeTitle: ' CT_TEST ',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ScheduleApi, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ScheduleApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads and combines exams, patients and the active worklist', async () => {
    const result = firstValueFrom(api.listExams());

    flushLoad(
      [examResponse(11, 1, 'ORDERED'), examResponse(12, 2, 'SCHEDULED', 'DX')],
      [patientResponse(1, 'Avery', 'Taylor'), patientResponse(2, 'Jordan', 'Lee')],
      [worklistResponse(12, 2, 'DX', 'XRAY_1', '2030-01-15T10:30:00Z')],
    );

    const exams = await result;
    expect(exams).toHaveLength(2);
    expect(exams[0]).toMatchObject({
      id: 11,
      status: 'ORDERED',
      patient: { id: 1, firstName: 'Avery', lastName: 'Taylor' },
      schedule: null,
    });
    expect(exams[1]).toMatchObject({
      id: 12,
      status: 'SCHEDULED',
      patient: { id: 2, firstName: 'Jordan', lastName: 'Lee' },
      schedule: {
        scheduledStart: '2030-01-15T10:30:00Z',
        stationAeTitle: 'XRAY_1',
      },
    });
  });

  it('schedules an exam through the backend and reloads the persisted result', async () => {
    const result = firstValueFrom(api.schedule(11, initialRequest));

    const update = http.expectOne('/api/exams/11/schedule');
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual(initialRequest);
    update.flush(scheduleResponse(11, 501, 'CT_TEST', initialRequest.scheduledStart));

    flushLoad(
      [examResponse(11, 1, 'SCHEDULED')],
      [patientResponse(1, 'Avery', 'Taylor')],
      [worklistResponse(11, 1, 'CT', 'CT_TEST', initialRequest.scheduledStart)],
    );

    const scheduled = await result;
    expect(scheduled.status).toBe('SCHEDULED');
    expect(scheduled.schedule).toEqual({
      scheduledStart: initialRequest.scheduledStart,
      stationAeTitle: 'CT_TEST',
    });
  });

  it('reschedules through the same endpoint and returns the new worklist values', async () => {
    const request: ScheduleExamRequest = {
      scheduledStart: '2030-02-20T14:00:00Z',
      stationAeTitle: 'XRAY_2',
    };
    const result = firstValueFrom(api.reschedule(12, request));

    const update = http.expectOne('/api/exams/12/schedule');
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual(request);
    update.flush(scheduleResponse(12, 502, 'XRAY_2', request.scheduledStart));

    flushLoad(
      [examResponse(12, 2, 'SCHEDULED', 'DX')],
      [patientResponse(2, 'Jordan', 'Lee')],
      [worklistResponse(12, 2, 'DX', 'XRAY_2', request.scheduledStart)],
    );

    expect((await result).schedule).toEqual({
      scheduledStart: request.scheduledStart,
      stationAeTitle: 'XRAY_2',
    });
  });

  it('cancels an exam and reloads it without an active worklist schedule', async () => {
    const result = firstValueFrom(api.cancel(12));

    const update = http.expectOne('/api/exams/12/cancel');
    expect(update.request.method).toBe('POST');
    expect(update.request.body).toBeNull();
    update.flush(examResponse(12, 2, 'CANCELLED', 'DX'));

    flushLoad([examResponse(12, 2, 'CANCELLED', 'DX')], [patientResponse(2, 'Jordan', 'Lee')], []);

    const cancelled = await result;
    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.schedule).toBeNull();
  });

  it('surfaces the backend lifecycle error message', async () => {
    const message = readError(api.schedule(13, initialRequest));

    http
      .expectOne('/api/exams/13/schedule')
      .flush(
        { message: 'Cannot transition exam from ACQUIRED to SCHEDULED.' },
        { status: 409, statusText: 'Conflict' },
      );

    expect(await message).toBe('Cannot transition exam from ACQUIRED to SCHEDULED.');
  });

  function flushLoad(exams: object[], patients: object[], worklist: object[]): void {
    const examRequest = http.expectOne('/api/exams');
    const patientRequest = http.expectOne('/api/patients');
    const worklistRequest = http.expectOne('/api/worklist');
    expect(examRequest.request.method).toBe('GET');
    expect(patientRequest.request.method).toBe('GET');
    expect(worklistRequest.request.method).toBe('GET');
    examRequest.flush(exams);
    patientRequest.flush(patients);
    worklistRequest.flush(worklist);
  }
});

function examResponse(id: number, patientId: number, status: string, modality = 'CT'): object {
  return {
    id,
    patientId,
    createdBy: 2,
    accessionNumber: `SYN-ACC-${String(id).padStart(4, '0')}`,
    requestedProcedure: `${modality} test`,
    modality,
    status,
    createdAt: '2030-01-01T00:00:00Z',
    updatedAt: '2030-01-02T00:00:00Z',
  };
}

function patientResponse(id: number, firstName: string, lastName: string): object {
  return {
    id,
    medicalRecordNumber: `SYN-${String(id).padStart(6, '0')}`,
    firstName,
    lastName,
    dateOfBirth: '1990-04-15',
    sex: 'UNKNOWN',
    createdAt: '2030-01-01T00:00:00Z',
    updatedAt: '2030-01-01T00:00:00Z',
  };
}

function worklistResponse(
  examId: number,
  patientId: number,
  modality: string,
  stationAeTitle: string,
  scheduledStart: string,
): object {
  return {
    patientId,
    medicalRecordNumber: `SYN-${String(patientId).padStart(6, '0')}`,
    patientFirstName: 'Synthetic',
    patientLastName: 'Patient',
    patientDateOfBirth: '1990-04-15',
    patientSex: 'UNKNOWN',
    examId,
    accessionNumber: `SYN-ACC-${String(examId).padStart(4, '0')}`,
    requestedProcedure: `${modality} test`,
    modality,
    status: 'SCHEDULED',
    scheduledStart,
    stationAeTitle,
  };
}

function scheduleResponse(
  examId: number,
  scheduleId: number,
  stationAeTitle: string,
  scheduledStart: string,
): object {
  return {
    examId,
    status: 'SCHEDULED',
    scheduleId,
    scheduledStart,
    stationAeTitle,
    createdAt: '2030-01-01T00:00:00Z',
    updatedAt: '2030-01-02T00:00:00Z',
  };
}

async function readError(source: Observable<ExamView>): Promise<string> {
  try {
    await firstValueFrom(source);
    return 'Observable completed successfully.';
  } catch (error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
