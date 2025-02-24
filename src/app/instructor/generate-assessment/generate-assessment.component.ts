import { Component, HostListener, ViewChild, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';

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
  questions: string;
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

@Component({
  selector: 'app-generate-assessment',
  imports: [FormsModule, CommonModule, SidebarComponent, ReactiveFormsModule],
  templateUrl: './generate-assessment.component.html',
  styleUrl: './generate-assessment.component.css'
})
export class GenerateAssessmentComponent {
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }
  isSidebarOpen = false;

  activeTab = 'ai';
  selectedTypes: string[] = [];
  isGenerating = false;
  generatedQuestions: any[] = [];
  errorMessage: string | null = null;
  assessmentData = {
    title: '',
    category: '',
    timeLimit: 60,
    passingScore: 75,
    maxAttempts: 1
  };
  aiGeneration = {
    topic: '',
    difficulty: 'medium',
    questionCount: 5,
    instructions: ''
  };

  multipleChoiceOptions: string[] = Array(4).fill('');

  shortAnswerData = {
    sampleAnswer: '',
    charLimit: 500,
    points: 5
  };

  enumerationItems: string[] = Array(5).fill('');

  trueFalseAnswer: string = 'true';

  isDropdownOpen = false;
  questions: Question[] = [];
  nextId = 1;


  constructor(private apiService: ApiService) {

  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
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

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  generateQuestions(): void {
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

    const prompt = this.constructPrompt();

    this.apiService.generateQuizAssessment(
      this.aiGeneration.questionCount,
      this.aiGeneration.difficulty as 'easy' | 'medium' | 'hard',
      prompt 
    ).subscribe({
      next: (response: any) => {
        this.handleGeneratedQuestions(response);
        this.isGenerating = false;
      },
      error: (error: any) => {
        console.error('Error generating assessment', error);
        this.errorMessage = 'An error occurred while generating the assessment';
        this.isGenerating = false;
      }
    })
    
  }

  private handleGeneratedQuestions(response: AIResponse): void {
    if (!response.success) {
      this.errorMessage = 'Failed to generate questions';
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

          // For multiple choice, set the options array
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

  private mapQuestionType(aiType: string): string {
    const typeMap: { [key: string]: string } = {
      'multiple choice': 'multiple-choice',
      'short answer': 'short-answer',
      'enumeration': 'enumeration',
      'true/false': 'true-false'
    };
    return typeMap[aiType.toLowerCase()] || aiType;
  }

  private constructPrompt(): string {
    const typeMapping = {
      'mc': 'multiple choice',
      'sa': 'short answer',
      'enum': 'enumeration',
      'tf': 'true/false'
    };

    const selectedTypesText = this.selectedTypes
      .map(type => typeMapping[type as keyof typeof typeMapping])
      .join(', ');

    return `Generate ${this.aiGeneration.questionCount} ${this.aiGeneration.difficulty} ${this.aiGeneration.topic}.
    Question types: ${selectedTypesText}
    Additional instructions: ${this.aiGeneration.instructions || 'None'};`;
  }

  private getQuestionType(type: string): string {
    return this.selectedTypes.includes('mc') ? 'multiple-choice' : type;
  }
  saveAsDraft(): void {
    console.log('Saving as draft...');
  }

  publishAssessment(): void {
    if (!this.assessmentData.title || !this.assessmentData.category) {
      this.errorMessage = 'Title and category are required';
      return;
    }

    const formattedQuestions = this.questions.map(q => {
      const baseQuestion = {
        type: q.type,
        questionText: q.question,
        correctAnswer: q.type === 'true-false' ? Boolean(q.answer) : q.answer,
        points: Number(q.points),
        options: []
      };

      if (q.type === 'multiple-choice' && q.options) {
        return {
          ...baseQuestion,
          options: [q.options['A'], q.options['B'], q.options['C'], q.options['D']]
        };
      }

      return baseQuestion;
    });

    const assessmentData = {
      title: this.assessmentData.title,
      passingScore: this.assessmentData.passingScore,
      category: this.assessmentData.category,
      questions: formattedQuestions,
      totalPoints: formattedQuestions.length,
      createdBy: "67a7824b6c8b5fae5c5b3d81",
      status: "draft"
    };

    console.log('Submitting assessment:', assessmentData); 

    this.apiService.createAssessment(assessmentData).subscribe({
      next: (response) => console.log('Assessment created successfully', response),
      error: (error) => {
        console.error('Error creating assessment', error);
        this.errorMessage = 'Failed to create assessment';
      }
    });
  }

  previewAssessment(): void {
    console.log('Previewing assessment...');
  }

  addOption(): void {
    this.multipleChoiceOptions.push('');
  }
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  addQuestion(type: string): void {
    const newQuestion: Question = {
      type,
      id: this.nextId++,
      question: '',
      answer: type === 'enumeration' ? [''] : 
             type === 'true-false' ? false : '', 
      options: type === 'multiple-choice' ? { A: '', B: '', C: '', D: '' } : undefined,
      points: 1,
      requiredItems: type === 'enumeration' ? 1 : undefined
    };
    
    this.questions.push(newQuestion);
    this.isDropdownOpen = false;
  }

  deleteQuestion(id: number): void {
    this.questions = this.questions.filter(q => q.id !== id);
  }

  addEnumerationItem(question: any): void {
    if (Array.isArray(question.answer)) {
      question.answer.push('');
    }
  }
}
