import { Routes } from '@angular/router';
import { LoginComponent } from './adons/login/login.component';
import { SignupComponent } from './adons/signup/signup.component';
import { HomeComponent } from './instructor/home/home.component';
import { StudentsComponent } from './instructor/students/students.component';
import { AssessmentComponent } from './instructor/assessment/assessment.component';
import { ProfileComponent } from './instructor/profile/profile.component';
import { GenerateAssessmentComponent } from './instructor/generate-assessment/generate-assessment.component';
import { TakeAssessmentComponent } from './instructor/take-assessment/take-assessment.component';
import { TestComponent } from './adons/test/test.component';
import { UhomeComponent } from './user/uhome/uhome.component';

export const routes: Routes = [
    {path: '', redirectTo: 'login', pathMatch: 'full'},
    {path: 'login', component: LoginComponent},
    {path: 'signup', component: SignupComponent},

    //instructor routes
    {path: 'instructor/dashboard', component: HomeComponent },
    {path: 'instructor/students', component: StudentsComponent },
    {path: 'instructor/assessment', component: AssessmentComponent },
    {path: 'instructor/profile', component: ProfileComponent },
    {path: 'instructor/generate', component: GenerateAssessmentComponent },
    {path: 'instructor/takeassessment', component: TakeAssessmentComponent },

    //user routes
    {path: 'user/dashboard', component:  UhomeComponent},



    //admin routes
    {path: 'test', component: TestComponent },
    {path: '**', redirectTo: 'login'}
];
