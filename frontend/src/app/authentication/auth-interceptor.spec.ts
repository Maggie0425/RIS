import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { authInterceptor } from './auth-interceptor';
import { AuthSession } from './auth-session';

describe('authInterceptor', () => {
  const router = {
    url: '/patients',
    navigate: vi.fn(() => Promise.resolve(true)),
  };
  let client: HttpClient;
  let http: HttpTestingController;
  let session: AuthSession;

  beforeEach(() => {
    sessionStorage.clear();
    router.url = '/patients';
    router.navigate.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    session = TestBed.inject(AuthSession);
  });

  afterEach(() => {
    http.verify();
    session.clear();
  });

  it('adds a bearer token to protected API requests', async () => {
    startSession();
    const result = firstValueFrom(client.get('/api/patients'));

    const request = http.expectOne('/api/patients');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-jwt');
    request.flush([]);
    await result;
  });

  it('does not attach the token to login or external requests', async () => {
    startSession();
    const loginResult = firstValueFrom(client.post('/api/auth/login', {}));
    const loginRequest = http.expectOne('/api/auth/login');
    expect(loginRequest.request.headers.has('Authorization')).toBe(false);
    loginRequest.flush({});
    await loginResult;

    const externalResult = firstValueFrom(client.get('https://example.test/data'));
    const externalRequest = http.expectOne('https://example.test/data');
    expect(externalRequest.request.headers.has('Authorization')).toBe(false);
    externalRequest.flush({});
    await externalResult;
  });

  it('clears the session and returns to login after a protected 401', async () => {
    startSession();
    const result = firstValueFrom(client.get('/api/patients')).catch(() => null);

    http.expectOne('/api/patients').flush({}, { status: 401, statusText: 'Unauthorized' });
    await result;

    expect(session.accessToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/patients', sessionExpired: true },
    });
  });

  it('keeps the session after a permission-denied 403', async () => {
    startSession();
    const result = firstValueFrom(client.post('/api/patients', {})).catch(() => null);

    http.expectOne('/api/patients').flush({}, { status: 403, statusText: 'Forbidden' });
    await result;

    expect(session.accessToken()).toBe('test-jwt');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('lets the route guard handle a failed session restoration', async () => {
    startSession();
    const result = firstValueFrom(client.get('/api/auth/me')).catch(() => null);

    http.expectOne('/api/auth/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    await result;

    expect(session.accessToken()).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  function startSession(): void {
    session.start({
      accessToken: 'test-jwt',
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      user: {
        id: 2,
        username: 'receptionist',
        displayName: 'Demo Receptionist',
        roles: ['RECEPTIONIST'],
        permissions: ['PATIENT_READ', 'PATIENT_WRITE'],
      },
    });
  }
});
