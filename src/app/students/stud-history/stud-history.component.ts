import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';

interface Assessment {
  id: number;
  title: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  date: string;
  score: number;
  classAverage: number;
  status: string;
  type: 'exam' | 'quiz' | 'assignment' | 'project';
  duration?: number;
  questionsCount?: number;
  correctAnswers?: number;
  feedback: string;
  certificate: boolean;
  starred: boolean;
  performance: { category: string; score: number; }[];
}

interface PerformanceMetrics {
  totalAssessments: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  coursePerformance: {
    [key: string]: {
      courseName: string;
      assessments: number;
      totalScore: number;
      averageScore: number;
    };
  };
}

@Component({
  selector: 'app-stud-history',
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './stud-history.component.html',
  styleUrl: './stud-history.component.css'
})
export class StudHistoryComponent implements OnInit {
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

  Math = Math;
  // Search and filter states
  searchQuery: string = '';
  selectedTabIndex: number = 0;
  sortBy: string = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 6;
  
  // Data
  assessments: Assessment[] = [
    {
      id: 1,
      title: "Midterm Exam: Advanced Programming",
      courseCode: "CS401",
      courseName: "Advanced Programming",
      instructor: "Dr. Smith",
      date: "2024-03-15",
      score: 92,
      classAverage: 78,
      status: "completed",
      type: "exam",
      duration: 120,
      questionsCount: 50,
      correctAnswers: 46,
      feedback: "Excellent work! Strong understanding of concepts.",
      certificate: true,
      starred: true,
      performance: [
        { category: "Algorithms", score: 95 },
        { category: "Data Structures", score: 90 },
      ]
    },
    {
      id: 2,
      title: "Database Design Quiz",
      courseCode: "CS302",
      courseName: "Database Systems",
      instructor: "Prof. Johnson",
      date: "2024-03-10",
      score: 85,
      classAverage: 72,
      status: "completed",
      type: "quiz",
      duration: 30,
      questionsCount: 20,
      correctAnswers: 17,
      feedback: "Good understanding of SQL concepts.",
      certificate: false,
      starred: false,
      performance: [
        { category: "SQL", score: 85 },
        { category: "Normalization", score: 80 },
      ]
    },
    {
      id: 3,
      title: "Web Development Project",
      courseCode: "CS405",
      courseName: "Web Technologies",
      instructor: "Dr. Wilson",
      date: "2024-03-01",
      score: 88,
      classAverage: 75,
      status: "completed",
      type: "project",
      feedback: "Creative solution with good technical implementation.",
      certificate: true,
      starred: true,
      performance: [
        { category: "Frontend", score: 90 },
        { category: "Backend", score: 85 },
      ]
    }
  ];
  filteredAssessments: Assessment[] = [];
  performanceMetrics!: PerformanceMetrics;

  showSortMenu = false;
  tabs = ['All', 'Exams', 'Quizzes', 'Assignments', 'Projects', 'Starred', 'Certificates'];

  constructor(private dialog: MatDialog) {}

  ngOnInit() {
    this.calculateMetrics();
    this.filterAssessments();
  }

  get paginatedAssessments(): Assessment[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredAssessments.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAssessments.length / this.itemsPerPage);
  }

  get certificatesCount(): number {
    return this.assessments.filter(a => a.certificate).length;
  }

  calculateMetrics() {
    this.performanceMetrics = {
      totalAssessments: this.assessments.length,
      averageScore: this.assessments.reduce((acc, curr) => acc + curr.score, 0) / this.assessments.length,
      highestScore: Math.max(...this.assessments.map(a => a.score)),
      lowestScore: Math.min(...this.assessments.map(a => a.score)),
      coursePerformance: this.calculateCoursePerformance()
    };
  }

  filterAssessments() {
    let filtered = [...this.assessments];

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(query) ||
        a.courseCode.toLowerCase().includes(query) ||
        a.courseName.toLowerCase().includes(query)
      );
    }

    // Apply tab filter
    if (this.selectedTabIndex > 0) {
      const tabFilter = this.tabs[this.selectedTabIndex].toLowerCase();
      if (tabFilter === 'starred') {
        filtered = filtered.filter(a => a.starred);
      } else {
        filtered = filtered.filter(a => a.type.toLowerCase() === tabFilter.slice(0, -1));
      }
    }

    // Apply sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (this.sortBy) {
        case 'date':
          comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
          break;
        case 'score':
          comparison = b.score - a.score;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'course':
          comparison = a.courseCode.localeCompare(b.courseCode);
          break;
      }
      return this.sortOrder === 'asc' ? -comparison : comparison;
    });

    this.filteredAssessments = filtered;
    this.currentPage = 1; // Reset to first page when filters change
  }

  // Event Handlers
  onSearchChange() {
    this.currentPage = 1;
    this.filterAssessments();
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
    this.currentPage = 1;
    this.filterAssessments();
  }

  setSortBy(value: string) {
    if (this.sortBy === value) {
      this.toggleSortOrder();
    } else {
      this.sortBy = value;
    }
    this.filterAssessments();
  }

  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.filterAssessments();
  }

  getSortIndicator(column: string): string {
    if (this.sortBy === column) {
      return this.sortOrder === 'desc' ? '↓' : '↑';
    }
    return '';
  }

  // Pagination Methods
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Action Methods
  toggleStarred(id: number) {
    const assessment = this.assessments.find(a => a.id === id);
    if (assessment) {
      assessment.starred = !assessment.starred;
      this.filterAssessments();
    }
  }

  openDetailsDialog(assessment: Assessment) {
    console.log('Opening details for:', assessment);
    // Implement dialog logic here
  }

  private calculateCoursePerformance() {
    const coursePerformance: PerformanceMetrics['coursePerformance'] = {};
    
    this.assessments.forEach(assessment => {
      if (!coursePerformance[assessment.courseCode]) {
        coursePerformance[assessment.courseCode] = {
          courseName: assessment.courseName,
          assessments: 0,
          totalScore: 0,
          averageScore: 0
        };
      }
      
      const course = coursePerformance[assessment.courseCode];
      course.assessments++;
      course.totalScore += assessment.score;
      course.averageScore = course.totalScore / course.assessments;
    });

    return coursePerformance;
  }

  toggleSortMenu() {
    this.showSortMenu = !this.showSortMenu;
  }
}
