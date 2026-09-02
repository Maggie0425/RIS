import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateUserRequest, ManagedUser, RoleCode } from './user-management';

@Injectable({ providedIn: 'root' })
export class UserManagementApi {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/users';

  list(): Observable<ManagedUser[]> {
    return this.http.get<ManagedUser[]>(this.url);
  }

  create(request: CreateUserRequest): Observable<ManagedUser> {
    return this.http.post<ManagedUser>(this.url, request);
  }

  replaceRoles(id: number, roles: RoleCode[]): Observable<ManagedUser> {
    return this.http.put<ManagedUser>(`${this.url}/${id}/roles`, { roles });
  }

  setEnabled(id: number, enabled: boolean): Observable<ManagedUser> {
    return this.http.patch<ManagedUser>(`${this.url}/${id}/enabled`, { enabled });
  }
}
