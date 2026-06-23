import { Routes } from '@angular/router';
import { LoginComponent } from './adons/login/login.component';
import { VerifyComponent } from './adons/verify/verify.component';
import { ForgotComponent } from './adons/forgot/forgot.component';
import { authGuard } from './auth.guard';
import { routeNotFoundGuard } from './route-not-found.guard';
import { NotFoundComponent } from './not-found/not-found.component';
import { CompleteProfileComponent } from './adons/complete-profile/complete-profile.component';
import { JoinAssessmentComponent } from './adons/join-assessment/join-assessment.component';
import { JoinClassComponent } from './adons/join-class/join-class.component';
import { IndexComponent } from './adons/index/index.component';
import { SetpasswordComponent } from './adons/setpassword/setpassword.component';
import { AboutComponent } from './adons/about/about.component';

export const routes: Routes = [
  {
    path: '',
    component: IndexComponent,
    data: {
      seo: {
        title: 'PRISM - AI-Powered Assessment Platform | Gordon College CCS',
        description: "PRISM (Platform for Real-time Intelligent Student Measurement System) is Gordon College CCS' advanced AI-powered assessment platform. Create, manage, and analyze assessments with real-time analytics and AI assistance",
        keywords: 'PRISM, Platform for RealTime Intelligent Student Measurement System, PRISM GC, Gordon College, assessment platform, CCS'
      }
    }
  },
  {
    path: 'index',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    data: {
      seo: {
        title: 'PRISM - AI-Powered Assessment Platform | Gordon College CCS',
        description: "PRISM (Platform for Real-time Intelligent Student Measurement System) is Gordon College CCS' advanced AI-powered assessment platform. Create, manage, and analyze assessments with real-time analytics and AI assistance",
        keywords: 'PRISM Login, Platform for RealTime Intelligent Student Measurement System, login, sign in, PRISM GC, PRISM, Gordon College, assessment platform, CCS'
      }
    }
  },
  {
    path: 'verify-email',
    component: VerifyComponent,
    data: {
      seo: {
        title: 'PRISM | Verify Email',
        description: 'Verify your email address to complete your PRISM account setup',
        keywords: 'PRISM Verify, email verification, account verification, PRISM, PRISM GC'
      }
    }
  },
  {
    path: 'forgot-password',
    component: ForgotComponent,
    data: {
      seo: {
        title: 'PRISM | Reset Password',
        description: 'Reset your PRISM account password - Secure password recovery for Gordon College CCS students and instructors',
        keywords: 'PRISM Reset, PRISM Student, PRISM password reset, forgot password, account recovery, PRISM'
      }
    }
  },
  {
    path: 'imrad-research',
    component: AboutComponent,
    data: {
      seo: {
        title: 'PRISM | IMRAD Research',
        description: 'Learn more about the IMRAD research behind PRISM, the AI-powered assessment platform by Gordon College CCS',
        keywords: 'PRISM About, about PRISM, PRISM platform, PRISM features'
      }
    }
  },
  {
    path: 'complete-profile',
    component: CompleteProfileComponent,
    data: {
      seo: {
        title: 'PRISM | Complete Profile',
        description: 'Complete your PRISM profile setup to access assessment tools',
        keywords: 'PRISM profile, Gordon College CCS, PRISM GC, PRISM Student, profile setup, account completion, PRISM'
      }
    }
  },
  {
    path: 'complete-profile/password',
    component: SetpasswordComponent,
    data: {
      seo: {
        title: 'PRISM | Set Password',
        description: 'Set your PRISM account password to access assessment tools',
        keywords: 'PRISM profile, Gordon College CCS, PRISM GC, PRISM Student, profile setup, account completion, PRISM'
      }
    }
  },
  {
    path: 'join/public/:code',
    component: JoinAssessmentComponent,
    data: {
      seo: {
        title: 'PRISM | Join Assessment',
        description: 'Join Public Assessments and get instant results and feedback',
        keywords: 'PRISM JOIN, Gordon College CCS, PRISM GC, PRISM Student, PRISM Gordon College Join, PRISM'
      }
    }
  },
  {
    path: 'join/class/:code',
    component: JoinClassComponent,
    data: {
      seo: {
        title: 'PRISM | Join Class',
        description: 'Join Classrooms and access assessment tools',
        keywords: 'PRISM JOIN, Gordon College CCS, PRISM GC, PRISM Student, PRISM Gordon College Join, PRISM'
      }
    }
  },
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
    path: '**',
    component: NotFoundComponent,
    canActivate: [routeNotFoundGuard],
    data: {
      seo: {
        title: 'Page Not Found',
        description: 'The page you are looking for does not exist on PRISM Assessment Platform',
        keywords: '404, page not found, PRISM'
      }
    }
  }
];
