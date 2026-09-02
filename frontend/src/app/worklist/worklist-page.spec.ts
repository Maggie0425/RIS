import { TestBed } from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { of } from 'rxjs';
import { ScheduleApi } from './schedule-api';
import { ExamView, localDateKey } from './schedule';
import { WorklistPage } from './worklist-page';

describe('WorklistPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorklistPage, MatIconTestingModule],
      providers: [
        {
          provide: ScheduleApi,
          useValue: { listExams: () => of(EXAMS) },
        },
      ],
    }).compileComponents();
  });

  it('loads the calendar and ordered-exam queue', () => {
    const fixture = TestBed.createComponent(WorklistPage);
    fixture.detectChanges();

    const page = fixture.componentInstance;
    expect(page.scheduledExams()).toHaveLength(1);
    expect(page.orderedExams()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Waiting to schedule');
    expect(fixture.nativeElement.textContent).toContain('Backend-connected scheduling');
  });

  it('shows a selected appointment in the details panel', () => {
    const fixture = TestBed.createComponent(WorklistPage);
    fixture.detectChanges();

    const page = fixture.componentInstance;
    const exam = page.scheduledExams()[0];
    const scheduledDate = new Date(exam.schedule!.scheduledStart);
    page.weekStart.set(startOfWeek(scheduledDate));
    page.selectedDate.set(localDateKey(scheduledDate));
    page.selectExam(exam);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Appointment details');
    expect(fixture.nativeElement.textContent).toContain(exam.patient.medicalRecordNumber);
    expect(fixture.nativeElement.textContent).toContain(exam.accessionNumber);
  });
});

const NOW = new Date().toISOString();
const SCHEDULED_START = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
const EXAMS: ExamView[] = [
  {
    id: 11,
    accessionNumber: 'SYN-ACC-0011',
    requestedProcedure: 'CT abdomen',
    modality: 'CT',
    status: 'ORDERED',
    createdAt: NOW,
    updatedAt: NOW,
    patient: {
      id: 1,
      medicalRecordNumber: 'SYN-000001',
      firstName: 'Avery',
      lastName: 'Taylor',
    },
    schedule: null,
  },
  {
    id: 12,
    accessionNumber: 'SYN-ACC-0012',
    requestedProcedure: 'Chest X-ray',
    modality: 'DX',
    status: 'SCHEDULED',
    createdAt: NOW,
    updatedAt: NOW,
    patient: {
      id: 2,
      medicalRecordNumber: 'SYN-000002',
      firstName: 'Jordan',
      lastName: 'Lee',
    },
    schedule: {
      scheduledStart: SCHEDULED_START,
      stationAeTitle: 'XRAY_1',
    },
  },
];

function startOfWeek(value: Date): Date {
  const start = new Date(value);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  start.setHours(0, 0, 0, 0);
  return start;
}
