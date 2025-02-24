import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Get required role from route data
  const requiredRole = route.data['role'];
  const userRole = authService.getUserRole();

  // If no role is specified in route, allow access
  if (!requiredRole || requiredRole === userRole) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};