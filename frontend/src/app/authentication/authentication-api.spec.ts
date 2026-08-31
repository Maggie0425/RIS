import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthSession } from './auth-session';
import { AuthenticationApi } from './authentication-api';
import { CurrentUser, LoginResponse } from './authentication';

describe('AuthenticationApi', () => {
  let api: AuthenticationApi;
  let http: HttpTestingController;
  let session: AuthSession;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    http?.verify();
    session?.clear();
  });

  it('logs in with the backend contract and starts a session', async () => {
    injectServices();
    const response = loginResponse();
    const result = firstValueFrom(
      api.login({ username: 'receptionist', password: 'ris-demo-password' }),
    );

    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      username: 'receptionist',
      password: 'ris-demo-password',
    });
    request.flush(response);

    expect(await result).toEqual(response);
    expect(session.accessToken()).toBe('test-jwt');
    expect(session.currentUser()).toEqual(response.user);
  });

  it('restores the user through /api/auth/me after a page reload', async () => {
    sessionStorage.setItem(
      'ris.auth.session',
      JSON.stringify({
        accessToken: 'restored-jwt',
        expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      }),
    );
    injectServices();
    const result = firstValueFrom(api.ensureAuthenticated());

    const request = http.expectOne('/api/auth/me');
    expect(request.request.method).toBe('GET');
    request.flush(currentUser());

    expect(await result).toBe(true);
    expect(session.currentUser()).toEqual(currentUser());
  });

  it('clears a restored session when /api/auth/me rejects it', async () => {
    sessionStorage.setItem(
      'ris.auth.session',
      JSON.stringify({
        accessToken: 'invalid-jwt',
        expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      }),
    );
    injectServices();
    const result = firstValueFrom(api.ensureAuthenticated());

    http
      .expectOne('/api/auth/me')
      .flush(
        { message: 'Authentication is required or the bearer token is invalid.' },
        { status: 401, statusText: 'Unauthorized' },
      );

    expect(await result).toBe(false);
    expect(session.accessToken()).toBeNull();
    expect(session.currentUser()).toBeNull();
  });

  function injectServices(): void {
    api = TestBed.inject(AuthenticationApi);
    http = TestBed.inject(HttpTestingController);
    session = TestBed.inject(AuthSession);
  }
});

function currentUser(): CurrentUser {
  return {
    id: 2,
    username: 'receptionist',
    displayName: 'Demo Receptionist',
    roles: ['RECEPTIONIST'],
    permissions: ['PATIENT_READ', 'PATIENT_WRITE'],
  };
}

function loginResponse(): LoginResponse {
  return {
    accessToken: 'test-jwt',
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    user: currentUser(),
  };
}
