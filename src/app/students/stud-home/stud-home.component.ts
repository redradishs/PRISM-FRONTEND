import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { StudentService } from '../../services/student.service';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-stud-home',
  imports: [SidebarComponent, CommonModule, RouterLink],
  templateUrl: './stud-home.component.html',
  styleUrl: './stud-home.component.css'
})
export class StudHomeComponent {
 isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  activeTab = 'upcoming';
  userId: string = '';
  username: string = '';
  totalUpcomingAssessments: number = 0;
  totalActiveAssessments: number = 0;
  totalClasses: number = 0;
  totalCompletedAssessments: number = 0;
  onGoingAssessments: any[] = [];
  upcomingAssessments: any[] = [];
  completedAssessments: any[] = [];
  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  constructor(private auth: AuthService, private api: StudentService, private titleService: Title, private router: Router) {
    this.titleService.setTitle('PRISM | Dashboard');
  }

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe({
      next: (resp: any) => {
        this.userId = resp.id;
        this.username = resp.name;
        this.getStatistics(this.userId);
      },
      error: (err) => {
        console.log(err);
      }
    })
    
  }

  getStatistics(id: string) {
    this.api.getDashboardData(this.userId).subscribe({
      next: (resp: any) => {
        this.totalUpcomingAssessments = resp.data.stats.totalScheduled;
        this.totalActiveAssessments = resp.data.stats.totalOngoing;
        this.totalCompletedAssessments = resp.data.stats.totalCompleted;
        this.totalClasses = resp.data.stats.totalClasses;
        this.onGoingAssessments = resp.data.ongoing;
        this.upcomingAssessments = resp.data.scheduled;
        this.completedAssessments = resp.data.completed;
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  gotoAssessments(id: string) {
    this.router.navigate(['/student/confirmation'], {
      state: { assessmentId: id }
    });
    console.log("I received this id", id);
  }
}
