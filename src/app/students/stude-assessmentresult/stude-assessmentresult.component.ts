import { Component, HostListener, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

interface ReportRequest {
  reason: string;
  selectedQuestions: string[];
}

interface Violation {
  type: string;
  fromQuestionId: string;
  timestamp: string;
  _id: string;
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
  violationCount?: number;
  violationDetails?: Violation[];
}

@Component({
  selector: 'app-stude-assessmentresult',
  standalone: true,
  imports: [SidebarComponent, CommonModule, FormsModule],
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
  enableStudentFeedback: boolean = false;
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

  isFinalized: boolean = true;

  // Report Assessment Form State
  showReportModal = false;
  reportRequest: ReportRequest = {
    reason: '',
    selectedQuestions: [],
  };
  reportReasons = [
    'Incorrect question or answer',
    'Technical issue during assessment',
    'Unclear question wording',
    'Time constraint issues',
    'System malfunction',
    'Accessibility concerns',
    'Other'
  ];
  isSubmittingReport = false;

  showViolationsModal = false;

  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  showMasteryCelebration = false;
  outroActive = false;

  constructor(private auth: AuthService, private api: StudentService, private router: Router, private cdr: ChangeDetectorRef, private ai: ApiService) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.assignedAssessmentId = navigation.extras.state['assessmentId'];
      // console.log('Assigned Assessment ID:', this.assignedAssessmentId);
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
      // console.log('Username:', this.username);
      this.enableStudentFeedback = user.enableStudentFeedback;
      this.getResult();
      this.getPerformancePerQuestion();
      // console.log('User ID:', this.userId);
    });
  }

  getResult() {
    this.api.getResultData(this.userId, this.assignedAssessmentId).subscribe({
      next: (resp: any) => {
        if (resp.remarks === 'Success') {
          this.result = resp.data;
          if (this.result.showResult === 'immediate') {
            this.viewAllQuestions();
            this.isFinished = true;
          }
          if (this.result.status === 'completed') {
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
          this.questionType = resp.data.breakdown;
          // console.log('Performance per question:', this.questionType);
          if (resp.data.hasNonObject === true && resp.data.hasBeenFinalized === false) {
            console.log('Detected and not finalized, checking.');
            this.getObjectBasedQuestions();
            this.isFinalized = false;
          }
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

            if (this.enableStudentFeedback) {
              this.getAssessmentInsights();
            }
          }

          // console.log('Analysis:', this.analysis);
          // console.log('Question overview:', resp.data);
        }
      },
      error: (error) => {
        console.error('Error fetching question overview:', error);
      }
    })
  }

  getObjectBasedQuestions() {
    const data = {
      assignedAssessmentId: this.assignedAssessmentId,
      studentId: this.userId
    }
    this.api.getObjectBased(data).subscribe({
      next: (resp: any) => {
        // console.log('Object Based Questions:', resp);
        this.submitNonObjectBased(resp.data);
      }, error: (error: any) => {
        console.error('Error fetching object based questions:', error);
      }
    })
  }

  submitNonObjectBased(data: any) {
    this.ai.nonObjectChecking(data).subscribe({
      next: (resp: any) => {
        // console.log('Non-Object Based Results:', resp);
        this.processAIRectification(resp.results);

      }, error: (error: any) => {
        console.error('Error submitting non-object based results:', error);
      }
    })
  }

  processAIRectification(changes: any) {
    const data = {
      studentId: this.userId,
      assignedAssessmentId: this.assignedAssessmentId,
      aiRectifications: changes
    }
    this.api.aiRectification(data).subscribe({
      next: (resp: any) => {
        this.getResult();
        this.getPerformancePerQuestion();
        this.isFinalized = true;
      }, error: (error: any) => {
        console.error('Error processing AI rectification:', error);
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
      if (result.isConfirmed) {
        const data = {
          assignedAssessmentId: this.assignedAssessmentId,
          studentId: this.userId
        }
        this.api.recordStartTime(data).subscribe({
          next: (resp: any) => {
            // console.log('Successfully recorded start time', resp);
            if (this.result.mode !== 'mastery') {
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
    // console.log('This is the result of this assessment', this.analysis)
    this.ai.analyzeStudent(data).subscribe({
      next: (resp: any) => {
        // console.log('Successfully analyzed the assessment', resp);
        this.insights = resp.feedback;
        if (resp.search_queries) {
          this.search = resp.search_queries;
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
      search_queries: this.search
    }
    this.ai.recommendedMaterialsPlus(data).subscribe({
      next: (resp: any) => {
        // console.log('Successfully searched for materials', resp);
        // this.searchResults = resp.results
        this.materialsValidator(resp.results)
      },
      error: (error) => {
        console.error('Error searching for materials:', error);
      }
    })
  }

  materialsValidator(results: any) {
    const data = {
      results: results
    }
    this.ai.materialsValidator(data).subscribe({
      next: (resp: any) => {
        this.searchResults = resp.results
      }, error: (error: any) => {
        console.error('Error searching for materials:', error);
      }
    })

  }

  openResource(url: string) {
    window.open(url, '_blank');
  }

  // Report Assessment Methods
  openReportModal() {
    this.showReportModal = true;
    this.resetReportForm();
  }

  closeReportModal() {
    this.showReportModal = false;
    this.resetReportForm();
  }

  resetReportForm() {
    this.reportRequest = {
      reason: '',
      selectedQuestions: [],
    };
  }

  toggleQuestionSelection(questionId: string) {
    const index = this.reportRequest.selectedQuestions.indexOf(questionId);
    if (index > -1) {
      this.reportRequest.selectedQuestions.splice(index, 1);
    } else {
      this.reportRequest.selectedQuestions.push(questionId);
    }
  }

  isQuestionSelected(questionId: string): boolean {
    return this.reportRequest.selectedQuestions.includes(questionId);
  }

  selectAllQuestions() {
    if (this.analysis && this.analysis.length > 0) {
      this.reportRequest.selectedQuestions = this.analysis.map(q => q.questionId);
    }
  }

  deselectAllQuestions() {
    this.reportRequest.selectedQuestions = [];
  }

  isFormValid(): boolean {
    return this.reportRequest.reason.trim() !== '' &&
      this.reportRequest.selectedQuestions.length > 0;
  }

  submitReport() {
    if (!this.isFormValid()) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Form',
        text: 'Please select a reason and at least one question to report.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    this.isSubmittingReport = true;

    const reportData = {
      studentId: this.userId,
      assignedAssessmentId: this.assignedAssessmentId,
      reason: this.reportRequest.reason,
      disputedQuestionIds: this.reportRequest.selectedQuestions,
    };

    this.api.submitGradeDispute(reportData).subscribe({
      next: (response) => {
        // console.log('Successfully submitted grade dispute:', response);
        this.isSubmittingReport = false;
        this.closeReportModal();
        Swal.fire({
          icon: 'success',
          title: 'Report Submitted',
          text: 'Your assessment report has been submitted. The instructor will review your report and make any necessary adjustments.',
          confirmButtonColor: '#10b981'
        });
      },
      error: (error) => {
        console.error('Error submitting grade dispute:', error);
        this.isSubmittingReport = false;
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: 'Error submitting the report. Please try again later.',
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }

  openViolationsModal() {
    this.showViolationsModal = true;
  }

  closeViolationsModal() {
    this.showViolationsModal = false;
  }

  getViolationIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'tab switch detected':
        return 'fa-window-restore';
      case 'copy attempt detected':
        return 'fa-copy';
      case 'paste attempt detected':
        return 'fa-paste';
      case 'devtools attempt detected':
        return 'fa-code';
      case 'select all attempt detected':
        return 'fa-object-group';
      case 'multiple window focus losses detected':
        return 'fa-window-restore';
      case 'focus lost':
        return 'fa-eye-slash';
      default:
        return 'fa-exclamation-triangle';
    }
  }

  getViolationColor(type: string): string {
    switch (type.toLowerCase()) {
      case 'tab switch detected':
        return '#f59e0b';
      case 'copy attempt detected':
        return '#ef4444';
      case 'paste attempt detected':
        return '#dc2626';
      case 'devtools attempt detected':
        return '#dc2626';
      case 'select all attempt detected':
        return '#6366f1';
      case 'multiple window focus losses detected':
        return '#f59e0b';
      case 'focus lost':
        return '#f97316';
      default:
        return '#6b7280';
    }
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getQuestionNumber(questionId: string): number {
    if (!this.analysis || this.analysis.length === 0) {
      return 0;
    }
    const index = this.analysis.findIndex(q => q.questionId === questionId);
    return index !== -1 ? index + 1 : 0;
  }

  groupViolationsByType(): { type: string; count: number; color: string; icon: string }[] {
    if (!this.result?.violationDetails || this.result.violationDetails.length === 0) {
      return [];
    }

    const grouped = this.result.violationDetails.reduce((acc, violation) => {
      const existing = acc.find(item => item.type === violation.type);
      if (existing) {
        existing.count++;
      } else {
        acc.push({
          type: violation.type,
          count: 1,
          color: this.getViolationColor(violation.type),
          icon: this.getViolationIcon(violation.type)
        });
      }
      return acc;
    }, [] as { type: string; count: number; color: string; icon: string }[]);

    return grouped;
  }
}
