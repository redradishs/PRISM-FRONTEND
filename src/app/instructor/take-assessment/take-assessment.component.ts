import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Question {
  id: number;
  type: 'multiple-choice' | 'short-answer' | 'enumeration' | 'true-false';
  question: string;
  options?: string[];
  answer?: string;
  isAnswered: boolean;
  isFlagged: boolean;
}

@Component({
  selector: 'app-take-assessment',
  imports: [CommonModule, FormsModule],
  templateUrl: './take-assessment.component.html',
  styleUrl: './take-assessment.component.css'
})
export class TakeAssessmentComponent {
  currentQuestion = 0;
  timeLeft = 3600; // 1 hour in seconds
  isSubmitDialogOpen = false;
  answers: Record<number, string | string[]> = {};
  timer: any;

  questions: Question[] = [
    {
      id: 1,
      type: 'multiple-choice',
      question: 'Which layer of the OSI model is responsible for routing?',
      options: ['Network Layer', 'Transport Layer', 'Data Link Layer', 'Physical Layer'],
      isAnswered: false,
      isFlagged: false,
    },
    // ... other questions
  ];

  ngOnInit() {
    this.startTimer();
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 300 && this.timeLeft % 60 === 0) {
        // Show 5-minute warning
        this.showToast('Time Warning', `${Math.floor(this.timeLeft / 60)} minutes remaining!`);
      }
      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.handleSubmit();
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  handleAnswer(answer: string | string[]) {
    this.answers[this.questions[this.currentQuestion].id] = answer;
    this.questions[this.currentQuestion].isAnswered = true;
  }

  handleFlag() {
    this.questions[this.currentQuestion].isFlagged = !this.questions[this.currentQuestion].isFlagged;
  }

  handleSubmit() {
    console.log('Submitting answers:', this.answers);
  }

  setCurrentQuestion(index: number) {
    this.currentQuestion = index;
  }

  showToast(title: string, message: string) {
    // Implement toast notification
    console.log(title, message);
  }

  getProgressValue(): number {
    return ((this.currentQuestion + 1) / this.questions.length) * 100;
  }

  hasUnansweredQuestions(): boolean {
    return this.questions.some(q => !q.isAnswered);
  }

  getEnumerationValue(index: number): string {
    return (this.answers[this.questions[this.currentQuestion].id] as string[])?.[index] || '';
  }

  handleEnumerationAnswer(event: Event, index: number): void {
    const value = (event.target as HTMLInputElement).value;
    const currentAnswers = [...((this.answers[this.questions[this.currentQuestion].id] as string[]) || Array(4).fill(''))];
    currentAnswers[index] = value;
    this.handleAnswer(currentAnswers);
  }
}