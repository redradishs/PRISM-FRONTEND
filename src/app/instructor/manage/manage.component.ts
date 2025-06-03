import { Component, ViewChild, HostListener, OnInit } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
  modeSettings: {
    joiningCode?: string;
    [key: string]: any;
  };
  assignedClasses: AssignedClass[];
  masteryScore?: number;
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
  selector: 'app-manage',
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './manage.component.html',
  styleUrl: './manage.component.css'
})
export class ManageComponent implements OnInit {
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
    itemsPerPage: 10
  };

  assessmentCounts: AssessmentCounts = {
    total: 0,
    scheduled: 0,
    ongoing: 0,
    completed: 0
  };

  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  private searchSubject = new Subject<string>();

  viewMode: 'grid' | 'list' = 'grid';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private titleService: Title
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
    this.auth.getCurrentUser().subscribe((user) => {
      if(user) {
        this.userId = user.id;
        this.username = user.name;
        this.profile = user.profilePicture;
        
        // Check for tab parameter
        this.route.queryParams.subscribe(params => {
          const tab = params['tab'];
          if (tab) {
            this.selectedStatus = tab;
            localStorage.setItem('selectedAssessmentTab', tab);
          } else {
            const savedTab = localStorage.getItem('selectedAssessmentTab');
            if(savedTab) {
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

  //this function sets the view mode to what is LS, if not it falls to the default list mode
  setInitialViewMode() {
    const savedViewMode = localStorage.getItem('assessmentViewMode');
    if(savedViewMode === 'grid' || savedViewMode === 'list') {
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
    console.log('Search query:', query, 'Length:', query.length); // Debug log
    this.searchSubject.next(query);
  }

  performSearch(query: string) {
    console.log('Performing search for:', query);
    this.isLoading = true;
    const params = {
      page: this.pagination.currentPage,
      limit: this.pagination.itemsPerPage
    };

    if (query.length < 3) {
      this.loadAssessments();
      return;
    }

    this.api.searchAssessments(this.userId, query, params).subscribe({
      next: (response: any) => {
        console.log('Search response:', response);
        if (response.remarks === 'Success') {
          // Handle the different response format for search
          this.assessments = response.data.map((assessment: any) => ({
            ...assessment,
            assignedClasses: [], // Initialize as empty since search response doesn't include classes
            modeSettings: {}, // Initialize empty mode settings
            questions: assessment.questions || 0,
            type: assessment.type || 'Assessment',
            status: assessment.status || 'ongoing'
          }));

          // Since search doesn't return pagination info, adjust pagination
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
    this.isLoading = true;
    const params = {
      page: page,
      limit: this.pagination.itemsPerPage
    };

    // If there's a search query of 3 or more characters, use search endpoint
    if (this.searchQuery.length >= 3) {
      this.performSearch(this.searchQuery);
      return;
    }

    let request;
    switch (this.selectedStatus) {
      case 'ongoing':
        request = this.api.getOngoingAssessmentsWithPagination(this.userId, params);
        break;
      case 'scheduled':
        request = this.api.getScheduledAssessmentsWithPagination(this.userId, params);
        break;
      case 'completed':
        request = this.api.getCompletedAssessments(this.userId, params);
        break;
      default:
        request = this.api.getAllAssessments(this.userId, params);
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
      }
    });
  }

  loadAssessmentCounts() {
    this.api.getAssessmentCounts(this.userId).subscribe({
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
    window.scrollTo({top: 0, behavior: 'smooth'});
    if(assessment.type === 'Assessment' || assessment.type === 'Public Assessment') {
      this.router.navigate(['/instructor/result'], {
        state: { assessmentId: assessment.id }
      })
    } else if (assessment.type === 'Mastery') {
      this.router.navigate(['/instructor/result/mastery'], {
        state: { assessmentId: assessment.id }
      })
    } else {
      this.router.navigate(['/instructor/dashboard'])
    }
  }

  createNewAssessment() {
    this.router.navigate(['/instructor/generate']);
  }

  editAssessment(assessment: Assessment) {
    this.router.navigate(['/instructor/edit', assessment.assessmentId]);
  }

  viewAssessmentDetails(assessment: Assessment) {
    this.router.navigate(['/instructor/assessment', assessment.assessmentId]);
  }

  duplicateAssessment(assessment: Assessment) {
    // TODO: Implement duplication logic
    console.log('Duplicating assessment:', assessment.assessmentId);
  }

  deleteAssessment(assessment: Assessment) {
    // TODO: Implement deletion logic
    console.log('Deleting assessment:', assessment.assessmentId);
  }

  addStudent() {
    this.router.navigate(['instructor/students']);
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
    if (scrollPosition >= documentHeight - 100) { // 100px threshold
      if (this.pagination.currentPage < this.pagination.totalPages) {
        this.onPageChange(this.pagination.currentPage + 1);
      }
    }
  }
}