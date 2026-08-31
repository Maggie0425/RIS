import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient, PatientRequest } from './patient';
@Injectable({ providedIn: 'root' })
export class PatientApi {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/patients';
  list(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.url);
  }
  get(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.url}/${id}`);
  }
  create(request: PatientRequest): Observable<Patient> {
    return this.http.post<Patient>(this.url, request);
  }
  update(id: number, request: PatientRequest): Observable<Patient> {
    return this.http.put<Patient>(`${this.url}/${id}`, request);
  }
}
