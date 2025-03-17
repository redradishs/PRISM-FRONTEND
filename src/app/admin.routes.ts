import { Routes } from '@angular/router';
import { HomeComponent } from './instructor/home/home.component';

export const ADMIN_ROUTES: Routes = [
    { path: 'dashboard', component: HomeComponent }
];
