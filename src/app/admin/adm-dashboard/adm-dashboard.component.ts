import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { TitleService } from '../../services/title.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-adm-dashboard',
  imports: [CommonModule, SidebarComponent, RouterLink],
  templateUrl: './adm-dashboard.component.html',
  styleUrl: './adm-dashboard.component.css'
})
export class AdmDashboardComponent {
  userId: string = '';
  username: string = '';
  profile: string = '';
  isMobile = window.innerWidth < 768;
  isLoading: boolean = false;
  basicData: any = [];
  dbData: any = [];
  storageUsedPercentage: number = 0;
  recentActivities: any = [];
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }



  constructor(private auth: AuthService, private api: AdminService, private title: TitleService) {
    this.title.setTitle('Admin Dashboad | PRISM')
  }


  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe(user => {
      this.userId = user.id,
        this.username = user.name,
        this.profile = user.profilePicture
      this.getData();
      this.getDBData();
      this.getRecentActs();
    })
  }


  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  getData() {
    this.api.getBasicData().subscribe({
      next: (resp: any) => {
        // console.log(resp);
        this.basicData = resp.data;
        this.isLoading = false;
      },
      error: err => {
        console.error(err);
        this.isLoading = false;
      }
    })
  }

  getDBData() {
    this.api.getDBData().subscribe({
      next: (resp: any) => {
        // console.log(resp);
        this.dbData = resp.data;
        this.storageUsageFormula();
      },
      error: err => {
        console.error(err);
        this.isLoading = false;
      }
    })
  }

  getRecentActs() {
    this.api.getRecentActivities().subscribe({
      next: (resp: any) => {
        this.recentActivities = resp.data.activities;
        // console.log(resp)
      },
      error: (error: any) => {
        console.log(error)
      }
    })
  }

  storageUsageFormula() {
    const dbInfo = this.dbData.dbData;
    const totalSize = 500;
    const usedSize = dbInfo.storageSize || '0 MB';
    const usedSizeNum = parseFloat(usedSize.replace(' MB', ''));
    const storagePercentage = (usedSizeNum / totalSize) * 100;
    // console.log('Storage Percentage:', storagePercentage.toFixed(2));
    this.storageUsedPercentage = Number(storagePercentage.toFixed(2));
  }

  getActivityIcon(action: string): { class: string, icon: string } {
    const actionLower = action.toLowerCase();

    if (actionLower.includes('login') || actionLower.includes('password') || actionLower.includes('profile')) {
      return { class: 'activity-user', icon: 'fa-user' };
    } else if (actionLower.includes('assessment') || actionLower.includes('exam')) {
      return { class: 'activity-assessment', icon: 'fa-file-alt' };
    } else if (actionLower.includes('class') || actionLower.includes('archive')) {
      return { class: 'activity-instructor', icon: 'fa-chalkboard-teacher' };
    } else if (actionLower.includes('submitted') || actionLower.includes('grade')) {
      return { class: 'activity-grade', icon: 'fa-check-circle' };
    } else {
      return { class: 'activity-system', icon: 'fa-cog' };
    }
  }

  getRelativeTime(timestamp: string): string {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return activityTime.toLocaleDateString();
  }


}
