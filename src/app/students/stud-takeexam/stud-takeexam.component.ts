import { Component, HostListener, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';

// Define question types for better type checking
interface Question {
  id: number;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'enumeration';
  text: string;
  options?: { id: string; text: string; }[];
  correctAnswer?: boolean | string;
  wordLimit?: number;
  answerCount?: number;
}

interface AssessmentData {
  id: number;
  title: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  timeLimit: number; // in minutes
  totalQuestions: number;
  instructions: string;
  questions: Question[];
}

@Component({
  selector: 'app-stud-takeexam',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './stud-takeexam.component.html',
  styleUrl: './stud-takeexam.component.css'
})
export class StudTakeexamComponent implements OnInit, OnDestroy {
  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  showInstructions = true;
  currentQuestionIndex = 0;
  answers: { [key: number]: any } = {};
  timeRemaining: number;
  showSubmitDialog = false;
  timerInterval: any;
  saveTimeout: any;
  currentWordCount: number = 0;
  
  // Mock data - Replace with actual data from your service
  assessmentData: AssessmentData = {
    id: 1,
    title: "Midterm Exam: Advanced Programming Concepts",
    courseCode: "CS401",
    courseName: "Advanced Programming Concepts",
    instructor: "Dr. Parker",
    timeLimit: 90,
    totalQuestions: 15,
    instructions: "This exam consists of multiple choice, true/false, and short answer questions. You have 90 minutes to complete the exam.",
    questions: [
      {
        id: 1,
        type: "multiple-choice",
        text: "Which design pattern is used to create an object without exposing the creation logic?",
        options: [
          { id: "a", text: "Factory Pattern" },
          { id: "b", text: "Singleton Pattern" },
          { id: "c", text: "Observer Pattern" },
          { id: "d", text: "Decorator Pattern" }
        ]
      },
      {
        id: 2,
        type: "multiple-choice",
        text: "Which of the following is NOT a principle of object-oriented programming?",
        options: [
          { id: "a", text: "Encapsulation" },
          { id: "b", text: "Inheritance" },
          { id: "c", text: "Normalization" },
          { id: "d", text: "Polymorphism" }
        ]
      },
      {
        id: 3,
        type: "true-false",
        text: "In Java, a class can extend multiple classes.",
        correctAnswer: false
      },
      {
        id: 4,
        type: "true-false",
        text: "The Singleton pattern ensures that a class has only one instance.",
        correctAnswer: true
      },
      {
        id: 5,
        type: "short-answer",
        text: "Explain the difference between overloading and overriding methods in object-oriented programming.",
        wordLimit: 100
      }
      // ... Add more questions as needed
    ]
  };

  constructor(private router: Router, private titleService: Title) {
    this.timeRemaining = this.assessmentData.timeLimit * 60;
    this.titleService.setTitle('PRISM | Take Assessment');
  }

  // Getters
  get currentQuestion(): Question {
    return this.assessmentData.questions[this.currentQuestionIndex];
  }

  // Lifecycle hooks
  ngOnInit() {
    this.startTimer();
    this.initializeAnswers();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }

  startExam() {
    this.showInstructions = false;
    this.startTimer();
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
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Answer handling
  private initializeAnswers() {
    // Initialize enumeration answers as arrays
    this.assessmentData.questions.forEach(question => {
      if (question.type === 'enumeration') {
        this.answers[question.id] = Array(question.answerCount).fill('');
      }
    });
  }

  getAnsweredCount(): number {
    return Object.keys(this.answers).length;
  }

  // Helper functions
  getQuestionType(type: 'multiple-choice' | 'true-false' | 'short-answer' | 'enumeration'): string {
    const types = {
      'multiple-choice': 'Multiple Choice',
      'true-false': 'True/False', 
      'short-answer': 'Short Answer',
      'enumeration': 'Enumeration'
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

  goToQuestion(index: number) {
    if (index >= 0 && index < this.assessmentData.totalQuestions) {
      this.currentQuestionIndex = index;
    }
  }

  // Submit assessment
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

  getQuestionButtonClass(index: number, questionId: number): string {
    return `p-2 rounded text-sm ${
      this.currentQuestionIndex === index ? 'bg-blue-600 text-white' : 
      this.answers[questionId] ? 'bg-green-50 border-green-500' : 
      'bg-white border'
    }`;
  }

  openSubmitDialog() {
    this.showSubmitDialog = true;
  }

  countWords(event: any): void {
    const text = event.target.value || '';
    const words = text.trim().split(/\s+/).filter((word: string) => word.length > 0);
    this.currentWordCount = words.length;
  }
}
