import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

// Token endpoints authenticate with the refresh token itself, so they are never retried.
const TOKEN_ENDPOINTS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout'];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);

  if (TOKEN_ENDPOINTS.some((endpoint) => request.url.endsWith(endpoint))) return next(request);

  return next(withToken(request, auth.accessToken())).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !auth.hasRefreshToken()) {
        return throwError(() => error);
      }

      // Access token expired: refresh once and replay the request.
      return auth.refreshAccessToken().pipe(
        catchError((refreshError) => {
          auth.expireSession();
          return throwError(() => refreshError);
        }),
        switchMap((token) => next(withToken(request, token))),
      );
    }),
  );
};

function withToken(request: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
}
