import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import { describeHttpError } from './describe-http-error';

// Shows a toast for every failed API call. 401s are left to the auth flow, except a failed login.
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const messages = inject(MessageService);

  return next(request).pipe(
    catchError((error: unknown) => {
      const isFailedLogin = request.url.endsWith('/api/auth/login');

      if (error instanceof HttpErrorResponse && (error.status !== 401 || isFailedLogin)) {
        void describeHttpError(error).then(({ summary, detail }) =>
          messages.add({ severity: 'error', summary, detail, life: 6000 }),
        );
      }

      return throwError(() => error);
    }),
  );
};
