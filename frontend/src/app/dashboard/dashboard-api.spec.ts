import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DashboardApi } from './dashboard-api';
import { DashboardSummary } from './dashboard-summary';

describe('DashboardApi', () => {
  let api: DashboardApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardApi, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(DashboardApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the dashboard summary', () => {
    const summary: DashboardSummary = {
      totalExams: 6,
      ordered: 1,
      scheduled: 1,
      acquired: 1,
      reported: 1,
      completed: 1,
      cancelled: 1,
    };

    api.getSummary().subscribe((result) => expect(result).toEqual(summary));

    const request = http.expectOne('/api/dashboard/summary');
    expect(request.request.method).toBe('GET');
    request.flush(summary);
  });
});
