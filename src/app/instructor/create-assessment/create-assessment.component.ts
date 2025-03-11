import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface AIResponse {
  success: boolean;
  payload: {
    timestamp: string;
    data: string;
    dev: {
      API_OWNER: string;
      company: string;
      API: string;
    }
  };
  message: string;
  rawResponse: string
  questions: string;
}

interface AIQuestion {
  question: string;
  type: string;
  difficulty: string;
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: string;
}

interface Question {
  type: string;
  id: number;
  question: string;
  answer: string | string[] | boolean;
  options?: { [key: string]: string };
  points: number;
  requiredItems?: number;
}

interface NewQuestion {
  type: string;
  count: number;
}

@Component({
  selector: 'app-create-assessment',
  imports: [CommonModule, SidebarComponent, FormsModule],
  templateUrl: './create-assessment.component.html',
  styleUrl: './create-assessment.component.css'
})
export class CreateAssessmentComponent implements OnInit {
  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  assessmentData = {
    title: '',
    category: '',
    timelimit: '60',
    passingScore: '70',
    maxAttempts: '1',
  }

  aiGeneration = {
    topic: '',
    difficulty: 'medium',
    questionCount: '5',
    instructions: '',
  }
  userId: number = 0;
  multipleChoiceOptions: string[] = Array(4).fill('');
  enumerationItems: string[] = Array(5).fill('');
  selectedTypes: string[] = [];
  errorMessage: string | null = null;
  trueFalseAnswer: string = 'true';
  questions: Question[] = [];
  nextId = 1;
  generated = false;
  isGenerating = false;
  loading = false;
  step = 1;
  isMenuOpen = false;
  editingQuestionId: number | null = null;
  showAddDialog = false;
  newQuestion: NewQuestion = {
    type: 'multiple-choice',
    count: 1
  };

  constructor(private api: ApiService, private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe((user: any) => {
      this.userId = user.id;
      console.log(this.userId);
    }, (error: any) => {
      console.error('Error getting current user', error);
    })
  }


  generateNow() {
    if(!this.aiGeneration.topic) {
      this.errorMessage = 'Please enter a topic';
      return;
    }
    if(this.selectedTypes.length === 0) {
      this.errorMessage = 'Please select at least one question type';
      return;
    }
    this.isGenerating = true;
    this.errorMessage = null;
    this.generated = false;

    const prompt = this.promptMaker();

    this.api.generateQuizAssessment(
      Number(this.aiGeneration.questionCount),
      this.aiGeneration.difficulty as 'easy' | 'medium' | 'hard',
      prompt 
    ).subscribe({
      next: (response: any) => {
        this.handleGeneratedQuestions(response);
        this.isGenerating = false;
        this.generated = true;
      },
      error: (error: any) => {
        console.error('Error generating assessment', error);
        this.errorMessage = 'An error occurred while generating the assessment';
        this.isGenerating = false;
      }
    })
  }


  private promptMaker() {
    const typeMapping = {
      mc: 'Multiple Choice',
      sa: 'Short Answer',
      tf: 'True/False',
      enum: 'Enumeration',
    }

    const selectedTypesText = this.selectedTypes
    .map(type => typeMapping[type as keyof typeof typeMapping])
    .join(', ');

    return `Generate ${this.aiGeneration.difficulty} questions for ${this.aiGeneration.topic}.
    Question types: ${selectedTypesText}
    Additional instructions: ${this.aiGeneration.instructions || 'None'};`;
  }

  private mapQuestionType(aiType: string): string {
    const typeMap: { [key: string]: string } = {
      'multiple choice': 'multiple-choice',
      'short answer': 'short-answer',
      'enumeration': 'enumeration',
      'true/false': 'true-false'
    };
    return typeMap[aiType.toLowerCase()] || aiType;
  }

  private handleGeneratedQuestions(response: AIResponse): void {
    if (!response.success) {
      const message = response.rawResponse;
      this.errorMessage = `${message} please add additional instructions or upload your document and i will help you generate your questions.`|| 'Failed to generate questions';
      return;
    }
    if(!response.questions || response.questions.length === 0) {
      const message = response.rawResponse;
      this.errorMessage = `${message} please add additional instructions or upload your document and i will help you generate your questions.`|| 'Failed to generate questions';
      return;
    }
    

    try {
      const questions = response.questions;
      
      if (Array.isArray(questions)) {
        questions.forEach((question: AIQuestion) => {
          const formattedQuestion = {
            type: this.mapQuestionType(question.type),
            id: this.nextId++,
            question: question.question,
            options: question.type === 'multiple choice' ? {
              A: question.options?.A || '',
              B: question.options?.B || '',
              C: question.options?.C || '',
              D: question.options?.D || ''
            } : undefined,
            answer: question.answer,
            difficulty: question.difficulty,
            points: 1 
          };

          if (formattedQuestion.type === 'multiple-choice' && question.options) {
            this.multipleChoiceOptions = [
              question.options.A,
              question.options.B,
              question.options.C,
              question.options.D
            ];
          }

          // For enumeration, set the enumeration items
          if (formattedQuestion.type === 'enumeration' && Array.isArray(question.answer)) {
            this.enumerationItems = question.answer;
          }

          // For true/false, set the answer
          if (formattedQuestion.type === 'true-false') {
            this.trueFalseAnswer = question.answer.toLowerCase();
          }

          this.questions.push(formattedQuestion);
        });
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      this.errorMessage = 'Error processing the generated questions';
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleType(type: string): void {
    const index = this.selectedTypes.indexOf(type);
    if (index === -1) {
      this.selectedTypes.push(type);
    } else {
      this.selectedTypes.splice(index, 1);
    }
  }

  isTypeSelected(type: string): boolean {
    return this.selectedTypes.includes(type);
  }

  getQuestionsByType(type: string): Question[] {
    return this.questions.filter(q => q.type === type);
  }

  getQuestionTypeCount(type: string): number {
    return this.getQuestionsByType(type).length;
  }

  getTotalPointsByType(type: string): number {
    return this.questions
        .filter(q => q.type === type)
        .reduce((sum, q) => sum + (q.points || 0), 0);
  }

  getPointLabel(type: string): string {
    const points = Number(this.getTotalPointsByType(type));
    return points === 1 ? 'point' : 'points';
  }

  isArray(value: any): value is string[] {
    return Array.isArray(value);
  }

  deleteQuestion(questionId: number) {
    this.questions = this.questions.filter(q => q.id !== questionId);
    // Renumber remaining questions
    this.questions = this.questions.map((q, index) => ({
      ...q,
      id: index + 1
    }));
  }

  editQuestion(questionId: number) {
    const question = this.questions.find(q => q.id === questionId);
    if (question) {
      // Set question for editing (you can implement modal/form logic here)
      console.log('Editing question:', question);
    }
  }

  toggleEdit(questionId: number) {
    this.editingQuestionId = this.editingQuestionId === questionId ? null : questionId;
  }

  isEditing(questionId: number): boolean {
    return this.editingQuestionId === questionId;
  }

  getEnumAnswer(answer: string | boolean | string[], index: number): string {
    return Array.isArray(answer) ? answer[index] : '';
  }

  setEnumAnswer(question: Question, index: number, value: string): void {
    if (Array.isArray(question.answer)) {
        question.answer[index] = value;
    }
  }

  addNewQuestions() {
    const startId = this.questions.length + 1;
    for(let i = 0; i < this.newQuestion.count; i++) {
      const question: Question = {
        id: startId + i,
        type: this.newQuestion.type,
        question: '',
        points: 1,
        answer: this.newQuestion.type === 'true-false' ? 'True' : 
                this.newQuestion.type === 'enumeration' ? [] : '',
        options: this.newQuestion.type === 'multiple-choice' ? {
          A: '',
          B: '',
          C: '',
          D: ''
        } : undefined
      };
      this.questions.push(question);
    }
    this.showAddDialog = false;
  }

  publishAssessment() {
    if(this.assessmentData.title === '' || this.assessmentData.category === '' || this.assessmentData.timelimit === '' || this.assessmentData.passingScore === '' || this.assessmentData.maxAttempts === '') {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    const format = this.questions.map(q => {
      const base = {
        type: q.type,
        questionText: q.question,
        correctAnswer: q.answer,
        points: q.points,
        options: []
      };

      if(q.type === 'multiple-choice' && q.options) {
        return {
          ...base,
          options: [q.options['A'], q.options['B'], q.options['C'], q.options['D']]
        };
      }

      return base;
    });

    const assessmentData = {
      title: this.assessmentData.title,
      passingScore: this.assessmentData.passingScore,
      category: this.assessmentData.category,
      questions: format,
      totalPoints: format.length,
      createdBy: this.userId,
      status: 'draft',
    }

    console.log("Ito yung data ng assessments", assessmentData);

    this.api.createAssessment(assessmentData).subscribe({
      next: (resp: any) => {
        console.log("Response ng assessment", resp);
      },
      error: (error: any) => {
        console.error('Error creating assessment', error);
      }
    })
  }
}

