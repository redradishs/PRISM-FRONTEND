import { CommonModule } from '@angular/common';
import { Component, HostListener, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-response-review',
  imports: [CommonModule, SidebarComponent, FormsModule],
  templateUrl: './response-review.component.html',
  styleUrl: './response-review.component.css'
})
export class ResponseReviewComponent implements OnInit, OnDestroy {
  expandedQuestions: Set<string | number> = new Set();
  isMobile: boolean = false;
  isEditingFeedback: boolean = false;
  feedback: string = '';
  Array = Array;
  userId: string = '';
  assignedAssessmentId: string = '';
  studentId: string = '';
  assessmentDetails: any = {};
  qna: any[] = [];

  
  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  constructor(private auth: AuthService, private api: ApiService, private router: Router) {
    this.checkMobileScreen();
    window.addEventListener('resize', () => this.checkMobileScreen());
    const navigation = this.router.getCurrentNavigation();
    if(navigation?.extras?.state) {
      this.studentId = navigation.extras.state['studentId'];
      this.assignedAssessmentId = navigation.extras.state['assessmentId'];
      console.log('Student ID:', this.studentId);
      console.log('Assessment ID:', this.assignedAssessmentId);
      this.assessmentData();
      this.qandAs();
    }
  }

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe(user => {
      this.userId = user.id;
      console.log('User ID:', this.userId);
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

  assessmentData(){
    this.api.getAssessmentDataP(this.assignedAssessmentId, this.studentId).subscribe({
      next: (resp: any) => {
        this.assessmentDetails = resp.data;
        console.log('Assessment data:', this.assessmentDetails);
      }, error: (error) => {
        console.error('Error fetching assessment data:', error);
      }
    })
  }

  qandAs(){
    this.api.getDetailedAnswers(this.assignedAssessmentId, this.studentId).subscribe({
      next: (resp: any) => {
        this.qna = resp.data;
        console.log('Assessment data:', this.qna);
      }, error: (error) => {
        console.error('Error fetching assessment data:', error);
      }
    })
  }

  isExpanded(questionId: string | number): boolean {
    return this.expandedQuestions.has(questionId);
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  toggleFeedbackEdit(): void {
    this.isEditingFeedback = !this.isEditingFeedback;
  }

  cancelFeedbackEdit(): void {
    this.isEditingFeedback = false;
  }

  saveFeedback(): void {
    // Implement save feedback logic here
    this.isEditingFeedback = false;
  }

  openGradeModal(question: any): void {
    // Implement grading functionality
    console.log('Opening grade modal for:', question);
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
        // Update the question with new values
        question.isCorrect = question.grading.isCorrect;
        question.pointsEarned = question.grading.pointsEarned;
        question.isGrading = false;
        delete question.grading;
        
        // Refresh assessment data to update scores
        this.assessmentData();
      },
      error: (error) => {
        console.error('Error saving grade:', error);
      }
    });
  }

  validatePoints(question: any): void {
    if (question.grading && question.grading.pointsEarned !== undefined) {
      // Get the maxPoints from the question data
      const maxPoints = question.maxPoints || 1; // Default to 1 if not specified
      
      // If marked as incorrect, reset points to 0
      if (!question.grading.isCorrect) {
        question.grading.pointsEarned = 0;
        return;
      }

      // Convert to number and ensure it's a valid number
      const points = Number(question.grading.pointsEarned);
      if (isNaN(points)) {
        question.grading.pointsEarned = 0;
        return;
      }

      // Ensure points don't exceed maxPoints
      if (points > maxPoints) {
        question.grading.pointsEarned = maxPoints;
      }
      // Ensure points are not negative
      else if (points < 0) {
        question.grading.pointsEarned = 0;
      }
      // Ensure points is a whole number
      else {
        question.grading.pointsEarned = Math.floor(points);
      }
    }
  }

  onPointsKeydown(event: KeyboardEvent, question: any): void {
    const maxPoints = question.maxPoints || 1;
    const currentValue = (event.target as HTMLInputElement).value;
    const newValue = currentValue + event.key;
    
    // Allow backspace, delete, tab, escape, enter
    if ([8, 46, 9, 27, 13].includes(event.keyCode)) {
      return;
    }
    
    // Allow arrow keys
    if (event.keyCode >= 37 && event.keyCode <= 40) {
      return;
    }
    
    // Allow numbers only
    if (!/^\d+$/.test(event.key)) {
      event.preventDefault();
      return;
    }
    
    // Prevent entering numbers that would exceed maxPoints
    if (parseInt(newValue) > maxPoints) {
      event.preventDefault();
    }
  }

  onPointsInput(question: any, event: any): void {
    const input = event.target;
    const value = input.value;
    const maxPoints = question.maxPoints || 1;
    
    // If the value is empty, set to 0
    if (!value) {
      question.grading.pointsEarned = 0;
      return;
    }
    
    // Convert to number
    const points = parseInt(value, 10);
    
    // Ensure points don't exceed maxPoints
    if (points > maxPoints) {
      input.value = maxPoints;
      question.grading.pointsEarned = maxPoints;
    } else {
      question.grading.pointsEarned = points;
    }
  }

  onCorrectnessChange(question: any): void {
    if (!question.grading.isCorrect) {
      // If marked as incorrect, set points to 0
      question.grading.pointsEarned = 0;
    } else {
      // If marked as correct, set points to maxPoints by default
      question.grading.pointsEarned = question.maxPoints || 1;
    }
  }
}
