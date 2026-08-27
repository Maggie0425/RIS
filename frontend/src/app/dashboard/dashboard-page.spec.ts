import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { DashboardApi } from './dashboard-api';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  let fixture: ComponentFixture<DashboardPage>;
  const api = {
    getSummary: vi.fn(),
  };

  beforeEach(async () => {
    api.getSummary.mockReturnValue(
      of({
        totalExams: 6,
        ordered: 1,
        scheduled: 1,
        acquired: 1,
        reported: 1,
        completed: 1,
        cancelled: 1,
      }),
    );
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [{ provide: DashboardApi, useValue: api }, provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => vi.clearAllMocks());

  it('renders the workflow summary returned by the API', () => {
    fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Total exams');
    expect(text).toContain('6');
    expect(text).toContain('Completed');
    expect(text).toContain('Workflow distribution');
    expect(text).toContain('16.7%');
    expect(text).toContain('Last refreshed:');
    expect(api.getSummary).toHaveBeenCalledOnce();
  });

  it('shows an empty state when there are no exams', () => {
    api.getSummary.mockReturnValue(
      of({
        totalExams: 0,
        ordered: 0,
        scheduled: 0,
        acquired: 0,
        reported: 0,
        completed: 0,
        cancelled: 0,
      }),
    );
    fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('No examination activity yet');
    expect(text).toContain('Exam statistics will appear after the first order is created.');
    expect(text).not.toContain('Total exams');
  });

  it('shows an error when the summary cannot be loaded', () => {
    api.getSummary.mockReturnValue(throwError(() => new Error('offline')));
    fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert.textContent).toContain('Dashboard summary could not be loaded');
  });

  it('provides accessible labels and values for the summary controls', () => {
    fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('section[aria-label="Examination status summary"]')).not.toBeNull();

    const progressBars = element.querySelectorAll<HTMLElement>('[role="progressbar"]');
    expect(progressBars).toHaveLength(6);
    expect(progressBars[0].getAttribute('aria-label')).toBe('Ordered examinations');
    expect(progressBars[0].getAttribute('aria-valuemin')).toBe('0');
    expect(progressBars[0].getAttribute('aria-valuemax')).toBe('100');
    expect(progressBars[0].getAttribute('aria-valuenow')).toBe('16.7');

    const refreshButton = Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Refresh'),
    );
    expect(refreshButton).toBeDefined();
  });

  it('links each summary card to the corresponding exams filter', () => {
    fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const links = element.querySelectorAll<HTMLAnchorElement>('a.summary-card-link');
    expect(links).toHaveLength(7);
    expect(links[0].getAttribute('href')).toBe('/exams');
    expect(links[0].getAttribute('aria-label')).toBe('View all examinations');
    expect(links[1].getAttribute('href')).toBe('/exams?status=ORDERED');
    expect(links[1].getAttribute('aria-label')).toBe('View ordered examinations');
    expect(links[6].getAttribute('href')).toBe('/exams?status=CANCELLED');
  });

  it('announces the loading state', () => {
    api.getSummary.mockReturnValue(NEVER);
    fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion.textContent).toContain('Loading workflow summary');
  });
});
