import { CommonModule } from '@angular/common';
import { Component, HostListener, ViewChild, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';

interface Student {
  id: number;
  name: string;
  block: string;
  score: number;
  performance: string;
}

interface QuestionData {
  id: number;
  question: string;
  correct: number;
  incorrect: number;
  successRate: number;
}

@Component({
  selector: 'app-result',
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent, FormsModule],
  templateUrl: './result.component.html',
  styleUrl: './result.component.css'
})
export class ResultComponent implements OnInit {
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  isMobile = window.innerWidth < 768;
  sidebarOpen = !this.isMobile;

  @HostListener('window:resize')
  onResize() {
    const wasDesktop = !this.isMobile;
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile && !wasDesktop) {
      this.sidebarOpen = true;
    }
  }

  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 9;
  activeTab: string = 'results';

  studentsData: Student[] = [
    { id: 1, name: "Johnny Johny Doe", block: "3A", score: 99, performance: "Excellent" },
  ];

  questionData: QuestionData[] = [
    { id: 1, question: "What is the third layer in the OSI Layer?", correct: 38, incorrect: 10, successRate: 70 },
  ];

  topStudents = [
    { id: 1, name: "John Doe Johnny", score: 98 },
  ];

  strugglingStudents = [
    { id: 1, name: "Jane Doe Jane", score: 48 },
  ];

  insights = [
    "Students Struggled Most with understanding each Layer specifically the 3rd Layer",
  ];

  classOverview = {
    totalStudents: 50,
    averageScore: 78,
    highestScore: 90,
    lowestScore: 45,
  };

  scoreDistribution = [
    { range: "90-100", percentage: 30, color: "#36A2EB" },
  ];

  constructor() {

  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  get filteredStudents() {
    return this.studentsData.filter(student =>
      student.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get totalPages() {
    return Math.ceil(this.filteredStudents.length / this.itemsPerPage);
  }

  get currentStudents() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredStudents.slice(start, end);
  }

  getPerformanceColor(performance: string): string {
    switch (performance) {
      case "Excellent":
        return "text-green-500";
      case "Good":
        return "text-orange-500";
      case "Needs Improvement":
        return "text-red-500";
      default:
        return "";
    }
  }

  getProgressWidth(score: number): string {
    return `${score}%`;
  }

  handlePrevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  handleNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
