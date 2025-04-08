import { Routes } from '@angular/router';
import { HomeComponent } from './instructor/home/home.component';
import { StudentsComponent } from './instructor/students/students.component';
import { AssessmentComponent } from './instructor/assessment/assessment.component';
import { GenerateAssessmentComponent } from './instructor/generate-assessment/generate-assessment.component';
import { TakeAssessmentComponent } from './instructor/take-assessment/take-assessment.component';
import { ResultComponent } from './instructor/result/result.component';
import { CreateAssessmentComponent } from './instructor/create-assessment/create-assessment.component';
import { ProfileInstComponent } from './instructor/profile-inst/profile-inst.component';

export const INSTRUCTOR_ROUTES: Routes = [
    { path: 'dashboard', component: HomeComponent },
    { path: 'students', component: StudentsComponent },
    { path: 'assessment', component: AssessmentComponent },
    { path: 'profile', component: ProfileInstComponent },
    { path: 'create', component: GenerateAssessmentComponent },
    { path: 'takeassessment', component: TakeAssessmentComponent },
    { path: 'result', component: ResultComponent },
    { path: 'generate', component: CreateAssessmentComponent }
]; 