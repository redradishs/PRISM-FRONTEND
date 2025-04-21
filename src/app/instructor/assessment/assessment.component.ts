import { Component, ViewChild, HostListener } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import Swal from 'sweetalert2';

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

interface ClassData {
    _id: string;
    classCode: string;
    className: string;
    block?: string;
    year?: string;
}

interface AssessmentMode {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface AssignData {
  assessmentId: string;
  startDate: string;
  dueDate: string;
  timeLimit: number;
  instructions: string;
  file: string;
  createdBy: string;
  assignmentMode: string;
  classCodes: string[];
  maxAttempts: number;
  totalPoints?: number;
  modeSettings: {
    masteryScore: number;
  };
}

@Component({
  selector: 'app-assessment',
  imports: [SidebarComponent, CommonModule, FormsModule, RouterLink],
  templateUrl: './assessment.component.html',
  styleUrl: './assessment.component.css',
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
  showAssignModal = false;
  assignData: AssignData = {
    assessmentId: '',
    startDate: '',
    dueDate: '',
    timeLimit: 60,
    instructions: '',
    file: '',
    createdBy: '',
    assignmentMode: 'assessment',
    classCodes: [],
    maxAttempts: 1,
    modeSettings: {
      masteryScore: 90
    }
  };
  classes: ClassData[] = [];
  isDropdownOpen = false;
  searchClass = '';
  filteredClasses: any[] = [];
  selectedMode: string = 'assessment';
  assessmentModes: AssessmentMode[] = [
    {
      id: 'assessment',
      name: 'Assessment Mode',
      description: 'Traditional assessment with class codes and specific settings',
      icon: 'fa-solid fa-clipboard-check'
    },
    {
      id: 'mastery',
      name: 'Mastery Mode',
      description: 'Students must achieve mastery level to complete',
      icon: 'fa-solid fa-trophy'
    },
    {
      id: 'public',
      name: 'Public Mode',
      description: 'Open assessment available to all students',
      icon: 'fa-solid fa-globe'
    }
  ];

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private titleService: Title
  ) {
    this.titleService.setTitle('PRISM | Assessments');
  }

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe((user) => {
      if (user) {
        this.userId = user.id;
        this.assignData.createdBy = user.id;
        this.getTotalStudents(this.userId);
        this.getTotalClasses(this.userId);
        this.loadAssessments(this.userId);
        this.getownAssessments(this.userId);
        this.getClassessDetails(this.userId);
        this.filteredClasses = this.classes;
      } else {
        console.log('No user found');
      }
    });
  }

  resetAssignData() {
    const currentTotalPoints = this.assignData?.totalPoints || 0;
    const baseData = {
      assessmentId: this.assignData?.assessmentId || '',
      startDate: '',
      dueDate: '',
      timeLimit: 60,
      instructions: '',
      file: '',
      createdBy: this.userId,
      assignmentMode: this.selectedMode,
      totalPoints: currentTotalPoints, // Preserve the total points
      modeSettings: {
        masteryScore: Math.min(90, currentTotalPoints) 
      }
    };

    if (this.selectedMode === 'mastery') {
      this.assignData = {
        ...baseData,
        classCodes: [],
        maxAttempts: 3
      };
    } else if (this.selectedMode === 'assessment') {
      this.assignData = {
        ...baseData,
        classCodes: [],
        maxAttempts: 1
      };
    } else { // public mode
      this.assignData = {
        ...baseData,
        classCodes: [],
        maxAttempts: 2
      };
    }
  }

  getClassessDetails(id: string) {
    this.api.getSpecifiedClasses(id).subscribe({
      next: (resp: any) => {
        this.classes = resp.data;
        console.log(this.classes);
      },
      error: (error) => {
        console.log(error);
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
      },
    });
  }

  getTotalClasses(id: string) {
    this.api.getTotalClassess(this.userId).subscribe({
      next: (resp: any) => {
        this.totalClasses = resp.data;
      },
      error: (error) => {
        console.log(error);
      },
    });
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
          gradedCount: assessment.classes[0].stats.graded,
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.log(error);
        this.isLoading = false;
      },
    });
  }

  getownAssessments(id: string) {
    this.isLoading = true;
    this.api.getOwnAssessments(this.userId).subscribe({
      next: (resp: any) => {
        this.ownAssessments = resp.data.sort((a: any, b:any) => new Date (b.createdAt).getTime() - new Date (a.createdAt).getTime())
        this.isLoading = false;
      },
      error: (error) => {
        console.log(error);
        this.isLoading = false;
      },
    });
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
    return this.assessments.filter((assessment) =>
      assessment.title.toLowerCase().includes(search)
    );
  }

  sortAssessments() {
    this.assessments.sort((a, b) => {
      switch (this.sortBy) {
        case 'date':
          return (
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
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
    return this.ownAssessments.filter((assessment) =>
      assessment.title.toLowerCase().includes(search)
    );
  }

  assessments: any[] = [];

  getDifficultyColor(difficulty: string): string {
    const colors = {
      Easy: 'bg-green-100 text-green-700',
      Medium: 'bg-yellow-100 text-yellow-700',
      Hard: 'bg-red-100 text-red-700',
    };
    return colors[difficulty as keyof typeof colors];
  }
  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  getQuestionTypes(assessment: any): string[] {
    Object.entries(assessment.questionTypes).map(
      ([type, count]) => `${type} (${count})`
    );
    return Object.entries(assessment.questionTypes).map(
      ([type, count]) => `${type} (${count})`
    );
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
      state: { assessmentId: id },
    });
  }

  openAssignModal(assessmentId: string) {
    // Find the assessment to get its total points
    const assessment = this.ownAssessments.find(a => a._id === assessmentId);
    console.log("Assessment found:", assessment);
    console.log("All assessments:", this.ownAssessments);
    
    // Safely access totalPoints with proper type checking
    let totalPoints = 0;
    if (assessment && typeof assessment.totalPoints === 'number') {
      totalPoints = assessment.totalPoints;
    }
    console.log("Total points:", totalPoints);

    const baseData = {
      assessmentId: assessmentId,
      startDate: '',
      dueDate: '',
      timeLimit: 60,
      instructions: '',
      file: '',
      createdBy: this.userId,
      assignmentMode: this.selectedMode,
      totalPoints: totalPoints,
      modeSettings: {
        masteryScore: Math.min(90, totalPoints) // Initialize mastery score as min of 90 or total points
      }
    };

    if (this.selectedMode === 'mastery') {
      this.assignData = {
        ...baseData,
        classCodes: [],
        maxAttempts: 3
      };
    } else if (this.selectedMode === 'assessment') {
      this.assignData = {
        ...baseData,
        classCodes: [],
        maxAttempts: 1
      };
    } else { // public mode
      this.assignData = {
        ...baseData,
        classCodes: [],
        maxAttempts: 2
      };
    }

    console.log("Final assignData:", this.assignData);
    this.showAssignModal = true;
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.selectedMode = 'assessment';
    this.resetAssignData();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.assignData.file = file.name;
    }
  }

  assignAssessment() {
    if (this.selectedMode !== 'public' && !this.assignData.classCodes.length) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select at least one class'
      });
      return;
    }

    const formattedData = {
      ...this.assignData,
      startDate: new Date(this.assignData.startDate).toISOString(),
      dueDate: new Date(this.assignData.dueDate).toISOString()
    };

    if ('dueTime' in formattedData) {
      delete formattedData.dueTime;
    }

    this.isLoading = true;
    this.api.assignAssessment(formattedData).subscribe({
      next: (resp: any) => {
        if (resp.remarks === 'Success') {
          let successMessage = '';
          if(this.selectedMode === 'assessment') {
            successMessage = 'Assessment assigned successfully';
          } else if (this.selectedMode === 'mastery') {
            successMessage = 'Mastery assessment assigned successfully';
          } else if (this.selectedMode === 'public') {
            successMessage = 'Public assessment assigned successfully, your students may now join with code ' + resp.data.joiningCode;
          } else {
            successMessage = 'Assessment assigned successfully';
          }
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: successMessage
          });
          this.closeAssignModal();
          this.loadAssessments(this.userId);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: resp.message || 'Failed to assign assessment'
          });
        }
      },
      error: (error) => {
        console.error('Error assigning assessment:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to assign assessment'
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  getClassName(code: string): string {
    const classItem = this.classes.find(c => c.classCode === code);
    if (classItem) {
      return `${classItem.className} (${classItem.classCode})`;
    }
    return code;
  }

  removeClass(code: string): void {
    this.assignData.classCodes = this.assignData.classCodes.filter((c: string) => c !== code);
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.filterClasses();
    }
  }

  filterClasses() {
    if (!this.searchClass.trim()) {
      this.filteredClasses = [...this.classes];
      return;
    }

    const searchTerm = this.searchClass.toLowerCase().trim();
    this.filteredClasses = this.classes.filter(c => 
      c.className.toLowerCase().includes(searchTerm) ||
      c.classCode.toLowerCase().includes(searchTerm) ||
      (c.block && c.block.toLowerCase().includes(searchTerm)) ||
      (c.year && c.year.toLowerCase().includes(searchTerm))
    );
  }

  isClassSelected(code: string): boolean {
    return this.assignData.classCodes.includes(code);
  }

  toggleClass(code: string) {
    const index = this.assignData.classCodes.indexOf(code);
    if (index === -1) {
      this.assignData.classCodes.push(code);
    } else {
      this.assignData.classCodes.splice(index, 1);
    }
  }

  getCurrentDateTime(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

  getMinDueDate(): string {
    const startDate = this.assignData.startDate ? new Date(this.assignData.startDate) : new Date();
    return startDate.toISOString().split('T')[0];
  }

  onModeChange(mode: string) {
    this.selectedMode = mode;
    this.resetAssignData();
  }

  validateMasteryScore() {
    if (this.assignData.totalPoints && this.assignData.modeSettings.masteryScore > this.assignData.totalPoints) {
      this.assignData.modeSettings.masteryScore = this.assignData.totalPoints;
    }
  }
}
