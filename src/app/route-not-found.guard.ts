import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const routeNotFoundGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    const userRole = authService.getUserRole();
    
    switch (userRole) {
      case 'student':
        router.navigate(['/student/dashboard']);
        break;
      case 'instructor':
        router.navigate(['/instructor/dashboard']);
        break;
      case 'admin':
        router.navigate(['/admin/dashboard']);
        break;
      default:
        router.navigate(['/login']);
        break;
    }
  } else {
    router.navigate(['/login']);
  }
  
  return false;
}; 