import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-coordinator',
  imports: [SidebarComponent, CommonModule],
  templateUrl: './coordinator.component.html',
  styleUrl: './coordinator.component.css'
})
export class CoordinatorComponent {
  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  userId: string = '';
  username: string = '';
  profile: string = '';
  students: any[] = [];
  isLoading: boolean = true;

  // Pagination variables
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  totalItems: number = 0;
  pages: number[] = [];
  activeStudents: number = 0;
  averagePerformance: number = 0;
  totalStudents: number = 0;
  atRiskCount: number = 0;
  atRiskStudent: any[] = [];

  // Search variables
  searchQuery: string = '';
  private searchSubject = new Subject<string>();



  constructor(private router: Router, private api: ApiService, private auth: AuthService, private title: Title) {
    this.title.setTitle('PRISM | Coordinator');
    this.setupSearch();
  }

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe((user) => {
      this.userId = user.id;
      this.username = user.name || '';
      this.profile = user.profilePicture;
      this.getData(this.userId);
      this.getStats();
    })
  }

  setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      if (searchTerm.trim()) {
        this.searchStudent(searchTerm);
      } else {
        this.defaultview();
      }
    });
  }

  onSearchChange(event: any) {
    const searchTerm = event.target.value;
    this.searchQuery = searchTerm;
    this.searchSubject.next(searchTerm);
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  getData(id: string) {
    this.api.studentData(this.userId, {
      page: this.currentPage,
      limit: this.itemsPerPage
    }).subscribe({
      next: (resp: any) => {
        this.students = resp.data.students;
        this.totalItems = resp.data.totalItems;
        this.totalPages = resp.data.totalPages;
        this.currentPage = resp.data.currentPage;
        this.generatePageNumbers();
        console.log('Student data:', resp.data);
      },
      error: (error) => {
        console.error(error);
      }
    })
  }

  getStats() {
    this.api.coordinatorStats(this.userId).subscribe({
      next: (resp: any) => {
        this.totalStudents = resp.data.totalStudents;
        this.activeStudents = resp.data.verifiedStudents;
        this.averagePerformance = resp.data.averagePerformanceVerified;
        this.atRiskCount = resp.data.atRiskCount;
        this.atRiskStudent = resp.data.atRiskStudents;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
      }
    })
  }

  searchStudent(searchQuery: string) {
    this.api.coordinatorSearch(this.userId, searchQuery).subscribe({
      next: (resp: any) => {
        this.students = resp.data.students;
        this.totalItems = resp.data.totalItems || this.students.length;
        this.totalPages = resp.data.totalPages || 1;
        this.currentPage = 1;
        this.generatePageNumbers();
      },
      error: (error) => {
        console.error(error);
      }
    })
  }

  defaultview() {
    this.searchQuery = '';
    this.getData(this.userId);
  }


  showAtRiskStudents() {
    this.students = this.atRiskStudent;
    this.totalItems = this.atRiskStudent.length;
    this.totalPages = 1;
    this.currentPage = 1;
    this.generatePageNumbers();
  }

  generatePageNumbers() {
    this.pages = [];
    if (this.totalPages <= 7) {
      for (let i = 1; i <= this.totalPages; i++) {
        this.pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          this.pages.push(i);
        }
        this.pages.push(-1);
        this.pages.push(this.totalPages);
      }
      else if (this.currentPage >= this.totalPages - 2) {
        this.pages.push(1);
        this.pages.push(-1);
        for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
          this.pages.push(i);
        }
      }
      else {
        this.pages.push(1);
        this.pages.push(-1);
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          this.pages.push(i);
        }
        this.pages.push(-1);
        this.pages.push(this.totalPages);
      }
    }
  }

  goToPage(page: number) {
    if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.getData(this.userId);
    }
  }

  get startItem(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  createNewAssessment() {
    this.router.navigate(['/instructor/manage']);
  }

  addStudent() {
    this.router.navigate(['/instructor/students']);
  }

  viewStudent(student: any) {
    if (student.assessmentsTaken > 0) {
      this.router.navigate(['/instructor/evaluate'], {
        state: {
          studentId: student._id
        }
      });
    } else {
      Swal.fire({
        title: 'No Assessments',
        text: 'This student hasn\'t taken any assessment yet',
        icon: 'info',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1000,
        timerProgressBar: true,
        background: '#fff',
        iconColor: '#3b82f6'
      });
    }
  }
}
