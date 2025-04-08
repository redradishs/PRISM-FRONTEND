import { Routes } from '@angular/router';
import { LoginComponent } from './adons/login/login.component';
import { HomeComponent } from './instructor/home/home.component';
import { StudentsComponent } from './instructor/students/students.component';
import { AssessmentComponent } from './instructor/assessment/assessment.component';
import { GenerateAssessmentComponent } from './instructor/generate-assessment/generate-assessment.component';
import { TakeAssessmentComponent } from './instructor/take-assessment/take-assessment.component';
import { TestComponent } from './adons/test/test.component';
import { ResultComponent } from './instructor/result/result.component';
import { ComponentTestingComponent } from './component-testing/component-testing.component';
import { StudHomeComponent } from './students/stud-home/stud-home.component';
import { StudClassesComponent } from './students/stud-classes/stud-classes.component';
import { StudClassDetailsComponent } from './students/stud-classdetails/stud-classdetails.component';
import { StudTakeexamComponent } from './students/stud-takeexam/stud-takeexam.component';
import { StudHistoryComponent } from './students/stud-history/stud-history.component';
import { CreateAssessmentComponent } from './instructor/create-assessment/create-assessment.component';
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
