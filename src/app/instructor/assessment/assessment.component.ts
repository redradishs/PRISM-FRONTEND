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

interface DatePreset {
  label: string;
  startDate: Date;
  dueDate: Date;
}

interface AssessmentProgress {
  id: string;
  assessmentId: string;
  title: string;
  startDate: string;
  dueDate: string;
  timeLimit: number;
  type: string;
  masteryScore?: number;
  modeSettings?: {
    joiningCode: string;
    masteryScore?: number;
  };
  classes: {
    classCode: string;
    className: string;
    totalStudents: number;
    stats: {
      inProgress: number;
      submitted: number;
      graded: number;
      mastered?: number;
    };
    remainingStudents: number;
    responses: {
      status: string;
      score: number;
      studentId: string;
    }[];
  }[];
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
  username: string = '';
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

  startDatePresets: DatePreset[] = [
    {
      label: 'Now',
      startDate: new Date(),
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    {
      label: 'Tomorrow',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000)
    },
    {
      label: 'Next Week',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  ];

  dueDatePresets: DatePreset[] = [
    {
      label: '1hr',
      startDate: new Date(),
      dueDate: new Date(Date.now() + 60 * 60 * 1000)
    },
    {
      label: 'Tomorrow',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000)
    },
    {
      label: 'Next Week',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  ];

  onGoingAssessments: AssessmentProgress[] = [];
  totalOngoingAssessments: number = 0;
  remainingOngoingAssessments: number = 0;
  totalScheduledAssessments: number = 0;
  remainingScheduledAssessments: number = 0;
  scheduledAssessments: any[] = [];

  getLocalDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

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
        console.log('User ID:', user.id);
        this.userId = user.id;
        this.username = user.name;
        this.assignData.createdBy = user.id;
        this.getTotalStudents(this.userId);
        this.getTotalClasses(this.userId);
        this.loadAssessments(this.userId);
        this.getownAssessments(this.userId);
        this.getClassessDetails(this.userId);
        this.filteredClasses = this.classes;
        this.getOnGoingAssessments(this.userId);
        this.loadScheduledAssessments(this.userId);
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
          progress: this.calculateProgress(assessment as AssessmentProgress),
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

  calculateProgress(assessment: AssessmentProgress): number {
    if (assessment.type === 'Public Assessment') {
      return 0;
    }
    const totalStudents = assessment.classes[0]?.totalStudents || 0;
    const gradedCount = assessment.classes[0]?.stats.submitted || 0;
    return totalStudents > 0 ? (gradedCount / totalStudents) * 100 : 0;
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

  action1() {
    this.router.navigate(['/instructor/action1'])
  }

  action2() {
    this.router.navigate(['/instructor/action1'])
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

  async assignAssessment() {
    if (!this.assignData.assessmentId || !this.assignData.startDate || !this.assignData.dueDate) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Information',
        text: 'Please fill in all required fields.',
      });
      return;
    }

    // Only check for class selection if not in public mode
    if (this.selectedMode !== 'public' && this.assignData.classCodes.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'No Classes Selected',
        text: 'Please select at least one class.',
      });
      return;
    }

    if (this.selectedMode === 'mastery' && this.assignData.totalPoints && this.assignData.modeSettings.masteryScore > this.assignData.totalPoints) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Mastery Score',
        text: 'Mastery score cannot be greater than total points.',
      });
      return;
    }

    try {
      // Show loading state
      Swal.fire({
        title: 'Assigning Assessment',
        text: 'Please wait while we assign the assessment...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // For public mode, send without class codes
      if (this.selectedMode === 'public') {
        const assignmentData = {
          ...this.assignData,
          classCodes: [] // Empty array for public mode
        };
        await this.api.assignAssessment(assignmentData).toPromise();
      } else {
        // For other modes, assign to each class sequentially
        for (const classCode of this.assignData.classCodes) {
          const assignmentData = {
            ...this.assignData,
            classCodes: [classCode] // Send one class at a time
          };
          await this.api.assignAssessment(assignmentData).toPromise();
        }
      }

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Assessment Assigned',
        text: this.selectedMode === 'public' 
          ? 'The public assessment has been successfully created.' 
          : 'The assessment has been successfully assigned to all selected classes.',
      });

      // Reset form and close modal
      this.resetAssignData();
      this.closeAssignModal();
      this.loadAssessments(this.userId);
    } catch (error) {
      console.error('Error assigning assessment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Assignment Failed',
        text: 'There was an error assigning the assessment. Please try again.',
      });
    }
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

  applyStartDatePreset(preset: DatePreset, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.assignData.startDate = this.getLocalDateTime(preset.startDate);
  }

  applyDueDatePreset(preset: DatePreset, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.assignData.dueDate = this.getLocalDateTime(preset.dueDate);
  }

  viewAll() {
    if (this.totalOngoingAssessments > 0) {
      this.router.navigate(['/instructor/manage'], { queryParams: { tab: 'ongoing' } });
    } else if (this.totalScheduledAssessments > 0) {
      this.router.navigate(['/instructor/manage'], { queryParams: { tab: 'scheduled' } });
    }
  }

  getOnGoingAssessments(userId: string) {
    this.api.getOngoingAssessments(this.userId, 4).subscribe((resp: any) => {
      try {
        this.onGoingAssessments = resp.data.data;
        this.totalOngoingAssessments = resp.data.total;
        this.remainingOngoingAssessments = resp.data.left;
      } catch (error) {
        console.error('Error getting ongoing assessments:', error);
      }
    })
  }

  gotoAssessment(_id: string) {
    this.router.navigate(['/instructor/result'], {
      state: {assessmentId: _id}
    })
  }

  getAssessmentTypeIcon(assessment: AssessmentProgress): string {
    switch (assessment.type) {
      case 'Mastery':
        return 'fa-trophy';
      case 'Public Assessment':
        return 'fa-globe';
      case 'Assessment':
        return 'fa-clipboard-check';
      default:
        return 'fa-clipboard-check';
    }
  }

  getAssessmentTypeColor(assessment: AssessmentProgress): string {
    switch (assessment.type) {
      case 'Mastery':
        return 'amber';
      case 'Public Assessment':
        return 'blue';
      case 'Assessment':
        return 'indigo';
      default:
        return 'indigo';
    }
  }

  loadScheduledAssessments(id: string) {
    this.api.getScheduledAssessments(id, 4).subscribe((resp: any) => {
      try {
        this.scheduledAssessments = resp.data.data;
        this.totalScheduledAssessments = resp.data.total;
        this.remainingScheduledAssessments = resp.data.left;
      } catch (error) {
        console.error('Error getting scheduled assessments:', error);
      }
    })
  }
}
