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
import { ResultComponent } from './instructor/result/result.component';
import { ComponentTestingComponent } from './component-testing/component-testing.component';

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
    {path: 'instructor/result', component: ResultComponent },
    //user routes
    {path: 'user/dashboard', component:  UhomeComponent},
    {path: 'pagetest', component:  ComponentTestingComponent},



    //admin routes
    {path: 'test', component: TestComponent },
    {path: '**', redirectTo: 'login'}
];
