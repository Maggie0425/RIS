import { TestBed } from '@angular/core/testing';
import { AuthSession } from './auth-session';
import { LoginResponse } from './authentication';

describe('AuthSession', () => {
  let session: AuthSession;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    session = TestBed.inject(AuthSession);
  });

  afterEach(() => {
    session.clear();
    vi.useRealTimers();
  });

  it('stores an active token and exposes the authenticated user permissions', () => {
    session.start(loginResponse());

    expect(session.accessToken()).toBe('test-jwt');
    expect(session.currentUser()?.username).toBe('receptionist');
    expect(session.hasPermission('PATIENT_WRITE')).toBe(true);
    expect(session.hasPermission('REPORT_WRITE')).toBe(false);

    const stored = sessionStorage.getItem('ris.auth.session') ?? '';
    expect(stored).toContain('test-jwt');
    expect(stored).not.toContain('receptionist');
    expect(stored.toLowerCase()).not.toContain('password');
  });

  it('clears the token, user and browser session on logout', () => {
    session.start(loginResponse());

    session.clear();

    expect(session.accessToken()).toBeNull();
    expect(session.currentUser()).toBeNull();
    expect(sessionStorage.getItem('ris.auth.session')).toBeNull();
  });

  it('clears and announces an expired session', () => {
    vi.useFakeTimers();
    const response = loginResponse();
    response.expiresAt = new Date(Date.now() + 1_000).toISOString();
    const expired = vi.fn();
    session.expired.subscribe(expired);

    session.start(response);
    vi.advanceTimersByTime(1_001);

    expect(session.accessToken()).toBeNull();
    expect(session.currentUser()).toBeNull();
    expect(expired).toHaveBeenCalledOnce();
  });
});

function loginResponse(): LoginResponse {
  return {
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
  };
}
