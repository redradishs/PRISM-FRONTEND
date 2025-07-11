import { Routes } from '@angular/router';
import { AdmDashboardComponent } from './admin/adm-dashboard/adm-dashboard.component';
import { AdmProfileComponent } from './admin/adm-profile/adm-profile.component';
import { AdmUserlistComponent } from './admin/adm-userlist/adm-userlist.component';
import { AdmSystemsettingsComponent } from './admin/adm-systemsettings/adm-systemsettings.component';

export const ADMIN_ROUTES: Routes = [
    { path: 'dashboard', component: AdmDashboardComponent },
    { path: 'profile', component: AdmProfileComponent },
    { path: 'users', component: AdmUserlistComponent },
    { path: 'settings', component: AdmSystemsettingsComponent }
];
