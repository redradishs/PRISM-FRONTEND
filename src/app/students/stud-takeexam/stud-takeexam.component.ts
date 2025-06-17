import {
  Component,
  HostListener,
  ViewChild,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { IntegrityMonitoringService } from '../../services/integrity-monitoring.service';
import { Subscription } from 'rxjs';
import { StudentService } from '../../services/student.service';
import { AuthService } from '../../services/auth.service';

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'enumeration';
  text: string;
  options?: string[];
  correctAnswer?: boolean | string;
  wordLimit?: number;
  answerCount?: number;
}

interface AssessmentData {
  title: string;
  totalQuestions: number;
  questions: Question[];
  startTime: string;
  remainingSeconds: number;
  hasStarted: boolean;
}

@Component({
  selector: 'app-stud-takeexam',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './stud-takeexam.component.html',
  styleUrl: './stud-takeexam.component.css',
})
export class StudTakeexamComponent implements OnInit, OnDestroy {
  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent)
  sidebar!: SidebarComponent;
  showInstructions = true;
  currentQuestionIndex = 0;
  answers: { [key: string]: string | string[] } = {};
  timeRemaining: number;
  showSubmitDialog = false;
  timerInterval: any;
  saveTimeout: any;
  currentWordCount: number = 0;
  userId: string = '';
  assignedAssessmentId: string = '';
  showViolation = false;
  showSidebar = true;

  //academic-integration import
  cheatingCount = 0;
  cheatMessage: string | null = null;
  private subscriptions: Subscription[] = [];

  assessmentData: AssessmentData = {
    title: '',
    totalQuestions: 0,
    questions: [],
    startTime: '',
    remainingSeconds: 0,
    hasStarted: false,
  };

  // Pagination properties
  currentPage = 0;
  questionsPerPage = 15;

  constructor(
    private router: Router,
    private titleService: Title,
    private is: IntegrityMonitoringService,
    private api: StudentService,
    private auth: AuthService
  ) {
    this.timeRemaining = this.assessmentData.remainingSeconds;
    this.titleService.setTitle('PRISM | Take Assessment');

    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.assignedAssessmentId = navigation.extras.state['assessmentId'];
      console.log('I received this id', this.assignedAssessmentId);
    } else {
      console.error('No assessment ID provided');
      this.router.navigate(['/student/dashboard']);
      return;
    }
  }

  get currentQuestion(): Question {
    return (
      this.assessmentData.questions[this.currentQuestionIndex] || {
        id: '',
        type: 'multiple-choice',
        text: 'Loading question...',
        options: [],
      }
    );
  }

  get totalPages(): number {
    return Math.ceil(
      this.assessmentData.totalQuestions / this.questionsPerPage
    );
  }

  getVisibleQuestions(): Question[] {
    const start = this.currentPage * this.questionsPerPage;
    const end = Math.min(
      start + this.questionsPerPage,
      this.assessmentData.totalQuestions
    );
    return this.assessmentData.questions.slice(start, end);
  }

  getQuestionIndex(visibleIndex: number): number {
    return this.currentPage * this.questionsPerPage + visibleIndex;
  }

  // Lifecycle hooks
  ngOnInit() {
    this.startTimer();
    this.initializeAnswers();

    this.auth.getCurrentUser().subscribe((user) => {
      this.userId = user.id;
      this.getData();
    });

    this.subscriptions.push(
      this.is.cheatingCount$.subscribe((count) => {
        this.cheatingCount = count;
      })
    );

    this.subscriptions.push(
      this.is.cheatMessage$.subscribe((message) => {
        this.cheatMessage = message;
        console.log(this.cheatMessage);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }

  getData() {
    this.api
      .getAssessmentData(this.assignedAssessmentId, this.userId)
      .subscribe({
        next: (resp: any) => {
          console.log('Assessment data received:', resp);

          if (resp.data) {
            const apiData = resp.data;

            const mappedQuestions: Question[] = apiData.questions.map(
              (q: any) => {
                return {
                  id: q._id,
                  type: q.type,
                  text: q.question,
                  options: q.options || [],
                  answerCount:
                    q.type === 'enumeration'
                      ? q.question.toLowerCase().includes('three')
                        ? 3
                        : q.question.toLowerCase().includes('two')
                          ? 2
                          : q.question.toLowerCase().includes('four')
                            ? 4
                            : 3
                      : undefined,
                  wordLimit: q.type === 'short-answer' ? 250 : undefined,
                };
              }
            );

            this.assessmentData = {
              title: apiData.title,
              totalQuestions: apiData.totalQuestions,
              questions: mappedQuestions,
              startTime: apiData.startTime,
              remainingSeconds: apiData.remainingSeconds || 60 * 0,
              hasStarted: apiData.hasStarted,
            };

            // Initialize the timer with the remaining seconds
            this.timeRemaining = this.assessmentData.remainingSeconds;

            // Initialize answers for enumeration questions
            this.initializeAnswers();

            // Start the timer
            this.startTimer();
          }
        },
        error: (error) => {
          console.error('Error getting assessment data:', error);
        },
      });
  }

  getViolationHistory(): string {
    return this.is.getViolationHistory();
  }

  startExam() {
    this.showInstructions = false;
    this.startTimer();
  }

  showViolationMessage() {
    this.showViolation = !this.showViolation;
  }

  hideSidebar() {
    this.showSidebar = !this.showSidebar;
  }

  // Timer functions
  private startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
      } else {
        this.submitAssessment();
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Answer handling
  private initializeAnswers() {
    this.assessmentData.questions.forEach((question) => {
      if (question.type === 'enumeration') {
        this.answers[question.id] = Array(question.answerCount || 3).fill('');
      }
    });
  }

  getAnsweredCount(): number {
    return Object.keys(this.answers).length;
  }

  // Helper functions
  getQuestionType(
    type: 'multiple-choice' | 'true-false' | 'short-answer' | 'enumeration'
  ): string {
    const types = {
      'multiple-choice': 'Multiple Choice',
      'true-false': 'True/False',
      'short-answer': 'Short Answer',
      enumeration: 'Enumeration',
    };
    return types[type];
  }

  // Navigation functions
  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.assessmentData.totalQuestions - 1) {
      this.currentQuestionIndex++;
    }
  }

  changePage(pageNumber: number): void {
    if (pageNumber >= 0 && pageNumber < this.totalPages) {
      this.currentPage = pageNumber;
    }
  }

  goToQuestion(index: number) {
    if (index >= 0 && index < this.assessmentData.totalQuestions) {
      this.currentQuestionIndex = index;

      const targetPage = Math.floor(index / this.questionsPerPage);
      if (targetPage !== this.currentPage) {
        this.changePage(targetPage);
      }
    }
  }

  submitAssessment() {
    console.log('Submitting answers:', this.answers);
    this.router.navigate(['/student/assessment-complete']);
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  getQuestionButtonClass(index: number, questionId: string): string {
    return `p-2 rounded text-sm ${this.currentQuestionIndex === index
      ? 'bg-blue-600 text-white'
      : this.answers[questionId]
        ? 'bg-green-50 border-green-500'
        : 'bg-white border'
      }`;
  }

  openSubmitDialog() {
    this.showSubmitDialog = true;
  }

  confirmSubmit() {
    this.showSubmitDialog = false;
    const submissionData = {
      assignedAssessmentId: this.assignedAssessmentId,
      studentId: this.userId,
      answers: this.formatAnswersForSubmission(),
      timeSpent: this.calculateTimeSpent(),
      violationCount: this.cheatingCount,
      violationDetails: this.is.getViolations(),
    };

    this.api.submitAssessment(submissionData).subscribe({
      next: (resp: any) => {
        console.log('Assessment submitted successfully');
        localStorage.removeItem('violations');
        sessionStorage.removeItem('violations');
        this.is.resetAllViolations();
        this.router.navigate(['/student/assessment/result'], {
          state: { assessmentId: this.assignedAssessmentId }
        });
      },
      error: (error) => {
        console.error('Error submitting assessment:', error);
      },
    });

    console.log('Submission data:', submissionData);
  }

  private formatAnswersForSubmission() {
    const formattedAnswers = [];

    for (const questionId in this.answers) {
      if (this.answers.hasOwnProperty(questionId)) {
        const question = this.assessmentData.questions.find(
          (q) => q.id === questionId
        );

        if (question) {
          let formattedAnswer;

          // Format the answer based on question type
          switch (question.type) {
            case 'multiple-choice':
              const index = this.answers[questionId];
              if (index !== undefined && index !== null) {
                const indexValue = Array.isArray(index) ? index[0] : index;
                formattedAnswer = String.fromCharCode(
                  65 + parseInt(String(indexValue))
                ); // A, B, C, D...
              }
              break;

            case 'true-false':
              // Convert to string first, then compare
              const answer = this.answers[questionId];
              const answerStr = Array.isArray(answer)
                ? String(answer[0])
                : String(answer);
              formattedAnswer =
                answerStr.toLowerCase() === 'true' ? 'True' : 'False';
              break;

            case 'enumeration':
              const enumAnswer = this.answers[questionId];
              formattedAnswer = Array.isArray(enumAnswer)
                ? enumAnswer.map((ans: string) => ans.trim().toLowerCase())
                : [];
              break;

            case 'short-answer':
            default:
              formattedAnswer = this.answers[questionId];
              break;
          }

          formattedAnswers.push({
            questionId: questionId,
            givenAnswer: formattedAnswer,
          });
        }
      }
    }

    return formattedAnswers;
  }

  // Calculate time spent on the assessment
  private calculateTimeSpent() {
    const totalSeconds = this.assessmentData.remainingSeconds;
    const remainingSeconds = this.timeRemaining;
    return totalSeconds - remainingSeconds;
  }

  countWords(event: any): void {
    const text = event.target.value || '';
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word: string) => word.length > 0);
    this.currentWordCount = words.length;
  }
}
