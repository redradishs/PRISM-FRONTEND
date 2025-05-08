import { CommonModule } from '@angular/common';
import { Component, HostListener, ViewChild, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import Swal from 'sweetalert2';

interface Student {
  id: number;
  name: string;
  block: string;
  score: number;
  performance: string;
  percentage: number;
} 

interface QuestionData {
  id: number;
  question: string;
  correct: number;
  incorrect: number;
  successRate: number;
}

interface SubmissionStatus {
  submitted: number;
  inProgress: number;
  notStarted: number;
  total: number;
}

@Component({
  selector: 'app-result',
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent, FormsModule],
  templateUrl: './result.component.html',
  styleUrl: './result.component.css'
})
export class ResultComponent implements OnInit {
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  isMobile = window.innerWidth < 768;
  sidebarOpen = !this.isMobile;
  @HostListener('window:resize')
  onResize() {
    const wasDesktop = !this.isMobile;
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile && !wasDesktop) {
      this.sidebarOpen = true;
    }
  }
  showSettings: boolean = false;
  assessmentId: string = '';
  classOverview: any = {
    mode: String,
    totalStudents: 0,
    averageScore: 0,
    highestScore: 0, 
    lowestScore: 0
  };
  username: string = '';
  itemAnalysis: any[] = [];
  topPerforming: Student[] = [];
  leastPerforming: Student[] = [];

  searchTerm: string = '';
  selectedStatus: string = 'all';
  allStudents: any[] = [];
  filteredStudents: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 9;
  activeTab: string = 'results';
  classResult: any;
  className: string = '';
  classCode: string = '';
  assessmentTitle: string = '';
  studentResult: any;
  questions: any;
  questionLength: number = 0;
  scoreDistribution: any;
  submissionStatus: SubmissionStatus = {
    submitted: 0,
    inProgress: 0,
    notStarted: 0,
    total: 0
  };
  completionStatistics: any;
  isLoading: boolean = true;
  selectedQuestionType: string = 'all';
  allQuestions: any[] = [];
  userId: String = '';

  constructor(private api: ApiService, private auth: AuthService, private router: Router, private titleService: Title) {
    this.titleService.setTitle('PRISM | Result');
  }

  ngOnInit(): void {
    const state = history.state as { assessmentId: string };
    
    if (state && state.assessmentId) {
      this.assessmentId = state.assessmentId;
      this.isLoading = true;
      Promise.all([
        this.getResultOverview(this.assessmentId),
        this.getItemAnalysis(this.assessmentId),
        this.getStudentPerformance(this.assessmentId),
        this.getClassResult(this.assessmentId)
      ]).finally(() => {
        this.isLoading = false;
      });
      console.log('Assessment ID:', this.assessmentId);
    } else {
      console.log("Could not find the assessment ID");
      this.router.navigate(['/instructor/assessment']);
    }

    this.auth.getCurrentUser().subscribe((user) => {
      this.userId = user.id,
      this.username = user.name;
    });
  }

  getResultOverview(id: string) {
    this.api.getClassOverview(this.assessmentId).subscribe({
      next: (resp: any) => {
        this.classOverview = resp.data;
        this.assessmentTitle = resp.data.assessmentTitle;
        if (resp.data.classes && resp.data.classes.length > 0) {
          this.className = resp.data.classes[0].className;
          this.classCode = resp.data.classes[0].classCode;
        }
        console.log('Assessment Title:', this.assessmentTitle);
        console.log('Class Code:', this.classCode);
        console.log('Class Overview:', this.classOverview);
      },
      error: (error) => {
        console.error('Error getting class overview:', error);
      }
    });
  }

  getItemAnalysis(id: string) {
    this.api.getQuestionAnalysis(this.assessmentId).subscribe({
        next: (resp: any) => {
            console.log('Question Analysis Response:', resp.data);
            this.itemAnalysis = resp.data;
            if (resp.data && resp.data.questions) {
                this.allQuestions = resp.data.questions;
                this.questions = [...this.allQuestions];
                this.questionLength = this.questions.length;
                console.log('Questions loaded:', this.questions);
                console.log('Question Length:', this.questionLength);
            }
        },
        error: (error) => {
            console.error('Error getting item analysis:', error);
        }
    });
  }

  getStudentPerformance(id: string) {
    this.api.getTopandLowPerformers(this.assessmentId).subscribe(({
      next: (resp: any) => {
        this.topPerforming = resp.data.studentPerformance.topPerformers;
        this.leastPerforming = resp.data.studentPerformance.strugglingStudents;
        console.log('Top Performing Students:', this.topPerforming);
        console.log('Least Performing Students:', this.leastPerforming);

        //////student performance 
        this.scoreDistribution = resp.data.scoreDistribution;
        this.submissionStatus = resp.data.submissionStatus;
        this.completionStatistics = resp.data.submissionStatus;
      }, error: (error) => {
        console.error('Error getting student performance:', error);
      }
    }))
  }

  getClassResult(id: string) {
    this.api.getClassScore(this.assessmentId).subscribe({
      next: (resp: any) => {
        console.log('Class Result:', resp.data);
        this.classResult = resp.data;
        this.allStudents = resp.data.results;
        this.filteredStudents = [...this.allStudents];
      },
      error: (error) => {
        console.error('Error getting class result:', error);
      }
    });
  }

  toggleShowSettings(){
    this.showSettings =!this.showSettings;
  } 

  filterStudents() {
    this.filteredStudents = this.allStudents.filter(student => {
      const statusMatch = this.selectedStatus === 'all' || 
                         student.status.toLowerCase() === this.selectedStatus;

      const searchMatch = !this.searchTerm ||
                         student.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                         (student.block && student.block.toLowerCase().includes(this.searchTerm.toLowerCase()));

      return statusMatch && searchMatch;
    });
  }

  filterQuestions() {
    if (this.selectedQuestionType === 'all') {
        this.questions = [...this.allQuestions];
    } else {
        this.questions = this.allQuestions.filter(question => 
            question.questionType.toLowerCase() === this.selectedQuestionType.toLowerCase()
        );
    }
    this.questionLength = this.questions.length;
    console.log('Filtered Questions:', this.questions);
    console.log('Selected Type:', this.selectedQuestionType);
  }

  insights = [
    "Students Struggled Most with understanding each Layer specifically the 3rd Layer",
  ];

  assessmentDetails(id: string) {
    this.router.navigate(['/instructor/response'], {
      state: { studentId: id, assessmentId: this.assessmentId }
    });
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  get totalPages() {
    return Math.ceil(this.filteredStudents.length / this.itemsPerPage);
  }

  get currentStudents() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredStudents.slice(start, end);
  }

  getPerformanceColor(performance: string): string {
    switch (performance) {
      case "Excellent":
        return "text-green-500";
      case "Good":
        return "text-orange-500";
      case "Needs Improvement":
        return "text-red-500";
      default:
        return "";
    }
  }

  getAssessmentTypeIcon(assessment: string): string {
    switch (assessment) {
      case 'mastery':
        return 'fa-trophy';
      case 'public assessment':
        return 'fa-globe';
      case 'assessment':
        return 'fa-clipboard-check';
      default:
        return 'fa-clipboard-check';
    }
  }

  getAssessmentTypeColor(assessment: string): string {
    switch (assessment) {
      case 'mastery':
        return '#d97706'; 
      case 'public assessment':
        return '#2563eb'; 
      case 'assessment':
        return '#4f46e5'; 
      default:
        return '#4f46e5'; 
    }
  }

  endAssessment() {
    Swal.fire({
      title: 'End Assessment?',
      text: 'This will end the assessment for all students. Are you sure you want to proceed?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, end it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    }).then((result) => {
      if (result.isConfirmed) {
        const data = {
          instructorId: this.userId,
          assignedAssessmentId: this.assessmentId
        }
        this.api.endNow(data).subscribe({
          next: (resp: any) => {
            Swal.fire({
              title: 'Assessment Ended',
              text: 'The assessment has been ended successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.getResultOverview(this.assessmentId);
          },
          error: (error) => {
            Swal.fire({
              title: 'Error',
              text: 'Failed to end the assessment. Please try again.',
              icon: 'error',
              confirmButtonColor: '#dc2626'
            });
            console.error('Error ending assessment:', error);
          }
        });
      }
    });
  }

  extendAssessment() {
    Swal.fire({
      title: 'Extend Assessment?',
      text: 'This will extend the assessment time by 1 hour. Do you want to continue?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, extend it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#6b7280',
    }).then((result) => {
      if (result.isConfirmed) {
        const data = {
          instructorId: this.userId,
          assignedAssessmentId: this.assessmentId
        }
        this.api.extendNow(data).subscribe({
          next: (resp: any) => {
            Swal.fire({
              title: 'Assessment Extended',
              text: 'The assessment time has been extended by 1 hour',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.getResultOverview(this.assessmentId);
          },
          error: (error) => {
            Swal.fire({
              title: 'Error',
              text: 'Failed to extend the assessment. Please try again.',
              icon: 'error',
              confirmButtonColor: '#dc2626'
            });
            console.error('Error extending assessment:', error);
          }
        });
      }
    });
  }

  startAssessment() {
    Swal.fire({
      title: 'Start Assessment?',
      text: 'This will start the assessment for all students. Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, start it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#6b7280',
    }).then((result) => {
      if (result.isConfirmed) {
        const data = {
          instructorId: this.userId,
          assignedAssessmentId: this.assessmentId
        }
        this.api.startNow(data).subscribe({
          next: (resp: any) => {
            Swal.fire({
              title: 'Assessment Started',
              text: 'The assessment has been started successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.getResultOverview(this.assessmentId);
          },
          error: (error) => {
            Swal.fire({
              title: 'Error',
              text: 'Failed to start the assessment. Please try again.',
              icon: 'error',
              confirmButtonColor: '#dc2626'
            });
            console.error('Error starting assessment:', error);
          }
        });
      }
    });
  }

  getProgressWidth(score: number): string {
    return `${score}%`;
  }

  handlePrevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  handleNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

}
