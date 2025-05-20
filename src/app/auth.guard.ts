import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './services/auth.service';
import Swal from 'sweetalert2';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    Swal.fire({
      title: 'Authentication Required',
      text: 'Please log in to access this page',
      icon: 'warning',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
    
    sessionStorage.setItem('redirectUrl', state.url);
    
    router.navigate(['/login']);
    return false;
  }

  const requiredRole = route.data['role'];
  const userRole = authService.getUserRole();

  if (!requiredRole || requiredRole === userRole) {
    return true;
  }

  Swal.fire({
    title: 'Access Denied',
    text: `You don't have the required permissions to access this area`,
    icon: 'error',
    confirmButtonText: 'OK',
  }).then(() => {
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
  });
  
  return false;
};