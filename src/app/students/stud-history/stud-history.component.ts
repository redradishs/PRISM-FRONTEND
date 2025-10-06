import { Component, ViewChild, HostListener, OnInit } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { StudentService } from '../../services/student.service';
import Swal from 'sweetalert2';
import { TutorialService } from '../../services/tutorial.service';

interface ClassStats {
  inProgress: number;
  submitted: number;
  graded: number;
}

interface AssignedClass {
  className: string;
  classCode: string;
  totalStudents: number;
  stats: ClassStats;
}

interface Assessment {
  id: string;
  assessmentId: string;
  title: string;
  type: 'Assessment' | 'Public Assessment' | 'Mastery';
  instructions: string;
  category: string;
  questions: number;
  timeLimit: number;
  startDate: string;
  dueDate: string;
  status: 'scheduled' | 'ongoing' | 'completed';
  progress: number;
  studentStatus: 'not_started' | 'in_progress' | 'submitted';
  performance: {
    score: number;
    totalScore: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    percentage: number;
    timeSpent: {
      raw: number;
      formatted: string;
    };
    feedback: string | null;
  };
  submittedAt: string | null;
  remainingAttempts: number;
  class?: {
    className: string;
    classCode: string;
    totalStudents: number;
  };
  modeSettings?: {
    joiningCode: string;
  };
  isParticipant?: boolean;
}

interface ApiResponse {
  remarks: string;
  data: {
    data: Assessment[];
    total: number;
    returned: number;
    left: number;
    page: number;
    totalPages: number;
  };
  message: string;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface AssessmentCounts {
  total: number;
  scheduled: number;
  ongoing: number;
  completed: number;
}


@Component({
  selector: 'app-stud-history',
  imports: [CommonModule, SidebarComponent, FormsModule, RouterLink],
  templateUrl: './stud-history.component.html',
  styleUrl: './stud-history.component.css'
})
export class StudHistoryComponent {
  userId: string = '';
  username: string = '';
  profile: string = '';
  isMobile = window.innerWidth < 768;

  // Search and Filter Properties
  searchQuery: string = '';
  selectedMode: string = '';
  sortBy: string = 'newest';
  selectedStatus: string = '';

  // Assessment Data
  assessments: Assessment[] = [];
  filteredAssessments: Assessment[] = [];
  isLoading: boolean = false;

  // Pagination
  pagination: PaginationState = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 5
  };

  assessmentCounts: AssessmentCounts = {
    total: 0,
    scheduled: 0,
    ongoing: 0,
    completed: 0
  };

  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  isPaginationLoading: boolean = false;
  private searchSubject = new Subject<string>();
  viewMode: 'grid' | 'list' = 'list';

  constructor(
    private api: StudentService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private titleService: Title,
    private ts: TutorialService
  ) {
    this.titleService.setTitle('PRISM | Manage');

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      if (query.length >= 3) {
        this.performSearch(query);
      } else if (query.length === 0) {
        this.loadAssessments();
      }
    });
  }

  ngOnInit() {
    setTimeout(() => {
      if (this.ts.isTutorialInProgress()) {
        this.ts.continueTutorial();
      }
    }, 500);
    this.auth.getCurrentUser().subscribe((user) => {
      if (user) {
        // console.log('User ID:', user.id);
        this.userId = user.id;
        this.username = user.name;
        this.profile = user.profilePicture;

        this.route.queryParams.subscribe(params => {
          const tab = params['tab'];
          if (tab) {
            this.selectedStatus = tab;
            localStorage.setItem('selectedAssessmentTab', tab);
          } else {
            const savedTab = localStorage.getItem('selectedAssessmentTab');
            if (savedTab) {
              this.selectedStatus = savedTab;
            }
          }
          this.loadAssessments();
          this.loadAssessmentCounts();
        });
      } else {
        console.log('No user found');
      }
    });
    this.setInitialViewMode();
  }

  setInitialViewMode() {
    const savedViewMode = localStorage.getItem('assessmentViewMode');
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      this.viewMode = savedViewMode;
    } else if (window.innerWidth <= 640) {
      this.viewMode = 'list';
    }
  }


  @HostListener('window:resize', [])
  onResize() {
    this.setInitialViewMode();
  }

  onSearch(event: any) {
    const query = event.target.value.trim();
    this.searchQuery = query;
    // console.log('Search query:', query, 'Length:', query.length);
    this.searchSubject.next(query);
  }

  performSearch(query: string) {
    this.isLoading = true;
    const params = {
      page: this.pagination.currentPage,
      limit: this.pagination.itemsPerPage
    };

    if (query.length < 3) {
      this.loadAssessments();
      return;
    }

    this.api.searchAssessments(this.userId, query, this.pagination.currentPage, this.pagination.itemsPerPage).subscribe({
      next: (response: any) => {
        // console.log('Search response:', response);
        if (response.remarks === 'Success') {
          this.assessments = response.data.map((assessment: any) => ({
            ...assessment,
            assignedClasses: [],
            modeSettings: {},
            questions: assessment.questions || 0,
            type: assessment.type || 'Assessment',
            status: assessment.status || 'ongoing'
          }));

          this.pagination = {
            currentPage: 1,
            totalPages: 1,
            totalItems: this.assessments.length,
            itemsPerPage: this.pagination.itemsPerPage
          };

          this.filteredAssessments = this.assessments;
        }
      },
      error: (error) => {
        console.error('Error searching assessments:', error);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  loadAssessments(page: number = 1, append: boolean = false) {
    if (!append) {
      this.isLoading = true;
    }
    const params = {
      page: page,
      limit: this.pagination.itemsPerPage
    };

    if (this.searchQuery.length >= 3) {
      this.performSearch(this.searchQuery);
      return;
    }

    let request;
    switch (this.selectedStatus) {
      case 'ongoing':
        request = this.api.ongoingAssessments(this.userId, page, this.pagination.itemsPerPage);
        break;
      case 'scheduled':
        request = this.api.scheduledAssessments(this.userId, page, this.pagination.itemsPerPage);
        break;
      case 'completed':
        request = this.api.completedAssessments(this.userId, page, this.pagination.itemsPerPage);
        break;
      default:
        request = this.api.allAssessments(this.userId, page, this.pagination.itemsPerPage);
    }

    request.subscribe({
      next: (response: any) => {
        if (response.remarks === 'Success') {
          const newAssessments = response.data.data;
          if (append) {
            this.assessments = [...this.assessments, ...newAssessments];
          } else {
            this.assessments = newAssessments;
          }
          this.pagination = {
            currentPage: response.data.page,
            totalPages: response.data.totalPages,
            totalItems: response.data.total,
            itemsPerPage: this.pagination.itemsPerPage
          };
          this.filterAssessments();
        }
      },
      error: (error) => {
        console.error('Error loading assessments:', error);
      },
      complete: () => {
        this.isLoading = false;
        this.isPaginationLoading = false;
      }
    });
  }

  loadAssessmentCounts() {
    this.api.totalAssessments(this.userId).subscribe({
      next: (response: any) => {
        if (response.remarks === 'Success') {
          this.assessmentCounts = {
            total: response.data.total || 0,
            scheduled: response.data.scheduled || 0,
            ongoing: response.data.ongoing || 0,
            completed: response.data.completed || 0
          };
        }
      },
      error: (error) => {
        console.error('Error loading assessment counts:', error);
      }
    });
  }

  onTabChange(status: string) {
    this.selectedStatus = status;
    localStorage.setItem('selectedAssessmentTab', status);
    this.pagination.currentPage = 1;
    this.loadAssessments();
  }

  onPageChange(page: number) {
    this.isPaginationLoading = true;
    this.pagination.currentPage = page;
    this.loadAssessments(page, true);
  }

  filterAssessments() {
    if (this.searchQuery.length >= 3) {
      this.filteredAssessments = this.assessments;
      return;
    }

    // Normal filtering for non-search mode
    this.filteredAssessments = this.assessments.filter(assessment => {
      const matchesMode = !this.selectedMode || assessment.type === this.selectedMode;
      return matchesMode;
    });

    // Apply sorting
    this.filteredAssessments.sort((a, b) => {
      switch (this.sortBy) {
        case 'oldest':
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'dueDate':
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        default: // newest
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      }
    });
  }

  getStatusCount(status: string): number {
    return this.assessments.filter(a => a.status === status).length;
  }

  isTimeSpentAnomalous(assessment: Assessment): boolean {
    if (!assessment.performance?.timeSpent?.formatted) {
      return false;
    }
    const formatted = assessment.performance.timeSpent.formatted;
    const timeInSeconds = this.parseFormattedTime(formatted);
    const threeHoursInSeconds = 3 * 60 * 60;

    return timeInSeconds > threeHoursInSeconds || timeInSeconds < 0;
  }


  private parseFormattedTime(formatted: string): number {
    let totalSeconds = 0;

    const hoursMatch = formatted.match(/(\d+)h/);
    if (hoursMatch) {
      totalSeconds += parseInt(hoursMatch[1]) * 3600;
    }

    const minutesMatch = formatted.match(/(\d+)m/);
    if (minutesMatch) {
      totalSeconds += parseInt(minutesMatch[1]) * 60;
    }

    const secondsMatch = formatted.match(/(\d+)s/);
    if (secondsMatch) {
      totalSeconds += parseInt(secondsMatch[1]);
    }

    return totalSeconds;
  }

  getModeIcon(type: string): string {
    switch (type) {
      case 'Assessment': return 'fa-file-alt';
      case 'Public': return 'fa-globe';
      case 'Mastery': return 'fa-star';
      default: return 'fa-file';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'scheduled': return 'fa-calendar';
      case 'ongoing': return 'fa-hourglass-half';
      case 'completed': return 'fa-check-circle';
      default: return 'fa-circle';
    }
  }

  getProgressColor(progress: number): string {
    if (progress >= 75) return '#10B981'; // green
    if (progress >= 50) return '#FBBF24'; // yellow
    return '#EF4444'; // red
  }

  getAssignedClassesText(classes: AssignedClass[]): string {
    return classes.map(c => c.className).join(', ');
  }

  getTotalStudents(classes: AssignedClass[]): number {
    return classes.reduce((total, c) => total + c.totalStudents, 0);
  }

  getAssessmentProgress(classes: AssignedClass[]): number {
    const totalStudents = this.getTotalStudents(classes);
    if (totalStudents === 0) return 0;

    const totalSubmitted = classes.reduce((total, c) => total + c.stats.submitted, 0);
    return (totalSubmitted / totalStudents) * 100;
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  gotoResult(assessment: any) {
    // console.log('Navigating to result for:', assessment.type);
    if (assessment.status === 'completed' && assessment.studentStatus === 'not_started') {
      Swal.fire({
        icon: 'info',
        title: 'Assessment Not Attempted',
        text: 'This assessment has ended without any submission.',
        confirmButtonText: 'OK',
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        showCancelButton: false,
        background: '#f8fafc',
        color: '#334155',
        iconColor: '#64748b',
        padding: '1rem',
        width: 'auto',
        backdrop: false,
        allowOutsideClick: true,
        allowEscapeKey: true,
        stopKeydownPropagation: false
      })
    }
    else if (assessment.status === 'scheduled' || assessment.status === 'ongoing') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.router.navigate(['/student/confirmation'], {
        state: { assessmentId: assessment.id }
      });
    }
    else if (assessment.type === 'Assessment' || assessment.type === 'Public Assessment') {
      // console.log('Navigating to result for:', assessment.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.router.navigate(['/student/assessment/result'], {
        state: { assessmentId: assessment.id }
      })
    } else if (assessment.type === 'Mastery') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.router.navigate(['/student/assessment/result'], {
        state: { assessmentId: assessment.id }
      })
    } else {
      this.router.navigate(['/student/dashboard'])
    }
  }



  editAssessment(assessment: Assessment) {
    this.router.navigate(['/instructor/edit', assessment.assessmentId]);
  }

  viewAssessmentDetails(assessment: Assessment) {
    this.router.navigate(['/instructor/assessment', assessment.assessmentId]);
  }

  duplicateAssessment(assessment: Assessment) {
    // console.log('Duplicating assessment:', assessment.assessmentId);
  }

  deleteAssessment(assessment: Assessment) {
    // console.log('Deleting assessment:', assessment.assessmentId);
  }
  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
    localStorage.setItem('assessmentViewMode', mode);
  }


  //this function checks if the user has scrolled at the bottom then adds the loaded content
  @HostListener('window:scroll', [])
  onScroll() {
    const scrollPosition = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    if (scrollPosition >= documentHeight - 100 && !this.isPaginationLoading && !this.isLoading) {
      if (this.pagination.currentPage < this.pagination.totalPages) {
        this.onPageChange(this.pagination.currentPage + 1);
      }
    }
  }
}