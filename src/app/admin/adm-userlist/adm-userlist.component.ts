import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-adm-userlist',
  imports: [CommonModule, SidebarComponent],
  templateUrl: './adm-userlist.component.html',
  styleUrl: './adm-userlist.component.css'
})
export class AdmUserlistComponent {
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
