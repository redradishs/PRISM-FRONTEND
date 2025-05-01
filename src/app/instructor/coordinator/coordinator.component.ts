import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-coordinator',
  imports: [SidebarComponent, CommonModule],
  templateUrl: './coordinator.component.html',
  styleUrl: './coordinator.component.css'
})
export class CoordinatorComponent {
  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  userId: string = '';
  username: string = '';
  
  constructor(private router: Router, private api: ApiService, private auth: AuthService, private title: Title) {
    this.title.setTitle('PRISM | Coordinator');
  }

  ngOnInit(): void {
   this.auth.getCurrentUser().subscribe((user) => {
    this.userId = user.id;
    this.username = user.name || '';
   })

  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  createNewAssessment() {
    this.router.navigate(['/instructor/generate']);
  }

  addStudent() {
    this.router.navigate(['/instructor/students']);
  }
}
