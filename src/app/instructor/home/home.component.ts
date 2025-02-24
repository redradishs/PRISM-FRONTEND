import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { HeaderComponent } from "../../adons/header/header.component";
import { CommonModule } from '@angular/common';
import { NgChartsConfiguration, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { SidebarComponent } from "../../adons/sidebar/sidebar.component";
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface AssessmentProgress {
  assessmentId: string;
  title: string;
  startDate: string;
  dueDate: string;
  dueTime: string;
  timeLimit: number;
  classes: {
    classCode: string;
    className: string;
    totalStudents: number;
    stats: {
      inProgress: number;
      submitted: number;
      graded: number;
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
    SidebarComponent
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





  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  constructor(private api: ApiService, private auth: AuthService) {
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

  calculateProgress(assessment: AssessmentProgress): number {
    const totalStudents = assessment.classes[0].totalStudents;
    const gradedCount = assessment.classes[0].stats.graded;
    return totalStudents > 0 ? (gradedCount / totalStudents) * 100 : 0;
  }


  getOnGoingAssessments(userId: string) {
    this.api.getOngoingAssessments(this.userId).subscribe((resp: any) => {
      try {
        this.onGoingAssessments = resp.data;
        console.log('Ongoing assessments:', JSON.stringify(this.onGoingAssessments, null, 2));
      } catch (error) {
        console.error('Error getting ongoing assessments:', error);
      }
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


}