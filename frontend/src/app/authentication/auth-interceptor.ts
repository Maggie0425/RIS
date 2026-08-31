import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthSession } from './auth-session';

const PUBLIC_API_PATHS = ['/api/auth/login', '/api/status', '/api-docs'];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(AuthSession);
  const router = inject(Router);
  const protectedApiRequest =
    request.url.startsWith('/api/') &&
    !PUBLIC_API_PATHS.some((path) => request.url === path || request.url.startsWith(`${path}/`));
  const sessionRestoreRequest = request.url === '/api/auth/me';
  const token = protectedApiRequest ? session.accessToken() : null;
  const authenticatedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (protectedApiRequest && error instanceof HttpErrorResponse && error.status === 401) {
        session.clear();
        if (!sessionRestoreRequest && !router.url.startsWith('/login')) {
          const returnUrl = safeReturnUrl(router.url);
          void router.navigate(['/login'], {
            queryParams: { returnUrl, sessionExpired: true },
          });
        }
      }
      return throwError(() => error);
    }),
  );
};

function safeReturnUrl(value: string): string {
  return value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}
