import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  const authenticated = request.url.startsWith('/api/') && !!token;
  const securedRequest = authenticated
    ? request.clone({ setHeaders: { Authorization: 'Bearer ' + token } })
    : request;
  return next(securedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && authenticated) auth.logout();
      return throwError(() => error);
    })
  );
};