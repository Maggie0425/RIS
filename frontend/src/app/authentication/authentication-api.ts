import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { AuthSession } from './auth-session';
import { CurrentUser, LoginRequest, LoginResponse } from './authentication';

@Injectable({ providedIn: 'root' })
export class AuthenticationApi {
  private readonly http = inject(HttpClient);
  private readonly session = inject(AuthSession);
  private restoreRequest: Observable<boolean> | null = null;

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>('/api/auth/login', request)
      .pipe(tap((response) => this.session.start(response)));
  }

  ensureAuthenticated(): Observable<boolean> {
    if (!this.session.accessToken()) return of(false);
    if (this.session.currentUser()) return of(true);
    if (this.restoreRequest) return this.restoreRequest;

    this.restoreRequest = this.http.get<CurrentUser>('/api/auth/me').pipe(
      tap((user) => this.session.setCurrentUser(user)),
      map(() => true),
      catchError(() => {
        this.session.clear();
        return of(false);
      }),
      finalize(() => (this.restoreRequest = null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.restoreRequest;
  }

  logout(): void {
    this.session.clear();
  }
}
