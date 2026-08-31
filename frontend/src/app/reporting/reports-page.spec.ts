import { TestBed } from '@angular/core/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AuthSession } from '../authentication/auth-session';
import { ReportsPage } from './reports-page';

describe('ReportsPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsPage, MatIconTestingModule],
      providers: [{ provide: AuthSession, useValue: { hasPermission: () => true } }],
    }).compileComponents();
  });

  it('loads each reporting lifecycle group and selects an acquired exam', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    fixture.detectChanges();
    await waitForMockData();
    fixture.detectChanges();

    const page = fixture.componentInstance;
    expect(page.needsReportCount()).toBe(1);
    expect(page.submittedCount()).toBe(1);
    expect(page.completedCount()).toBe(1);
    expect(page.selectedExam()?.status).toBe('ACQUIRED');
    expect(fixture.nativeElement.textContent).toContain('Reporting queue');
    expect(fixture.nativeElement.querySelector('textarea')).not.toBeNull();
  });

  it('shows submitted reports as read-only and supports searching', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    fixture.detectChanges();
    await waitForMockData();

    const page = fixture.componentInstance;
    page.setViewFilter('SUBMITTED');
    fixture.detectChanges();

    expect(page.selectedExam()?.status).toBe('REPORTED');
    expect(fixture.nativeElement.textContent).toContain('no acute abnormality identified');
    expect(fixture.nativeElement.querySelector('textarea')).toBeNull();

    page.searchTerm.set('not-a-real-patient');
    fixture.detectChanges();
    expect(page.filteredExams().length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('No matching examinations');
  });

  it('rejects a whitespace-only report in the editor', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    fixture.detectChanges();
    await waitForMockData();

    const control = fixture.componentInstance.reportForm.controls.reportText;
    control.setValue('   ');
    expect(control.invalid).toBe(true);
    control.setValue('Synthetic report result.');
    expect(control.valid).toBe(true);
  });
});

function waitForMockData(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 220));
}
