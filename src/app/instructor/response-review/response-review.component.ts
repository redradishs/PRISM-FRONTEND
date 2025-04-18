import { CommonModule } from '@angular/common';
import { Component, HostListener, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-response-review',
  imports: [CommonModule, SidebarComponent, FormsModule],
  templateUrl: './response-review.component.html',
  styleUrl: './response-review.component.css'
})
export class ResponseReviewComponent implements OnInit, OnDestroy {
  expandedQuestions: Set<number> = new Set();
  isMobile: boolean = false;
  isEditingFeedback: boolean = false;
  feedback: string = '';
  
  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  constructor() {
    // Check if the screen is mobile size
    this.checkMobileScreen();
    window.addEventListener('resize', () => this.checkMobileScreen());
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', () => this.checkMobileScreen());
  }

  private checkMobileScreen(): void {
    this.isMobile = window.innerWidth < 768;
  }

  toggleQuestion(questionId: number): void {
    if (this.expandedQuestions.has(questionId)) {
      this.expandedQuestions.delete(questionId);
    } else {
      this.expandedQuestions.add(questionId);
    }
  }

  isExpanded(questionId: number): boolean {
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

  // New methods for feedback functionality
  toggleFeedbackEdit(): void {
    this.isEditingFeedback = !this.isEditingFeedback;
  }

  cancelFeedbackEdit(): void {
    this.isEditingFeedback = false;
    // Reset feedback to original value if needed
  }

  saveFeedback(): void {
    // Implement save feedback logic here
    this.isEditingFeedback = false;
  }
}
