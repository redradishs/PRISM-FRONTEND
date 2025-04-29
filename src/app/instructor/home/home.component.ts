import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsConfiguration, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { SidebarComponent } from "../../adons/sidebar/sidebar.component";
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';

interface AssessmentProgress {
  id: string;
  assessmentId: string;
  title: string;
  startDate: string;
  dueDate: string;
  timeLimit: number;
  type: string;
  masteryScore?: number;
  modeSettings?: {
    joiningCode: string;
    masteryScore?: number;
  };
  classes: {
    classCode: string;
    className: string;
    totalStudents: number;
    stats: {
      inProgress: number;
      submitted: number;
      graded: number;
      mastered?: number;
    };
    remainingStudents: number;
    responses: {
      status: string;
      score: number;
      studentId: string;
    }[];
  }[];
}


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    SidebarComponent,
    SidebarComponent,
    RouterLink
],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  userId: string = '';
  username: string = '';
  totalStudents: number = 0;
  totalActiveAssessments: number = 0;
  totalClasses: number = 0;
  onGoingAssessments: AssessmentProgress[] = [];
  totalOngoingAssessments: number = 0;
  remainingOngoingAssessments: number = 0;
  showAllOngoing: boolean = false;
  scheduledAssessments: AssessmentProgress[] = [];
  totalScheduledAssessments: number = 0;
  remainingScheduledAssessments: number = 0;

  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  constructor(private api: ApiService, private auth: AuthService, private router: Router, private titleService: Title) {
    this.titleService.setTitle('PRISM | Home');
  }

  ngOnInit() {
    this.auth.getCurrentUser().subscribe((user) => {
      if(user) {
        console.log('User ID:', user.id);
        this.userId = user.id;
        this.username = user.name;
        this.getTotalStudents(this.userId);
        this.getActiveAssessments(this.userId);
        this.getTotalClases(this.userId);
        this.getOnGoingAssessments(this.userId);
        this.getScheduledAssessments(this.userId);
      } else {
        console.log('No user found');
      }
    })
  }


  getTotalStudents(userId: string) {
    this.api.getInstructorTotalStudents(this.userId).subscribe((resp: any) => {
      try {
        console.log('Total students:', resp.data);
        if (resp.data != null || 0) {
          this.totalStudents = resp.data;
          console.log('Total students:', this.totalStudents);
        } else {
          this.totalStudents = 0;
        }

      } catch (error) {
        console.error('Error getting total students:', error);
      }
    })
  }

  getActiveAssessments(userId: string) {
    this.api.getActiveAssessments(this.userId).subscribe((resp: any) => {
      try {
        console.log('Active assessments:', resp.data);
        this.totalActiveAssessments = resp.data;
      } catch (error) {
        console.error('Error getting active assessments:', error);
      }
    })
  }

  getTotalClases(userId: string) {
    this.api.getTotalClassess(this.userId).subscribe((resp: any) => {
      try {
        console.log('Total classes:', resp.data);
        this.totalClasses = resp.data;

      } catch (error) {
        console.error('Error getting total classes:', error);
      }
    })
  }

  viewAll() {
    this.router.navigate(['/instructor/manage'], { queryParams: { tab: 'ongoing' } });
  }

  calculateProgress(assessment: AssessmentProgress): number {
    if (assessment.type === 'Public Assessment') {
      return 0;
    }
    const totalStudents = assessment.classes[0]?.totalStudents || 0;
    const gradedCount = assessment.classes[0]?.stats.submitted || 0;
    return totalStudents > 0 ? (gradedCount / totalStudents) * 100 : 0;
  }


  getOnGoingAssessments(userId: string) {
    this.api.getOngoingAssessments(this.userId, 4).subscribe((resp: any) => {
      try {
        this.onGoingAssessments = resp.data.data;
        this.totalOngoingAssessments = resp.data.total;
        this.remainingOngoingAssessments = resp.data.left;
      } catch (error) {
        console.error('Error getting ongoing assessments:', error);
      }
    })
  }

  getDisplayedOngoingAssessments() {
    return this.showAllOngoing ? this.onGoingAssessments : this.onGoingAssessments.slice(0, 6);
  }

  gotoAssessment(_id: string){
    this.router.navigate(['/instructor/result'], {
      state: {assessmentId: _id}
    })

  }






  
  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  avatarUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5-iAyPUASJXmi0DniNhzXGrxUx6gklaG.png';

  assessments = [
    { block: 'BSIT BLOCK A', subject: 'NETWORKING 2: 7 OSI LAYER', progress: 85 },
    { block: 'BSIT BLOCK B', subject: 'NETWORKING 2: 7 OSI LAYER', progress: 65 },
    { block: 'BSIT BLOCK D', subject: 'NETWORKING 2: 7 OSI LAYER', progress: 95 }
  ];

  // Bar Chart Configuration
  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['3A', '3B', '3C', '3B', '2D', '1B', '4A', '4D'],
    datasets: [{
      data: [85, 65, 55, 45, 35, 55, 40, 55],
      backgroundColor: '#0052CC',
      label: 'Performance'
    }]
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  // Pie Chart Configuration
  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Block A', 'Block B', 'Block C', 'Block D'],
    datasets: [{
      data: [30, 20, 25, 25],
      backgroundColor: ['#0052CC', '#4C2A85', '#E63946', '#40C4AA']
    }]
  };

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  createNewAssessment() {
    this.router.navigate(['/instructor/generate']);
  }

  addStudent() {
    this.router.navigate(['instructor/students']);
  }

  getAssessmentTypeLabel(assessment: any): string {
    return assessment.type || 'Assessment';
  }

  getAssessmentTypeIcon(assessment: AssessmentProgress): string {
    switch (assessment.type) {
      case 'Mastery':
        return 'fa-trophy';
      case 'Public Assessment':
        return 'fa-globe';
      default:
        return 'fa-clipboard-check';
    }
  }

  getAssessmentTypeColor(assessment: AssessmentProgress): string {
    switch (assessment.type) {
      case 'Mastery':
        return 'amber';
      case 'Public Assessment':
        return 'blue';
      default:
        return 'indigo';
    }
  }

  getAssessmentTotalStudents(assessment: any): number {
    if (assessment.type === 'Public Assessment') {
      return 0; // Public assessments don't have students yet
    }
    return assessment.classes.reduce((total: number, classData: any) => total + classData.totalStudents, 0);
  }

  getJoiningCode(assessment: any): string {
    return assessment.type === 'Public Assessment' ? assessment.modeSettings?.joiningCode : '';
  }

  getScheduledAssessments(userId: string) {
    this.api.getScheduledAssessments(this.userId, 4).subscribe((resp: any) => {
      try {
        this.scheduledAssessments = resp.data.data;
        this.totalScheduledAssessments = resp.data.total;
        this.remainingScheduledAssessments = resp.data.left;
      } catch (error) {
        console.error('Error getting scheduled assessments:', error);
      }
    })
  }

}