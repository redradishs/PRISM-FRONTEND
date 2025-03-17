import { CommonModule } from '@angular/common';
import { Component, HostListener, ViewChild, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

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

  assessmentId: string = '';
  classOverview: any = {
    totalStudents: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0
  };
  itemAnalysis: any[] = [];
  topPerforming: Student[] = [];
  leastPerforming: Student[] = [];

  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 9;
  activeTab: string = 'results';
  classResult: any[] = [];
  className: string = '';
  classCode: string = '';
  assessmentTitle: string = '';

  constructor(private api: ApiService, private auth: AuthService, private router: Router, private titleService: Title) {
    this.titleService.setTitle('PRISM | Result');
  }

  ngOnInit(): void {
    const state = history.state as { assessmentId: string };
    
    if (state && state.assessmentId) {
      this.assessmentId = state.assessmentId;
      this.getResultOverview(this.assessmentId);
      this.getItemAnalysis(this.assessmentId);
      this.getStudentPerformance(this.assessmentId);
      this.getClassResult(this.assessmentId);
      console.log('Assessment ID:', this.assessmentId);
    } else {
      console.log("Could not find the assessment ID");
      this.router.navigate(['/instructor/assessment']);
    }
  }

  getResultOverview(id: string) {
    this.api.getClassOverview(this.assessmentId).subscribe({
      next: (resp: any) => {
        this.classOverview = resp.data;
        this.assessmentTitle = resp.data.assessmentTitle;
        if (resp.data.classes && resp.data.classes.length > 0) {
          this.className = resp.data.classes[0].className;
          this.classCode = resp.data.classes[0].classCode;
        }
        console.log('Assessment Title:', this.assessmentTitle);
        console.log('Class Code:', this.classCode);
        console.log('Class Overview:', this.classOverview);
      },
      error: (error) => {
        console.error('Error getting class overview:', error);
      }
    });
  }

  getItemAnalysis(id: string) {
    this.api.getQuestionAnalysis(this.assessmentId).subscribe(({
      next: (resp: any) => {
        this.itemAnalysis = resp.data;
        console.log('Item Analysis:', this.itemAnalysis);
      }, error: (error) => {
        console.error('Error getting item analysis:', error);
      }
    }))
  }

  getStudentPerformance(id: string) {
    this.api.getTopandLowPerformers(this.assessmentId).subscribe(({
      next: (resp: any) => {
        this.topPerforming = resp.data.topPerformers;
        this.leastPerforming = resp.data.lowestPerformers;
        console.log('Top Performing Students:', this.topPerforming);
        console.log('Least Performing Students:', this.leastPerforming);
      }, error: (error) => {
        console.error('Error getting student performance:', error);
      }
    }))
  }

  getClassResult(id: string) {
    this.api.getClassScore(this.assessmentId).subscribe(({
      next: (resp: any) => {
        console.log('Class Result:', resp.data);
        this.classResult = resp.data;
      }, error: (error) => {
        console.error('Error getting class result:', error);
      } 
      }))
  }












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

  scoreDistribution = [
    { range: "90-100", percentage: 30, color: "#36A2EB" },
  ];



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
