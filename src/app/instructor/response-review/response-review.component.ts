import { CommonModule } from '@angular/common';
import { Component, HostListener, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-response-review',
  imports: [CommonModule, SidebarComponent, FormsModule],
  templateUrl: './response-review.component.html',
  styleUrl: './response-review.component.css'
})
export class ResponseReviewComponent implements OnInit, OnDestroy {
  expandedQuestions: Set<string | number> = new Set();
  isMobile: boolean = false;
  Array = Array;
  userId: string = '';
  username: string = '';
  profile: string = '';
  assignedAssessmentId: string = '';
  studentId: string = '';
  assessmentDetails: any = {};
  qna: any[] = [];
  showViolations: boolean = false;
  show: boolean = true;
  isLoading: boolean = true;
  totalPoints: number = 0;

  filteredQuestions: any[] = [];
  activeFilter: string = 'all';


  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  constructor(private auth: AuthService, private api: ApiService, private router: Router) {
    this.checkMobileScreen();
    window.addEventListener('resize', () => this.checkMobileScreen());
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.studentId = navigation.extras.state['studentId'];
      this.assignedAssessmentId = navigation.extras.state['assessmentId'];
      this.show = navigation.extras.state['show'] !== false;
      // console.log('Show:', this.show);
      // console.log('Student ID:', this.studentId);
      // console.log('Assessment ID:', this.assignedAssessmentId);
      this.assessmentData();
      this.qandAs();
    }
  }

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe(user => {
      this.userId = user.id;
      this.username = user.name;
      this.profile = user.profilePicture;
      // console.log('User ID:', this.userId);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', () => this.checkMobileScreen());
  }

  private checkMobileScreen(): void {
    this.isMobile = window.innerWidth < 768;
  }

  toggleQuestion(questionId: string | number): void {
    if (this.expandedQuestions.has(questionId)) {
      this.expandedQuestions.delete(questionId);
    } else {
      this.expandedQuestions.add(questionId);
    }
  }

  assessmentData() {
    this.api.getAssessmentDataP(this.assignedAssessmentId, this.studentId).subscribe({
      next: (resp: any) => {
        this.assessmentDetails = resp.data;
        this.totalPoints = resp.data.assessment.totalPoints;
        // console.log('Assessment Attempts Length:', this.assessmentDetails.student.attemptsHistory.length);
        // console.log('Assessment data:', this.assessmentDetails);
      }, error: (error) => {
        console.error('Error fetching assessment data:', error);
      }
    })
  }

  qandAs() {
    this.api.getDetailedAnswers(this.assignedAssessmentId, this.studentId).subscribe({
      next: (resp: any) => {
        this.qna = resp.data;
        this.isLoading = false;
        const hasReported = this.assessmentDetails?.student?.questionstoReview?.length > 0;
        this.viewFilter(hasReported ? 'reported' : 'all');
      }, error: (error) => {
        console.error('Error fetching assessment data:', error);
      }
    })
  }

  viewFilter(filterType: string) {
    this.activeFilter = filterType;
    const reportedIds = this.assessmentDetails?.student?.questionstoReview ?? [];

    if (filterType === 'all') {
      this.filteredQuestions = this.qna;
    } else if (filterType === 'correct') {
      this.filteredQuestions = this.qna.filter(question => question.isCorrect);
    } else if (filterType === 'incorrect') {
      this.filteredQuestions = this.qna.filter(question => !question.isCorrect);
    } else if (filterType === 'reported') {
      this.filteredQuestions = this.qna.filter(question => reportedIds.includes(question.questionId));
    }
  }

  isExpanded(questionId: string | number): boolean {
    return this.expandedQuestions.has(questionId);
  }

  get reversedAttemptsHistory(): any[] {
    return this.assessmentDetails?.student?.attemptsHistory
      ? [...this.assessmentDetails.student.attemptsHistory].reverse()
      : [];
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  viewAttempt(attempt: any, d: number) {
    this.router.navigate(['/instructor/response/attempts'],
      { state: { assessmentId: this.assignedAssessmentId, studentId: this.studentId, spec: d } });
  }

  gotoResult() {
    this.router.navigate(['/instructor/result'],
      { state: { assessmentId: this.assignedAssessmentId } });
  }



  openGradeModal(question: any): void {
    // console.log('Opening grade modal for:', question);
  }

  startGrading(question: any): void {
    question.isGrading = true;
    question.grading = {
      isCorrect: question.isCorrect,
      pointsEarned: question.isCorrect ? question.pointsEarned || 0 : 0
    };
  }

  cancelGrading(question: any): void {
    question.isGrading = false;
    delete question.grading;
  }

  saveGrading(question: any): void {
    if (!question.grading) return;

    const adjustment = {
      instructorId: this.userId,
      adjustments: [{
        questionsId: question.questionId,
        isCorrect: question.grading.isCorrect,
        pointsEarned: question.grading.isCorrect ? question.grading.pointsEarned : 0
      }]
    };

    this.api.rectifyResult(this.assignedAssessmentId, this.studentId, adjustment).subscribe({
      next: (response) => {
        question.isCorrect = question.grading.isCorrect;
        question.pointsEarned = question.grading.pointsEarned;
        question.isGrading = false;
        delete question.grading;
        this.assessmentData();
        Swal.fire({
          title: 'Grade Saved',
          text: 'The grade has been saved successfully',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1000,
          timerProgressBar: true,
          background: '#fff',
          iconColor: '#3b82f6'
        });
      },
      error: (error) => {
        console.error('Error saving grade:', error);
        Swal.fire({
          title: 'Error Saving Grade',
          text: 'Please try again',
          icon: 'info',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1000,
          timerProgressBar: true,
          background: '#fff',
          iconColor: '#3b82f6'
        });
      }
    });
  }


  endDisputeRequest() {
    this.api.endDisputeRequest(this.assignedAssessmentId, this.studentId, { instructorId: this.userId }).subscribe({
      next: (response) => {
        // console.log('Dispute ended successfully:', response);
        this.assessmentData();
      },
      error: (error) => {
        console.error('Error ending dispute:', error);
      }
    });
    Swal.fire({
      title: 'Dispute Ended',
      text: 'The dispute has been ended successfully',
      icon: 'success',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
    });
  }

  validatePoints(question: any): void {
    if (question.grading && question.grading.pointsEarned !== undefined) {
      const maxPoints = question.maxPoints || 1;
      if (!question.grading.isCorrect) {
        question.grading.pointsEarned = 0;
        return;
      }
      const points = Number(question.grading.pointsEarned);
      if (isNaN(points)) {
        question.grading.pointsEarned = 0;
        return;
      }
      if (points > maxPoints) {
        question.grading.pointsEarned = maxPoints;
      }
      else if (points < 0) {
        question.grading.pointsEarned = 0;
      }
      else {
        question.grading.pointsEarned = Math.floor(points);
      }
    }
  }

  onPointsKeydown(event: KeyboardEvent, question: any): void {
    const maxPoints = question.maxPoints || 1;
    const currentValue = (event.target as HTMLInputElement).value;
    const newValue = currentValue + event.key;
    if ([8, 46, 9, 27, 13].includes(event.keyCode)) {
      return;
    }
    if (event.keyCode >= 37 && event.keyCode <= 40) {
      return;
    }
    if (!/^\d+$/.test(event.key)) {
      event.preventDefault();
      return;
    }
    if (parseInt(newValue) > maxPoints) {
      event.preventDefault();
    }
  }

  onPointsInput(question: any, event: any): void {
    const input = event.target;
    const value = input.value;
    const maxPoints = question.maxPoints || 1;
    if (!value) {
      question.grading.pointsEarned = 0;
      return;
    }
    const points = parseInt(value, 10);
    if (points > maxPoints) {
      input.value = maxPoints;
      question.grading.pointsEarned = maxPoints;
    } else {
      question.grading.pointsEarned = points;
    }
  }

  onCorrectnessChange(question: any): void {
    if (!question.grading.isCorrect) {
      question.grading.pointsEarned = 0;
    } else {
      question.grading.pointsEarned = question.maxPoints || 1;
    }
  }

  getInitials(name: string | undefined): string {
    if (!name) return '';
    const nameParts = name.trim().split(' ');
    const firstInitial = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() : '';
    const lastInitial = nameParts[nameParts.length - 1] ?
      nameParts[nameParts.length - 1].charAt(0).toUpperCase() : '';
    return nameParts.length > 1 ? `${firstInitial}${lastInitial}` : firstInitial;
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

  toggleViolationsView(): void {
    this.showViolations = !this.showViolations;
  }

  isQuestionMarkedForReview(questionId: string): boolean {
    if (!questionId || !this.assessmentDetails?.student?.questionstoReview) {
      return false;
    }
    return this.assessmentDetails.student.questionstoReview.includes(questionId);
  }
}
