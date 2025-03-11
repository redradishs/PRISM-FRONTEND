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
import { ResultComponent } from './instructor/result/result.component';
import { ComponentTestingComponent } from './component-testing/component-testing.component';
import { StudHomeComponent } from './students/stud-home/stud-home.component';
import { StudClassesComponent } from './students/stud-classes/stud-classes.component';
import { StudClassDetailsComponent } from './students/stud-classdetails/stud-classdetails.component';
import { StudTakeexamComponent } from './students/stud-takeexam/stud-takeexam.component';
import { StudHistoryComponent } from './students/stud-history/stud-history.component';
import { CreateAssessmentComponent } from './instructor/create-assessment/create-assessment.component';
export const routes: Routes = [
    {path: '', redirectTo: 'login', pathMatch: 'full'},
    {path: 'login', component: LoginComponent},
    {path: 'signup', component: SignupComponent},

    //instructor routes
    {path: 'instructor/dashboard', component: HomeComponent },
    {path: 'instructor/students', component: StudentsComponent },
    {path: 'instructor/assessment', component: AssessmentComponent },
    {path: 'instructor/profile', component: ProfileComponent },
    {path: 'instructor/create', component: GenerateAssessmentComponent },
    {path: 'instructor/takeassessment', component: TakeAssessmentComponent },
    {path: 'instructor/result', component: ResultComponent },
    {path: 'instructor/generate', component: CreateAssessmentComponent },
    //user routes
    {path: 'pagetest', component:  ComponentTestingComponent},
    {path: 'student/dashboard', component: StudHomeComponent},
    {path: 'student/classes', component:  StudClassesComponent},
    {path: 'student/classes/details', component:  StudClassDetailsComponent},
    {path: 'student/assessment/take', component:  StudTakeexamComponent},
    {path: 'student/history', component:  StudHistoryComponent},



    //admin routes
    {path: 'test', component: TestComponent },
    {path: '**', redirectTo: 'login'}
];
