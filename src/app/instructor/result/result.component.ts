import { CommonModule } from '@angular/common';
import { Component, HostListener, ViewChild, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

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

  assessmentId: string = '';
  classOverview: any = {
    totalStudents: 0,
    averageScore: 0,
    highestScore: 0, 
    lowestScore: 0
  };
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
