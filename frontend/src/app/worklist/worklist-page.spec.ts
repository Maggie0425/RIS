import { TestBed } from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { localDateKey } from './schedule';
import { WorklistPage } from './worklist-page';

describe('WorklistPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorklistPage, MatIconTestingModule],
    }).compileComponents();
  });

  it('loads the calendar and ordered-exam queue', async () => {
    const fixture = TestBed.createComponent(WorklistPage);
    fixture.detectChanges();
    await waitForMockData();
    fixture.detectChanges();

    const page = fixture.componentInstance;
    expect(page.scheduledExams().length).toBe(4);
    expect(page.orderedExams().length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Waiting to schedule');
    expect(fixture.nativeElement.textContent).toContain('Prototype scheduling data');
  });

  it('shows a selected appointment in the details panel', async () => {
    const fixture = TestBed.createComponent(WorklistPage);
    fixture.detectChanges();
    await waitForMockData();

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

function waitForMockData(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 220));
}

function startOfWeek(value: Date): Date {
  const start = new Date(value);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  start.setHours(0, 0, 0, 0);
  return start;
}
