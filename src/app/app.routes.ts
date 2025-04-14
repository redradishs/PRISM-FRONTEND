import { Routes } from '@angular/router';
import { LoginComponent } from './adons/login/login.component';
import { TestComponent } from './adons/test/test.component';
import { ComponentTestingComponent } from './component-testing/component-testing.component';
import { VerifyComponent } from './adons/verify/verify.component';
import { ForgotComponent } from './adons/forgot/forgot.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'verify-email', component: VerifyComponent},
  { path: 'forgot-password', component: ForgotComponent},

  {
    path: 'instructor',
    loadChildren: () =>
      import('./instructor.routes').then((m) => m.INSTRUCTOR_ROUTES),
  },

  {
    path: 'student',
    loadChildren: () =>
      import('./student.routes').then((m) => m.STUDENT_ROUTES),
  },

  {
    path: 'admin',
    loadChildren: () => import('./admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'test',
    component: TestComponent,
  },
  { path: 'component-testing', component: ComponentTestingComponent },
  { path: '**', redirectTo: 'login' },
];
