import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface Assessment {
  _id: string;
  title: string;
  totalQuestions: number;
  totalPoints: number;
  status: string;
  createdAt: string;
  category?: string;
  questionTypes: {
    [key: string]: number;
  };
  sharedBy?: string;
  sharedAt?: string;
}

interface Question {
  _id: string;
  type: string;
  questionText: string;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
}

@Component({
  selector: 'app-assessment-details-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assessment-details-panel.component.html',
  styleUrls: ['./assessment-details-panel.component.css']
})
export class AssessmentDetailsPanelComponent implements OnInit, OnChanges {
  @Input() assessment: Assessment | null = null;
  @Output() previewClick = new EventEmitter<string>();
  @Output() shareClick = new EventEmitter<string>();

  private api = inject(ApiService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  questions: Question[] = [];
  isLoadingQuestions: boolean = false;
  userId: string = '';

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe({
      next: (user) => {
        this.userId = user.id;
        if (this.assessment) {
          this.loadQuestions();
        }
        this.cdr.detectChanges();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assessment']) {
      if (this.assessment && this.userId) {
        this.loadQuestions();
      } else {
        this.questions = [];
        this.isLoadingQuestions = false;
      }
    }
  }

  loadQuestions(): void {
    if (!this.assessment || !this.userId) return;

    this.isLoadingQuestions = true;
    this.cdr.detectChanges();

    const data = {
      assessmentId: this.assessment._id,
      userId: this.userId
    };

    this.api.retrieveAssessmentData(data).subscribe({
      next: (resp: any) => {
        this.questions = resp.data?.questions || [];
        this.isLoadingQuestions = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading questions:', error);
        this.isLoadingQuestions = false;
        this.cdr.detectChanges();
      }
    });
  }

  getQuestionTypes(questionTypes: { [key: string]: number }): { type: string; count: number }[] {
    return Object.entries(questionTypes).map(([type, count]) => ({
      type: type.replace(/-/g, ' '),
      count
    }));
  }

  onPreview(): void {
    if (this.assessment) {
      this.previewClick.emit(this.assessment._id);
    }
  }

  onShare(): void {
    if (this.assessment) {
      this.shareClick.emit(this.assessment._id);
    }
  }

  getQuestionTypePercentage(count: number, total: number): number {
    return total > 0 ? (count / total) * 100 : 0;
  }

  getQuestionTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'multiple-choice':
        return 'fa-list-ul';
      case 'enumeration':
        return 'fa-list-ol';
      case 'true-false':
        return 'fa-check-circle';
      case 'short-answer':
        return 'fa-align-left';
      default:
        return 'fa-question';
    }
  }

  getFriendlyTypeName(type: string): string {
    return type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  formatAnswer(answer: string | string[]): string {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return answer;
  }
}

