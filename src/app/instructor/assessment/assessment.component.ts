import { Component, ViewChild, HostListener } from '@angular/core';
import { SidebarComponent } from "../../adons/sidebar/sidebar.component";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

interface AssessmentCard {
  title: string;
  date: string;
  score: number;
  progress: number;
  students: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface ClassPerformance {
  name: string;
  averageScore: number;
  totalStudents: number;
  completionRate: number;
}


@Component({
  selector: 'app-assessment',
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './assessment.component.html',
  styleUrl: './assessment.component.css'
})
export class AssessmentComponent {
  isSidebarOpen = false;
  searchTerm = '';
  sortBy = 'date';
  isMobile = window.innerWidth < 768;
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }
  userId: string = '';
  totalStudents: number = 0;
  totalClasses: number = 0;
  isLoading: boolean = false;
  ownAssessments: any[] = [];
  activeDropdown: string | null = null;
  showAll: boolean = false;

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {

  }

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe((user) => {
      if(user) {
        this.userId = user.id;
        this.getTotalStudents(this.userId);
        this.getTotalClasses(this.userId);
        this.loadAssessments(this.userId);
        this.getownAssessments(this.userId);
      } else {
        console.log('No user found');
      }
    })
  }

  getTotalStudents(id: string) {
    this.api.getInstructorTotalStudents(this.userId).subscribe({
      next: (resp: any) => {
        this.totalStudents = resp.data;
      },
      error: (error) => {
        console.log(error);
      }
    })
  }

  getTotalClasses(id: string) {
    this.api.getTotalClassess(this.userId).subscribe({
      next: (resp: any) => {
        this.totalClasses = resp.data;
      },
      error: (error) => {
        console.log(error);
      }
    })
  }

  loadAssessments(id: string) {
    this.isLoading = true;
    this.api.getAssessments(this.userId).subscribe({
      next: (resp: any) => {
        this.assessments = resp.data.map((assessment: any) => ({
          ...assessment,
          progress: this.calculateProgress(assessment),
          totalStudents: assessment.classes[0].stats.totalStudents,
          submittedCount: assessment.classes[0].stats.submitted,
          gradedCount: assessment.classes[0].stats.graded
        }));
        this.isLoading = false;
      }, error: (error) => {
        console.log(error);
        this.isLoading = false;
      }
    })
  }

  getownAssessments(id: string) {
    this.isLoading = true;
    this.api.getOwnAssessments(this.userId).subscribe({
      next: (resp: any) => {
        this.ownAssessments = resp.data;
        this.isLoading = false;
      }, error: (error) => {
        console.log(error);
        this.isLoading = false;
      }
    })
  }

  calculateProgress(assessment: any) {
    const stats = assessment.classes[0].stats;
    return stats.totalStudents > 0
    ? (stats.submitted / stats.totalStudents) * 100
    : 0;
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value;
    this.filterAssessments();
  }

  onSortChange(value: string): void {
    this.sortBy = value;
    this.filterAssessments();
  }

  filterAssessments() {
    if (!this.searchTerm) return this.assessments;
    const search = this.searchTerm.toLowerCase();
    return this.assessments.filter(assessment => assessment.title.toLowerCase().includes(search));
  }

  sortAssessments() {
    this.assessments.sort((a, b) => {
      switch (this.sortBy) {
        case 'date':
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'progress':
          return b.progress - a.progress;
        default:
          return 0;
      }
    });
  }

  filterOwnAssessments() {
    if (!this.searchTerm) return this.ownAssessments;
    
    const search = this.searchTerm.toLowerCase();
    return this.ownAssessments.filter(assessment => 
      assessment.title.toLowerCase().includes(search)
    );
  }


  assessments: any[] = [];

  getDifficultyColor(difficulty: string): string {
    const colors = {
      Easy: "bg-green-100 text-green-700",
      Medium: "bg-yellow-100 text-yellow-700",
      Hard: "bg-red-100 text-red-700",
    };
    return colors[difficulty as keyof typeof colors];
  }
  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  getQuestionTypes(assessment: any): string[] {
    Object.entries(assessment.questionTypes)
      .map(([type, count]) => `${type} (${count})`);
    return Object.entries(assessment.questionTypes)
      .map(([type, count]) => `${type} (${count})`);
  }

  getTypeCount(assessment: any): number {
    return Object.keys(assessment.questionTypes).length;
  }

  toggleTypeDropdown(assessmentId: string) {
    if (this.activeDropdown === assessmentId) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = assessmentId;
    }
    console.log('Active dropdown is now:', this.activeDropdown);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.activeDropdown) {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        this.activeDropdown = null;
      }
    }
  }

  goToGenerate() {
    this.router.navigate(['/instructor/generate']);
  }

  navigateToResult(id: string) {
    this.router.navigate(['/instructor/result'], {
      state: {assessmentId: id} 
    });
  }

}
