import { CommonModule } from '@angular/common';
import { Component, HostListener, ViewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { Router } from '@angular/router';

export interface Assessment {
  id: string;
  title: string;
  subject: string;
  status: 'completed' | 'pending';
  score?: number;
  passingScore?: number;
  dateCompleted?: Date;
  dateAssigned?: Date;
  dueDate?: Date;
  timeLimit?: string;
  timeSpent?: string;
  questions?: number;
  rank?: number;
  totalStudents?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

@Component({
  selector: 'app-student-assessments',
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './student-assessments.component.html',
  styleUrl: './student-assessments.component.css'
})
export class StudentAssessmentsComponent implements OnInit {
  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  // Tab and search functionality
  activeTab: 'all' | 'completed' | 'pending' = 'all';
  searchQuery: string = '';
  assessments: Assessment[] = [];
  filteredAssessments: Assessment[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    // Initialize with mock data or fetch from service
    this.loadAssessments();
  }

  loadAssessments() {
    // Mock data - replace with actual API call
    this.assessments = [];
    this.filterAssessments();
  }

  filterAssessments() {
    this.filteredAssessments = this.assessments.filter(assessment => {
      const matchesSearch = !this.searchQuery || 
        assessment.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        assessment.subject.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesTab = this.activeTab === 'all' || assessment.status === this.activeTab;

      return matchesSearch && matchesTab;
    });
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  onResize() {
    this.isMobile = window.innerWidth < 768;
  }
}
