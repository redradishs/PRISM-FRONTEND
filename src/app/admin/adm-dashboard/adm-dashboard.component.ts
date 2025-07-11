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
  isLoading: boolean = false; //dfg to change
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }



  constructor(private auth: AuthService, private api: AdminService) {
  }


  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe(user => {
      this.userId = user.id,
        this.username = user.name,
        this.profile = user.profilePicture
    })


  }



  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }


}
