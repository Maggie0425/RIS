import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Exam, ExamRequest, ExamStatus } from './exam';

@Injectable({ providedIn: 'root' })
export class ExamApi {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/exams';

  list(filters: { patientId?: number; status?: ExamStatus } = {}): Observable<Exam[]> {
    let params = new HttpParams();
    if (filters.patientId != null) {
      params = params.set('patientId', String(filters.patientId));
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<Exam[]>(this.url, { params });
  }

  get(id: number): Observable<Exam> {
    return this.http.get<Exam>(`${this.url}/${id}`);
  }

  create(request: ExamRequest): Observable<Exam> {
    return this.http.post<Exam>(this.url, request);
  }
}
