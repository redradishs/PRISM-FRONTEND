import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PrintQuestion {
    _id?: string;
    type: string;
    questionText: string;
    options?: string[];
    correctAnswer: string | string[];
    points: number;
}

export interface PrintAssessmentData {
    title: string;
    questions: PrintQuestion[];
    totalPoints: number;
    category: string;
}

export interface PrintOptions {
    segregateByType: boolean;
    includeAnswerKey: boolean;
    useColumnLayout: boolean;
    studentInfo: {
        name: string;
        yearCourseBlock: string;
        date: string;
        score: string;
    };
    generalInstructions: string;
}

@Component({
    selector: 'app-print-layout',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="print-container" [class.column-layout]="options.useColumnLayout">
      <!-- Header Section -->
      <div class="header">
        <h1 class="title">{{ data.title }}</h1>
        
        <!-- Student Information -->
        <div class="student-info">
          <div class="info-row">
            <div class="info-field">
              <span class="label">Name:</span>
              <span class="line">________________________________</span>
            </div>
            <div class="info-field">
              <span class="label">Date:</span>
              <span class="line">________________________________</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-field">
              <span class="label">Year, Course & Block:</span>
              <span class="line">________________________________</span>
            </div>
            <div class="info-field">
              <span class="label">Score:</span>
              <span class="line">________________________________</span>
            </div>
          </div>
        </div>

        <!-- General Instructions -->
        <div class="instructions" *ngIf="options.generalInstructions">
          <span class="instructions-label">General Instructions:</span>
          {{ options.generalInstructions }}
        </div>
      </div>

      <!-- Questions Section -->
      <div class="questions-container" [class.columns]="options.useColumnLayout">
        <ng-container *ngIf="options.segregateByType; else sequentialQuestions">
          <div *ngFor="let typeGroup of questionsByType; let typeIndex = index" class="question-type-section">
            <div class="type-header">
              {{ getRomanNumeral(typeIndex + 1) }}. {{ getFriendlyTypeName(typeGroup.type).toUpperCase() }}.
              {{ getTypeInstructions(typeGroup.type) }}
              NO ERASURES, NO SUPERIMPOSITIONS, and NO BLANK ANSWERS.
            </div>
            
            <div class="questions-list">
              <div *ngFor="let question of typeGroup.questions; let qIndex = index" class="question-item">
                <div class="question-text">
                  <span class="answer-space" *ngIf="question.type !== 'enumeration'">_____</span>{{ qIndex + 1 }}. {{ cleanQuestionText(question) }}
                </div>
                
                <!-- Multiple Choice Options -->
                <div *ngIf="question.type === 'multiple-choice' && question.options" class="options">
                  <div *ngFor="let option of question.options; let optIndex = index" class="option">
                    {{ getOptionLetter(optIndex) }}. {{ option }}
                  </div>
                </div>
                
                <!-- Enumeration Answer Lines -->
                <div *ngIf="question.type === 'enumeration'" class="enumeration-answers">
                  <div *ngFor="let line of getEnumerationLines(question); let lineIndex = index" class="answer-line">
                    {{ lineIndex + 1 }}. ________________________
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ng-container>

        <ng-template #sequentialQuestions>
          <div class="questions-list">
            <div *ngFor="let question of data.questions; let qIndex = index" class="question-item">
              <div class="question-text">
                <span class="answer-space" *ngIf="question.type !== 'enumeration'">_____</span>{{ qIndex + 1 }}. {{ cleanQuestionText(question) }}
              </div>
              
              <!-- Multiple Choice Options -->
              <div *ngIf="question.type === 'multiple-choice' && question.options" class="options">
                <div *ngFor="let option of question.options; let optIndex = index" class="option">
                  {{ getOptionLetter(optIndex) }}. {{ option }}
                </div>
              </div>
              
              <!-- Enumeration Answer Lines -->
              <div *ngIf="question.type === 'enumeration'" class="enumeration-answers">
                <div *ngFor="let line of getEnumerationLines(question); let lineIndex = index" class="answer-line">
                  {{ lineIndex + 1 }}. ________________________
                </div>
              </div>
            </div>
          </div>
        </ng-template>
      </div>

      <!-- Answer Key Section -->
      <div *ngIf="options.includeAnswerKey" class="answer-key">
        <div class="page-break"></div>
        <h2 class="answer-key-title">Answer Key: {{ data.title }}</h2>
        
        <ng-container *ngIf="options.segregateByType; else sequentialAnswers">
          <div *ngFor="let typeGroup of questionsByType; let typeIndex = index" class="answer-type-section">
            <h3 class="answer-type-header">
              {{ getRomanNumeral(typeIndex + 1) }}. {{ getFriendlyTypeName(typeGroup.type).toUpperCase() }}
            </h3>
            <div *ngFor="let question of typeGroup.questions; let qIndex = index" class="answer-item">
              {{ qIndex + 1 }}. {{ getAnswerText(question) }}
            </div>
          </div>
        </ng-container>

        <ng-template #sequentialAnswers>
          <div *ngFor="let question of data.questions; let qIndex = index" class="answer-item">
            {{ qIndex + 1 }}. {{ getAnswerText(question) }}
          </div>
        </ng-template>
      </div>
    </div>
  `,
    styleUrls: ['./print-layout.component.css']
})
export class PrintLayoutComponent {
    @Input() data!: PrintAssessmentData;
    @Input() options!: PrintOptions;

    get questionsByType() {
        const grouped = this.groupQuestionsByType(this.data.questions);
        return Object.keys(grouped).map(type => ({
            type,
            questions: grouped[type]
        }));
    }

    groupQuestionsByType(questions: PrintQuestion[]): { [key: string]: PrintQuestion[] } {
        return questions.reduce((groups, question) => {
            const type = question.type;
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(question);
            return groups;
        }, {} as { [key: string]: PrintQuestion[] });
    }

    getFriendlyTypeName(type: string): string {
        return type.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    getRomanNumeral(num: number): string {
        const romanNumerals = [
            { value: 1000, symbol: 'M' }, { value: 900, symbol: 'CM' }, { value: 500, symbol: 'D' },
            { value: 400, symbol: 'CD' }, { value: 100, symbol: 'C' }, { value: 90, symbol: 'XC' },
            { value: 50, symbol: 'L' }, { value: 40, symbol: 'XL' }, { value: 10, symbol: 'X' },
            { value: 9, symbol: 'IX' }, { value: 5, symbol: 'V' }, { value: 4, symbol: 'IV' },
            { value: 1, symbol: 'I' }
        ];
        let result = '';
        for (const { value, symbol } of romanNumerals) {
            while (num >= value) {
                result += symbol;
                num -= value;
            }
        }
        return result;
    }

    getTypeInstructions(type: string): string {
        switch (type.toLowerCase()) {
            case 'multiple-choice':
                return 'Choose the letter of the correct answer. Write your answer on the space provided.';
            case 'true-false':
                return 'Write T for True or F for False for each statement. Write your answer on the space provided.';
            case 'enumeration':
                return 'List all possible answers for each question. Write your answers on the spaces provided.';
            case 'identification':
                return 'Identify what is being asked in each question. Write your answer on the space provided.';
            case 'essay':
                return 'Answer each question in complete sentences and paragraphs. Write your answers on the spaces provided.';
            default:
                return 'Answer each question according to the instructions provided. Write your answers on the spaces provided.';
        }
    }

    cleanQuestionText(question: PrintQuestion): string {
        let questionText = question.questionText;
        if (question.type === 'true-false') {
            questionText = questionText.replace(/^(True\s+or\s+False\s*:\s*)/i, '');
        }
        return questionText;
    }

    getOptionLetter(index: number): string {
        return String.fromCharCode(65 + index);
    }

    getEnumerationLines(question: PrintQuestion): any[] {
        const answerCount = Array.isArray(question.correctAnswer) ? question.correctAnswer.length : 3;
        return Array(answerCount).fill(null);
    }

    getAnswerText(question: PrintQuestion): string {
        return Array.isArray(question.correctAnswer)
            ? question.correctAnswer.join(', ')
            : question.correctAnswer;
    }
} 
