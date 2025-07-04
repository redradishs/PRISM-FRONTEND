import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StudentService } from '../../services/student.service';
import { IntegrityMonitoringService } from '../../services/integrity-monitoring.service';
import { Subscription } from 'rxjs';

interface Question {
  _id: string;
  expectedAnswer: number;
  isComplete: boolean;
  isLastQuestion: boolean;
  progress: {
    current: number;
    remaining: number;
    total: number;
  }
  question: {
    options?: string[];
    points: number;
    questionText: string;
    type: 'multiple-choice' | 'true-false' | 'short-answer' | 'multiple-select' | 'enumeration';
    _id: string;
  }
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'multiple-select' | 'enumeration';
  options?: string[];
}

interface QuestionResponse {
  remarks: string;
  data: {
    isComplete: boolean;
    question: {
      type: 'multiple-choice' | 'true-false' | 'short-answer' | 'multiple-select' | 'enumeration';
      questionText: string;
      options?: string[];
      points: number;
      _id: string;
    };
    progress: {
      current: number;
      total: number;
      remaining: number;
    };
    expectedAnswers: any;
    isLastQuestion: boolean;
  };
  message: string;
}

@Component({
  selector: 'app-stud-takeexamsecure',
  imports: [CommonModule, FormsModule],
  templateUrl: './stud-takeexamsecure.component.html',
  styleUrl: './stud-takeexamsecure.component.css'
})
export class StudTakeexamsecureComponent implements OnInit, OnDestroy {
  userId: string = '';
  assignedAssessmentId: string = '';
  assessmentTitle: string = '';

  currentQuestionIndex = 0;
  timeRemaining = 30 * 60;
  selectedAnswer: string | null = null;
  multiSelectAnswers: { [key: string]: string[] } = {};
  enumerationAnswers: string[] = [];
  isSubmitting = false;
  timerInterval: any;
  data: any;
  isTimed: boolean = false;
  timedQuestions: number = 0;

  questions: Question[] = [];

  cheatingCount = 0;
  cheatMessage: string | null = null;
  private subscriptions: Subscription[] = [];

  questionTimer: number = 0;
  questionTimerInterval: any;
  isQuestionTimed: boolean = false;
  isRandomized: boolean = false;

  constructor(
    private router: Router,
    private auth: AuthService,
    private api: StudentService,
    private is: IntegrityMonitoringService
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.assignedAssessmentId = navigation.extras.state['assessmentId'];
      // console.log('Assessment ID:', this.assignedAssessmentId);
    }
  }

  ngOnInit() {
    this.auth.getCurrentUser().subscribe((user) => {
      if (user) {
        this.userId = user.id;
        this.getSecureData(this.userId, this.assignedAssessmentId);
        this.nextQuestionA();

        this.setupIntegrityMonitoring();
      } else {
        console.error('User not found');
      }
    });

    //this functxion is being used to skip answer when the page is refreshed
    window.addEventListener('beforeunload', () => {
      if (this.isQuestionTimed || this.isRandomized) {
        if (this.data?.isLastQuestion) {
          this.finalizeAssessment();
        } else {
          this.submitAnswer();
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.questionTimerInterval) {
      clearInterval(this.questionTimerInterval);
    }

    this.subscriptions.forEach(sub => sub.unsubscribe());

    this.is.cleanup();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.handleTimeUp();
      }
    }, 1000);
  }


  getSecureData(studentId: string, assessmentId: string) {
    this.api.getSecureData(this.userId, this.assignedAssessmentId).subscribe({
      next: (resp: any) => {
        if (resp.remarks === 'Success' && resp.data) {
          // console.log('Secure data fetched successfully:', resp.data);
          this.assessmentTitle = resp.data.title;
          this.timeRemaining = resp.data.time.remaining || 0;
          this.isTimed = resp.data.isTimed;
          this.timedQuestions = resp.data.timedQuestions;
          this.questionTimer = this.timedQuestions;
          this.isRandomized = resp.data.randomizeQuestions;
          // console.log('Is Randomized:', this.isRandomized);
          // console.log('Is Timed:', this.isTimed);
          // console.log('Timed Questions:', this.timedQuestions);
          // console.log('Time remaining:', this.timeRemaining);
          this.resetEnumerationAnswers();
          this.startTimer();
          if (resp.data.status === 'submitted') {
            this.router.navigate(['/student/assessment/result'], {
              state: { assessmentId: this.assignedAssessmentId }
            })
          }
        } else {
          console.error('Invalid secure data format', resp);
        }
      },
      error: (err: any) => {
        console.log('Error fetching secure data:', err);
        this.router.navigate(['/student/dashboard'])
      }
    })
  }

  nextQuestionA() {
    this.api.nextQuestionGrabber(this.userId, this.assignedAssessmentId).subscribe({
      next: (resp: any) => {
        if (resp.remarks === 'Success' && resp.data) {
          // console.log('Next question fetched successfully:', resp.data);
          this.selectedAnswer = null;
          this.multiSelectAnswers = {};
          this.enumerationAnswers = Array(resp.data.expectedAnswers || 0).fill('');
          this.data = resp.data;
          // console.log('Data:', this.data);

          // Start per-question timer if enabled and we have the data
          if (this.isTimed && this.timedQuestions > 0 && this.data) {
            this.questionTimer = this.timedQuestions;
            this.isQuestionTimed = true;
            this.startQuestionTimer();
          }
        } else {
          console.error('Invalid next question format', resp);
        }
      },
      error: (err: any) => {
        console.log('Error fetching next question:', err);
      }
    })
  }

  finalizeAssessment() {
    // Clear all timers first
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.questionTimerInterval) {
      clearInterval(this.questionTimerInterval);
    }

    this.api.finalizeAssessment(this.userId, this.assignedAssessmentId).subscribe({
      next: (resp: any) => {
        if (resp.remarks === 'Success') {
          // console.log('Assessment finalized successfully');

          this.is.cleanup();
          this.is.resetAllViolations();

          // Clear component state
          this.cheatingCount = 0;
          this.cheatMessage = null;
          this.router.navigate(['/student/assessment/result'], {
            state: {
              assessmentId: this.assignedAssessmentId
            }
          });
        } else {
          console.error('Failed to finalize assessment', resp);
        }
      },
      error: (err: any) => {
        console.log('Error finalizing assessment:', err);
        this.is.cleanup();
        this.is.resetAllViolations();
      }
    });
  }

  submitAnswer() {
    if (this.questionTimerInterval) {
      clearInterval(this.questionTimerInterval);
      this.isQuestionTimed = false;
    }

    if (!this.data?.question) return;
    let givenAnswer: any = null;
    const q = this.data.question;
    switch (q.type) {
      case 'multiple-choice':
      case 'true-false':
      case 'short-answer':
        givenAnswer = this.selectedAnswer;
        break;
      case 'multiple-select':
        givenAnswer = this.multiSelectAnswers[q._id] || [];
        break;
      case 'enumeration':
        givenAnswer = this.enumerationAnswers;
        break;
      default:
        console.warn('Unsupported question type:', q.type);
    }

    const data: any = {
      studentId: this.userId,
      assignedAssessmentId: this.assignedAssessmentId,
      questionId: q._id,
      givenAnswer
    };

    if (this.cheatingCount > 0) {
      // Get all violations
      const violations = this.is.getViolations();

      if (violations.length > 0) {
        //most recent violation only
        const sortedViolations = [...violations].sort((a, b) => b.timestamp - a.timestamp);
        const latestViolation = sortedViolations[0];
        data.violation = {
          type: latestViolation.type,
          fromQuestionId: q._id,
          violationCount: this.cheatingCount
        };

        // console.log('Sending exact violation type:', latestViolation.type);
      }
    }

    this.api.submitAnswer(data).subscribe({
      next: (resp: any) => {
        if (resp.remarks === 'Success') {
          // console.log('Answer submitted successfully:', resp);

          if (this.cheatingCount > 0) {
            this.is.resetAllViolations();
          }

          this.is.clearAlerts();

          if (this.data.isLastQuestion) {
            this.finalizeAssessment();
          } else {
            this.selectedAnswer = null;
            this.nextQuestionA();
          }
        } else {
          console.error('Failed to submit answer', resp);
        }
      },
      error: (err: any) => {
        console.log('Error submitting answer:', err);
      }
    })
  }

  resetEnumerationAnswers() {
    const enumerationQuestions = this.questions.filter(q => q.type === 'enumeration');
    if (enumerationQuestions.length > 0) {
      let expectedAnswers = this.data.expectedAnswers;
      this.enumerationAnswers = Array(expectedAnswers).fill('');
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  handleTimeUp() {
    console.log('Assessment time expired');

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.questionTimerInterval) {
      clearInterval(this.questionTimerInterval);
    }

    this.finalizeAssessment();
  }

  selectOption(option: string) {
    this.selectedAnswer = option;
    // console.log('Selected option:', option);
  }

  isOptionSelected(option: string): boolean {
    const currentQuestion = this.questions[this.currentQuestionIndex];
    if (currentQuestion.type === 'multiple-select') {
      return this.multiSelectAnswers[currentQuestion._id]?.includes(option) || false;
    }
    return this.selectedAnswer === option;
  }

  toggleMultiSelect(option: string) {
    const currentQuestion = this.questions[this.currentQuestionIndex];
    if (!this.multiSelectAnswers[currentQuestion._id]) {
      this.multiSelectAnswers[currentQuestion._id] = [];
    }

    const answers = this.multiSelectAnswers[currentQuestion._id];
    const index = answers.indexOf(option);

    if (index === -1) {
      answers.push(option);
    } else {
      answers.splice(index, 1);
    }
  }

  canProceed(question: Question): boolean {
    if (!question) return false;
    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        return this.selectedAnswer !== null;
      case 'multiple-select':
        const selectedOptions = this.multiSelectAnswers[question._id] || [];
        return selectedOptions.length > 0;
      case 'short-answer':
        return this.selectedAnswer !== null && this.selectedAnswer.trim() !== '';
      case 'enumeration':
        return this.enumerationAnswers.every(answer => answer.trim() !== '');
      default:
        return false;
    }
  }


  submitAssessment() {
    this.isSubmitting = true;

    const answers = this.questions.map((question, index) => {
      if (index === this.currentQuestionIndex) {
        switch (question.type) {
          case 'multiple-choice':
          case 'true-false':
          case 'short-answer':
            return {
              questionId: question._id,
              answer: this.selectedAnswer
            };
          case 'multiple-select':
            return {
              questionId: question._id,
              answer: this.multiSelectAnswers[question._id] || []
            };
          case 'enumeration':
            return {
              questionId: question._id,
              answer: this.enumerationAnswers
            };
          default:
            return {
              questionId: question._id,
              answer: null
            };
        }
      } else {
        // Handle previously answered questions
        switch (question.type) {
          case 'multiple-select':
            return {
              questionId: question._id,
              answer: this.multiSelectAnswers[question._id] || []
            };
          case 'enumeration':
            return {
              questionId: question._id,
              answer: this.enumerationAnswers
            };
          default:
            return {
              questionId: question._id,
              answer: null
            };
        }
      }
    });

    setTimeout(() => {
      this.isSubmitting = false;
      // console.log('Submitting answers:', answers);
    }, 2000);
  }

  private setupIntegrityMonitoring() {
    // Start integrity monitoring for secure assessment
    this.is.startMonitoring();

    this.subscriptions.push(
      this.is.cheatingCount$.subscribe(count => {
        this.cheatingCount = count;
      })
    );

    this.subscriptions.push(
      this.is.cheatMessage$.subscribe(message => {
        this.cheatMessage = message;
      })
    );
  }

  createRange(count: number): number[] {
    return Array(count).fill(0).map((_, i) => i);
  }

  //time starter per question
  startQuestionTimer() {
    if (this.questionTimerInterval) {
      clearInterval(this.questionTimerInterval);
    }

    // Only start timer if we have a valid timer value
    if (this.questionTimer > 0) {
      this.questionTimer = this.timedQuestions;
      this.isQuestionTimed = true;

      this.questionTimerInterval = setInterval(() => {
        this.questionTimer--;
        if (this.questionTimer <= 0) {
          this.handleQuestionTimeUp();
        }
      }, 1000);
    }
  }

  handleQuestionTimeUp() {
    if (this.questionTimerInterval) {
      clearInterval(this.questionTimerInterval);
    }
    this.isQuestionTimed = false;
    this.submitAnswer();
  }
}
