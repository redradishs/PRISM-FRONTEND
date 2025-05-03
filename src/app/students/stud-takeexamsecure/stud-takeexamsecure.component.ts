import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StudentService } from '../../services/student.service';

interface Question {
  _id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'multiple-select' | 'enumeration';
  options?: string[];
}

@Component({
  selector: 'app-stud-takeexamsecure',
  imports: [CommonModule, FormsModule],
  templateUrl: './stud-takeexamsecure.component.html',
  styleUrl: './stud-takeexamsecure.component.css'
})
export class StudTakeexamsecureComponent implements OnInit, OnDestroy {
  userId: string = '';
  assignedAssessmentId: string = '6815f4b19314d70baf2331c8';
  assessmentTitle: string = '';

  currentQuestionIndex = 0;
  timeRemaining = 30 * 60; 
  selectedAnswer: string | null = null;
  multiSelectAnswers: { [key: string]: string[] } = {};
  enumerationAnswers: string[] = ['', '', ''];
  isSubmitting = false;
  timerInterval: any;

  questions: Question[] = [];

  constructor(private router: Router, private auth: AuthService, private api: StudentService) {}

  ngOnInit() {
    this.auth.getCurrentUser().subscribe((user) => {
      if(user) {
        this.userId = user.id;
        this.assessmentQuestions();
      } else {
        console.error('User not found');
      }
    });
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.handleTimeUp();
      }
    }, 1000);
  }

  assessmentQuestions() {
    this.api.getAssessmentData(this.assignedAssessmentId, this.userId).subscribe({
      next: (resp: any) => {
        if (resp.remarks === 'Success' && resp.data) {
          this.assessmentTitle = resp.data.title;
          this.questions = resp.data.questions;
          this.timeRemaining = resp.data.remainingSeconds || 1800; 

          this.resetEnumerationAnswers();
          this.startTimer();
        } else {
          console.error('Invalid assessment data format', resp);
        }
      },
      error: (err: any) => {
        console.log('Error fetching assessment data:', err);
      }
    });
  }

  resetEnumerationAnswers() {
    // For enumeration questions, initialize with empty strings
    const enumerationQuestions = this.questions.filter(q => q.type === 'enumeration');
    if (enumerationQuestions.length > 0) {
      // Default to 3 answers per enumeration question
      this.enumerationAnswers = Array(3).fill('');
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  handleTimeUp() {
    clearInterval(this.timerInterval);
    this.submitAssessment();
  }

  selectOption(option: string) {
    this.selectedAnswer = option;
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

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.selectedAnswer = null;
    } else {
      this.submitAssessment();
    }
  }

  submitAssessment() {
    this.isSubmitting = true;

    // Collect all answers in appropriate format
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
      console.log('Submitting answers:', answers);
    }, 2000);
  }
}
