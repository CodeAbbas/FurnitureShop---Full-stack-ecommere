import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  const authReq = token
    ? req.clone({ setHeaders: { 'x-access-token': token } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      const isAuthFlowEndpoint =
        req.url.endsWith('/user/logout') ||
        req.url.endsWith('/guest/login');

      if (error.status === 401 && !!token && !isAuthFlowEndpoint) {
        authService.logout().subscribe({
          next: () => router.navigate(['/login']),
          error: () => router.navigate(['/login'])
        });
      }

      return throwError(() => error);
    })
  );
};