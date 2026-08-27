import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardSummary } from './dashboard-summary';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/dashboard/summary';

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(this.url);
  }
}
