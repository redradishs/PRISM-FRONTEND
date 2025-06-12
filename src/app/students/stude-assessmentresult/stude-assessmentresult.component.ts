import { Component, HostListener, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { StudentService } from '../../services/student.service';
import Swal from 'sweetalert2';

interface Question {
  questionId: string;
  questionText: string;
  type: string;
  points: number;
  pointsEarned: number;
  isCorrect: boolean;
  studentAnswer: string | string[];
  correctAnswer: string | string[];
  options?: string[];
}

interface AssessmentResult {
  assessmentTitle: string;
  score: number;
  totalItems: number;
  correctAnswers: number;
  incorrectAnswers: number;
  passingScore: number;
  submittedAt: string;
  passed: boolean;
  status: string;
  mode: string;
  remainingAttempts: number;
  masteryAchieved: boolean;
  canRetake: boolean;
  showResult: string;
  questions: Question[];
  questionTypes: {
    type: string;
    total: number;
    correct: number;
    percentage: number;
  }[];
  ranking: {
    rank: number;
    totalStudents: number;
    submittedCount: number;
    percentile: number;
  };
  statistics: {
    classAverage?: number;
    publicAverage?: number;
    topScore: number;
    timeSpent: {
      raw: number;
      formatted: string;
    };
  };
}

@Component({
  selector: 'app-stude-assessmentresult',
  standalone: true,
  imports: [SidebarComponent, CommonModule],
  templateUrl: './stude-assessmentresult.component.html',
  styleUrl: './stude-assessmentresult.component.css'
})
export class StudeAssessmentresultComponent implements OnInit {
  isMobile = window.innerWidth < 768;
  activeTab = 'overview';
  currentQuestionIndex = 0;
  Math = Math;
  String = String;

  assignedAssessmentId: string = '';
  userId: string = '';
  result!: AssessmentResult;
  questionType: any;
  
  questions: any[] = [];
  isFinished = false;
  analysis: any[] = [];
  username: string = '';
  profile: string = '';
  insights: any;
  search: any;
  searchResults: any;
  
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  
  showMasteryCelebration = false;
  outroActive = false;
  
  constructor(private auth: AuthService, private api: StudentService, private router: Router, private cdr: ChangeDetectorRef, private ai: ApiService) {
    const navigation = this.router.getCurrentNavigation();
    if(navigation?.extras.state) {
      this.assignedAssessmentId = navigation.extras.state['assessmentId'];
      console.log('Assigned Assessment ID:', this.assignedAssessmentId);
    } else {
      console.error('No assigned assessment ID found in the router state.');
      this.router.navigate(['/student/dashboard']);
    }
  }

  ngOnInit() {
    this.checkMobile();

    this.auth.getCurrentUser().subscribe(user => {
      this.userId = user.id;
      this.username = user.name;
      this.profile = user.profilePicture;
      console.log('Username:', this.username);
      this.getResult();
      this.getPerformancePerQuestion(); 
      console.log('User ID:', this.userId);
    });
  }

  getResult() {
    this.api.getResultData(this.userId, this.assignedAssessmentId).subscribe({
      next: (resp: any) => {
        if (resp.remarks === 'Success') {
          this.result = resp.data;
          if(this.result.showResult === 'immediate') {
            this.viewAllQuestions();
            this.isFinished = true;
          }
          if(this.result.status === 'completed') {
            this.viewAllQuestions();
            this.isFinished = true;
          }
          if (this.result?.masteryAchieved) {
            this.showMasteryCelebration = true;
            this.outroActive = false;
            this.cdr.detectChanges();
            setTimeout(() => {
              this.outroActive = true;
              this.cdr.detectChanges();
              setTimeout(() => {
                this.showMasteryCelebration = false;
                this.outroActive = false;
                this.cdr.detectChanges();
              }, 400);
            }, 2600);
          }
        }
      },
      error: (error) => {
        console.error('Error fetching assessment result:', error);
      }
    })
  }

  getPerformancePerQuestion() {
    this.api.getPerformanceData(this.userId, this.assignedAssessmentId).subscribe({
      next: (resp: any) => {
        if (resp.remarks === 'Success') {
          this.questionType = resp.data;
          console.log('Performance per question:', this.questionType);
        }
      },
      error: (error) => {
        console.error('Error fetching performance data:', error);
      }
    })
  }

  viewAllQuestions() {
    this.api.getQuestionOverview(this.userId, this.assignedAssessmentId).subscribe({
      next: (resp: any) => {
        if (resp.remarks === 'Success') {
          this.analysis = [];
          
          if (resp.data && resp.data.questions) {
            this.analysis = resp.data.questions;
            this.getAssessmentInsights();
          }
          
          console.log('Analysis:', this.analysis);  
          console.log('Question overview:', resp.data);
        }
      },
      error: (error) => {
        console.error('Error fetching question overview:', error);
      }
    })
  }

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  checkMobile() {
    this.isMobile = window.innerWidth < 768;
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  handleNextQuestion() {
    if (this.currentQuestionIndex < this.result.questions.length - 1) {
      this.currentQuestionIndex++;
    }

  }

  handlePreviousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  calculateProgress(percentage: number): string {
    return `${percentage}%`;
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

  getQuestionTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'multiple-choice':
        return 'fa-list-ul';
      case 'enumeration':
        return 'fa-list-ol';
      default:
        return 'fa-question';
    }
  }

  getFriendlyTypeName(type: string): string {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  retakeAssessment() {
   Swal.fire({
    title: 'Are you sure you want to retake this assessment?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, retake it!'
   }).then((result: any) => {
    if(result.isConfirmed) {
      const data = {
        assignedAssessmentId: this.assignedAssessmentId,
        studentId: this.userId
      }
      this.api.recordStartTime(data).subscribe({
        next: (resp: any) => {
          console.log('Successfully recorded start time', resp);
          if(this.result.mode !== 'mastery') {
            this.router.navigate(['student/assessment/take/normal'], {
              state: { assessmentId: this.assignedAssessmentId }
            });
          } else {
            this.router.navigate(['student/assessment/take'], {
              state: { assessmentId: this.assignedAssessmentId }
            });
          }
        },
        error: (error) => {
          console.error('Error recording start time:', error);
          Swal.fire({
            title: 'Oops! ',
            icon: 'error',
            text: 'Error retaking the assessment. Please try again later.'          
          })
        }
      })
    }     
    
   })
  }

  formatAnswer(answer: string | string[]): string {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return answer;
  }
  
  scrollToQuestion(index: number) {
    const element = document.getElementById(`question-${index}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  calculatePercentile(rank: number, totalStudents: number): number {
    if (totalStudents <= 1) return 100;
    return Math.round(((totalStudents - rank) / (totalStudents - 1)) * 100);
  }

  goAssessment() {
    this.router.navigate(['/student/history']);
  }

  goHome() {
    this.router.navigate(['/student/dashboard']);
  }

  getRankingDisplay() {
    if (this.result.mode === 'public') {
      return {
        rank: this.result.ranking.rank,
        total: this.result.ranking.totalStudents,
        percentile: this.result.ranking.percentile
      };
    }
    return {
      rank: this.result.ranking.rank,
      total: this.result.ranking.totalStudents,
      percentile: this.result.ranking.percentile
    };
  }

  getAverageScore(): number {
    if (this.result.mode === 'public') {
      return this.result.statistics.publicAverage || 0;
    }
    return this.result.statistics.classAverage || 0;
  }

  getAssessmentInsights() {
    const data = {
      questions: this.analysis
    }
    console.log('This is the result of this assessment', this.analysis)
    this.ai.analyzeStudent(data).subscribe({
      next: (resp: any) => {
        console.log('Successfully analyzed the assessment', resp);
        this.insights = resp.feedback;
        if(resp.search_queries) {
          this.search = resp.search_queries[0];
          this.searchMaterials();
        }
      },
      error: (error) => {
        console.error('Error analyzing the assessment:', error);
      }
    })
  }

  searchMaterials() {
    const data = {
      query: this.search
    }
    this.ai.recommendedMaterials(data).subscribe({
      next: (resp: any) => {
        console.log('Successfully searched for materials', resp);
        this.searchResults = resp.results.slice(0, 4);
      },
      error: (error) => {
        console.error('Error searching for materials:', error);
      }
    })
  }

  openResource(url: string) {
    window.open(url, '_blank');
  }
}
