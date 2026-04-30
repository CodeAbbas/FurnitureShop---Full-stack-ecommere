import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  if (authService.isLoggedIn()) {
    // Authenticated as a customer — bounce home, no return path.
    router.navigate(['/']);
  } else {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
  return false;
};