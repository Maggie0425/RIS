import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AuthSession } from './auth-session';
import { AuthenticationApi } from './authentication-api';
import { authGuard, guestGuard, permissionGuard } from './auth-guards';

describe('authentication guards', () => {
  let authenticated = false;
  let permissions = new Set<string>();
  const authentication = {
    ensureAuthenticated: vi.fn(() => of(authenticated)),
  };
  const session = {
    accessToken: vi.fn(() => null),
    hasPermission: vi.fn((permission: string) => permissions.has(permission)),
  };
  let router: Router;

  beforeEach(() => {
    authenticated = false;
    permissions = new Set<string>();
    authentication.ensureAuthenticated.mockClear();
    session.accessToken.mockClear();
    session.hasPermission.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthenticationApi, useValue: authentication },
        { provide: AuthSession, useValue: session },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('redirects anonymous users to login with their requested route', async () => {
    const result = await runGuard(authGuard, '/patients');

    expect(result === true ? '' : router.serializeUrl(result)).toBe('/login?returnUrl=%2Fpatients');
  });

  it('keeps authenticated users away from the login page', async () => {
    authenticated = true;
    const result = await runGuard(guestGuard, '/login');

    expect(result === true ? '' : router.serializeUrl(result)).toBe('/dashboard');
  });

  it('allows a route only when the user has its required permission', async () => {
    authenticated = true;
    permissions.add('PATIENT_READ');

    expect(await runGuard(permissionGuard('PATIENT_READ'), '/patients')).toBe(true);
    const denied = await runGuard(permissionGuard('REPORT_READ'), '/reports');
    expect(denied === true ? '' : router.serializeUrl(denied)).toBe(
      '/forbidden?required=REPORT_READ',
    );
  });
});

async function runGuard(
  guard: ReturnType<typeof permissionGuard> | typeof authGuard,
  url: string,
): Promise<true | ReturnType<Router['createUrlTree']>> {
  const result = TestBed.runInInjectionContext(() =>
    guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
  );
  return firstValueFrom(result as Observable<true | ReturnType<Router['createUrlTree']>>);
}
