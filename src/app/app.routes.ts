import { Routes } from '@angular/router';
import { LoginComponent } from './adons/login/login.component';
import { TestComponent } from './adons/test/test.component';
import { ComponentTestingComponent } from './component-testing/component-testing.component';
import { VerifyComponent } from './adons/verify/verify.component';
import { ForgotComponent } from './adons/forgot/forgot.component';
import { authGuard } from './auth.guard';
import { routeNotFoundGuard } from './route-not-found.guard';
import { NotFoundComponent } from './not-found/not-found.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'verify-email', component: VerifyComponent},
  { path: 'forgot-password', component: ForgotComponent},

  {
    path: 'instructor',
    canActivate: [authGuard],
    data: { role: 'instructor' },
    loadChildren: () =>
      import('./instructor.routes').then((m) => m.INSTRUCTOR_ROUTES),
  },

  {
    path: 'student',
    canActivate: [authGuard],
    data: { role: 'student' },
    loadChildren: () =>
      import('./student.routes').then((m) => m.STUDENT_ROUTES),
  },

  {
    path: 'admin',
    canActivate: [authGuard],
    data: { role: 'admin' },
    loadChildren: () => import('./admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'test',
    component: TestComponent,
  },
  { path: 'component-testing', component: ComponentTestingComponent },
  { 
    path: '**', 
    component: NotFoundComponent,
    canActivate: [routeNotFoundGuard]
  },
];
