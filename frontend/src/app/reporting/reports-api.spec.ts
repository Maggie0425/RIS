import { firstValueFrom, Observable } from 'rxjs';
import { ReportingExamView } from './report';
import { ReportsApi } from './reports-api';

describe('ReportsApi', () => {
  let api: ReportsApi;

  beforeEach(() => {
    api = new ReportsApi();
  });

  it('lists one seeded exam in each reporting state as defensive copies', async () => {
    const firstList = await firstValueFrom(api.listExams());

    expect(firstList.map((exam) => exam.status)).toEqual(['ACQUIRED', 'REPORTED', 'COMPLETED']);
    expect(firstList[0].report).toBeNull();
    expect(firstList[1].report).not.toBeNull();
    expect(firstList[2].report).not.toBeNull();

    firstList[0].patient.firstName = 'Changed';
    if (!firstList[0].schedule || !firstList[1].report) {
      throw new Error('Expected seeded schedule and report data.');
    }
    firstList[0].schedule.stationAeTitle = 'CHANGED';
    firstList[1].report.reportText = 'Changed report';

    const secondList = await firstValueFrom(api.listExams());
    expect(secondList[0].patient.firstName).not.toBe('Changed');
    expect(secondList[0].schedule?.stationAeTitle).not.toBe('CHANGED');
    expect(secondList[1].report?.reportText).not.toBe('Changed report');
  });

  it('submits a trimmed report and moves an acquired exam to reported', async () => {
    const reported = await firstValueFrom(
      api.submitReport(103, { reportText: '  No acute intracranial abnormality.  ' }),
    );

    expect(reported.status).toBe('REPORTED');
    expect(reported.report?.id).toBe(9003);
    expect(reported.report?.examId).toBe(103);
    expect(reported.report?.authorUserId).toBe(4);
    expect(reported.report?.reportText).toBe('No acute intracranial abnormality.');
    expect(reported.report?.submittedAt).toBeTruthy();

    const stored = (await firstValueFrom(api.listExams())).find((exam) => exam.id === 103);
    expect(stored?.status).toBe('REPORTED');
    expect(stored?.report?.reportText).toBe('No acute intracranial abnormality.');
  });

  it('rejects blank report text without changing the acquired exam', async () => {
    const message = await readError(api.submitReport(103, { reportText: ' \n\t ' }));

    expect(message).toBe('Report text is required.');
    const stored = (await firstValueFrom(api.listExams())).find((exam) => exam.id === 103);
    expect(stored?.status).toBe('ACQUIRED');
    expect(stored?.report).toBeNull();
  });

  it('rejects duplicate report submission', async () => {
    await firstValueFrom(api.submitReport(103, { reportText: 'Initial report.' }));

    const message = await readError(api.submitReport(103, { reportText: 'Second report.' }));
    expect(message).toBe('Only an acquired exam without a report can be reported.');
  });

  it('rejects report submission for exams outside the acquired state', async () => {
    expect(await readError(api.submitReport(104, { reportText: 'Replacement report.' }))).toBe(
      'Only an acquired exam without a report can be reported.',
    );
    expect(await readError(api.submitReport(105, { reportText: 'Late report.' }))).toBe(
      'Only an acquired exam without a report can be reported.',
    );
  });

  it('completes a reported exam while retaining its submitted report', async () => {
    const before = (await firstValueFrom(api.listExams())).find((exam) => exam.id === 104);
    if (!before?.report) {
      throw new Error('Expected exam 104 to have a submitted report.');
    }

    const completed = await firstValueFrom(api.completeExam(104));

    expect(completed.status).toBe('COMPLETED');
    expect(completed.report?.id).toBe(before.report.id);
    expect(completed.report?.reportText).toBe(before.report.reportText);
    expect(completed.report?.submittedAt).toBe(before.report.submittedAt);

    const stored = (await firstValueFrom(api.listExams())).find((exam) => exam.id === 104);
    expect(stored?.status).toBe('COMPLETED');
  });

  it('rejects completion unless the exam is reported with a report', async () => {
    expect(await readError(api.completeExam(103))).toBe('Only a reported exam can be completed.');
    expect(await readError(api.completeExam(105))).toBe('Only a reported exam can be completed.');
  });

  it('reports missing exam identifiers for submission and completion', async () => {
    expect(await readError(api.submitReport(9999, { reportText: 'Report.' }))).toBe(
      'The examination was not found.',
    );
    expect(await readError(api.completeExam(9999))).toBe('The examination was not found.');
  });
});

async function readError(source: Observable<ReportingExamView>): Promise<string> {
  try {
    await firstValueFrom(source);
    return 'Observable completed successfully.';
  } catch (error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
