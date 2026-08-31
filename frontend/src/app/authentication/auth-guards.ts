import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthSession } from './auth-session';
import { AuthenticationApi } from './authentication-api';
import { PermissionCode } from './authentication';

export const authGuard: CanActivateFn = (_route, state) => {
  const authentication = inject(AuthenticationApi);
  const session = inject(AuthSession);
  const router = inject(Router);
  const restoringSession = session.accessToken() !== null;
  return authentication.ensureAuthenticated().pipe(
    map((authenticated) =>
      authenticated
        ? true
        : router.createUrlTree(['/login'], {
            queryParams: {
              returnUrl: safeReturnUrl(state.url),
              ...(restoringSession ? { sessionExpired: true } : {}),
            },
          }),
    ),
  );
};

export const guestGuard: CanActivateFn = () => {
  const authentication = inject(AuthenticationApi);
  const router = inject(Router);
  return authentication
    .ensureAuthenticated()
    .pipe(map((authenticated) => (authenticated ? router.createUrlTree(['/dashboard']) : true)));
};

export function permissionGuard(permission: PermissionCode): CanActivateFn {
  return (_route, state) => {
    const authentication = inject(AuthenticationApi);
    const session = inject(AuthSession);
    const router = inject(Router);
    const restoringSession = session.accessToken() !== null;
    return authentication.ensureAuthenticated().pipe(
      map((authenticated) => {
        if (!authenticated) {
          return router.createUrlTree(['/login'], {
            queryParams: {
              returnUrl: safeReturnUrl(state.url),
              ...(restoringSession ? { sessionExpired: true } : {}),
            },
          });
        }
        return session.hasPermission(permission)
          ? true
          : router.createUrlTree(['/forbidden'], { queryParams: { required: permission } });
      }),
    );
  };
}

function safeReturnUrl(value: string): string {
  return value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}
