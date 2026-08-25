import { firstValueFrom, Observable } from 'rxjs';
import { ExamView, ScheduleExamRequest } from './schedule';
import { ScheduleApi } from './schedule-api';

describe('ScheduleApi', () => {
  let api: ScheduleApi;

  const initialRequest: ScheduleExamRequest = {
    scheduledStart: '2030-01-15T10:30:00.000Z',
    stationAeTitle: '  CT_TEST  ',
  };

  beforeEach(() => {
    api = new ScheduleApi();
  });

  it('lists seeded exams as defensive copies', async () => {
    const firstList = await firstValueFrom(api.listExams());

    expect(firstList.length).toBe(8);
    expect(firstList.some((exam) => exam.status === 'ORDERED')).toBe(true);
    expect(firstList.some((exam) => exam.status === 'SCHEDULED')).toBe(true);

    firstList[0].patient.firstName = 'Changed';
    const scheduledExam = firstList.find((exam) => exam.schedule !== null);
    if (!scheduledExam?.schedule) {
      throw new Error('Expected a seeded scheduled exam.');
    }
    scheduledExam.schedule.stationAeTitle = 'CHANGED';

    const secondList = await firstValueFrom(api.listExams());
    expect(secondList[0].patient.firstName).not.toBe('Changed');
    expect(
      secondList.find((exam) => exam.id === scheduledExam.id)?.schedule?.stationAeTitle,
    ).not.toBe('CHANGED');
  });

  it('schedules an ordered exam and persists the updated state', async () => {
    const scheduled = await firstValueFrom(api.schedule(101, initialRequest));

    expect(scheduled.id).toBe(101);
    expect(scheduled.status).toBe('SCHEDULED');
    expect(scheduled.schedule?.scheduledStart).toBe(initialRequest.scheduledStart);
    expect(scheduled.schedule?.stationAeTitle).toBe('CT_TEST');

    const stored = (await firstValueFrom(api.listExams())).find((exam) => exam.id === 101);
    expect(stored?.status).toBe('SCHEDULED');
    expect(stored?.schedule?.stationAeTitle).toBe('CT_TEST');
  });

  it('rejects scheduling an exam that is not an unscheduled order', async () => {
    const message = await readError(api.schedule(102, initialRequest));

    expect(message).toBe('Only an ordered exam without a schedule can be scheduled.');
  });

  it('reschedules an existing appointment without replacing its schedule identity', async () => {
    const before = (await firstValueFrom(api.listExams())).find((exam) => exam.id === 102);
    if (!before?.schedule) {
      throw new Error('Expected exam 102 to have a schedule.');
    }

    const request: ScheduleExamRequest = {
      scheduledStart: '2030-02-20T14:00:00.000Z',
      stationAeTitle: '  XRAY_2 ',
    };
    const updated = await firstValueFrom(api.reschedule(102, request));

    expect(updated.status).toBe('SCHEDULED');
    expect(updated.schedule?.id).toBe(before.schedule.id);
    expect(updated.schedule?.createdAt).toBe(before.schedule.createdAt);
    expect(updated.schedule?.scheduledStart).toBe(request.scheduledStart);
    expect(updated.schedule?.stationAeTitle).toBe('XRAY_2');
  });

  it('rejects rescheduling an exam that is not currently scheduled', async () => {
    const message = await readError(api.reschedule(101, initialRequest));

    expect(message).toBe('Only a scheduled exam can be rescheduled.');
  });

  it('cancels ordered and scheduled exams as a terminal status', async () => {
    const cancelledOrder = await firstValueFrom(api.cancel(101));
    const cancelledAppointment = await firstValueFrom(api.cancel(102));

    expect(cancelledOrder.status).toBe('CANCELLED');
    expect(cancelledOrder.schedule).toBeNull();
    expect(cancelledAppointment.status).toBe('CANCELLED');
    expect(cancelledAppointment.schedule).not.toBeNull();

    const stored = await firstValueFrom(api.listExams());
    expect(stored.find((exam) => exam.id === 101)?.status).toBe('CANCELLED');
    expect(stored.find((exam) => exam.id === 102)?.status).toBe('CANCELLED');
  });

  it('rejects cancelling an exam that is already terminal', async () => {
    const message = await readError(api.cancel(108));

    expect(message).toBe('This exam can no longer be cancelled.');
  });

  it('reports missing exam identifiers for every mutation', async () => {
    expect(await readError(api.schedule(9999, initialRequest))).toBe(
      'The exam order was not found.',
    );
    expect(await readError(api.reschedule(9999, initialRequest))).toBe(
      'The scheduled exam was not found.',
    );
    expect(await readError(api.cancel(9999))).toBe('The exam was not found.');
  });
});

async function readError(source: Observable<ExamView>): Promise<string> {
  try {
    await firstValueFrom(source);
    return 'Observable completed successfully.';
  } catch (error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
