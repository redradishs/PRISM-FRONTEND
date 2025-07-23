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
        console.log(resp);
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
        console.log(resp);
        this.dbData = resp.data;
        this.storageUsageFormula();
      },
      error: err => {
        console.error(err);
        this.isLoading = false;
      }
    })
  }

  storageUsageFormula() {
    const dbInfo = this.dbData.dbData;
    const totalSize = 500;
    const usedSize = dbInfo.storageSize || '0 MB';
    const usedSizeNum = parseFloat(usedSize.replace(' MB', ''));
    const storagePercentage = (usedSizeNum / totalSize) * 100;
    console.log('Storage Percentage:', storagePercentage.toFixed(2));
    this.storageUsedPercentage = Number(storagePercentage.toFixed(2));
  }


}
