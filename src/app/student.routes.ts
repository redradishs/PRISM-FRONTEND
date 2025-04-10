import { Routes } from '@angular/router';
import { StudHomeComponent } from './students/stud-home/stud-home.component';
import { StudClassesComponent } from './students/stud-classes/stud-classes.component';
import { StudClassDetailsComponent } from './students/stud-classdetails/stud-classdetails.component';
import { StudTakeexamComponent } from './students/stud-takeexam/stud-takeexam.component';
import { StudHistoryComponent } from './students/stud-history/stud-history.component';
import { StudConfirmationComponent } from './students/stud-confirmation/stud-confirmation.component';
import { ProfileComponent } from './students/profile/profile.component';
import { StudeAssessmentresultComponent } from './students/stude-assessmentresult/stude-assessmentresult.component';

export const STUDENT_ROUTES: Routes = [
    { path: 'dashboard', component: StudHomeComponent },
    { path: 'classes', component: StudClassesComponent },
    { path: 'classes/details', component: StudClassDetailsComponent },
    { path: 'assessment/take', component: StudTakeexamComponent },
    { path: 'history', component: StudHistoryComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'result', component: StudeAssessmentresultComponent },
    { path: 'assessment/result', component: StudeAssessmentresultComponent },
    { path: 'confirmation', component: StudConfirmationComponent }
]; 