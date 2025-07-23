import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, NgModel } from '@angular/forms';

@Component({
  selector: 'app-adm-userlist',
  imports: [CommonModule, SidebarComponent, RouterLink, FormsModule],
  templateUrl: './adm-userlist.component.html',
  styleUrl: './adm-userlist.component.css'
})
export class AdmUserlistComponent {
  userId: string = '';
  username: string = '';
  profile: string = '';
  isMobile = window.innerWidth < 768;
  isLoading: boolean = true;
  isLoadingUsers: boolean = true;
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  totalUserDB: number = 0;

  private searchTimeout: any;

  // QUERY PARAMS 
  currentPage: number = 1;
  hasNext: boolean = false;
  hasPrevious: boolean = false;
  totalPages: number = 0;
  totalUsers: number = 0;

  role: string = 'student';
  program: string = 'bsit';
  verified: string = 'all'
  limit: number = 10;
  searchTerm: string = '';
  userList: any[] = [];
  paginationData: any;
  Math = Math;
  basicData: any;
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {

    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.userList.forEach(student => {
        student.showDropdown = false;
      });
    }
  }



  constructor(private auth: AuthService, private api: AdminService) {
  }

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe(user => {
      this.userId = user.id,
        this.username = user.name,
        this.profile = user.profilePicture,
        this.getList();
      this.getData();
    })
  }
  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  onSearch(event: any) {
    const searchValue = event.target.value;
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.searchTerm = searchValue;
      this.currentPage = 1;
      this.getList();
    }, 5000)
  }

  onEnterSearch(event: any) {
    const searchValue = event.target.value;
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTerm = searchValue;
    this.currentPage = 1;
    this.getList();
  }
  getList() {
    this.isLoadingUsers = true;
    const apiCall = this.searchTerm.trim()
      ? this.api.searchAllUsers(this.role, this.limit, this.program, this.currentPage, this.searchTerm, this.verified)
      : this.api.getAllUsers(this.role, this.limit, this.program, this.currentPage, this.verified);

    apiCall.subscribe({
      next: (resp: any) => {
        this.userList = resp.data.users;
        const pagination = resp.data.pagination;
        this.currentPage = pagination.currentPage;
        this.totalPages = pagination.totalPages;
        this.totalUsers = pagination.totalUsers;
        this.hasNext = pagination.hasNext;
        this.hasPrevious = pagination.hasPrev;
        this.limit = pagination.limit;
        this.isLoadingUsers = false;
      }, error: (error: any) => {
        console.error('Error fetching users', error);
        this.isLoadingUsers = false;
      }
    })
  }

  getData() {
    this.api.getBasicData().subscribe({
      next: (resp: any) => {
        this.isLoading = false;
        this.basicData = resp.data;
        console.log('Basic data fetched successfully', resp.data);
        this.totalUserDB = this.basicData.totalStudents + this.basicData.totalInstructors;
      }, error: (error: any) => {
        console.error('Error fetching basic data', error);
      }
    })
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.getList();
    }
  }

  nextPage() {
    if (this.hasNext) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage() {
    if (this.hasPrevious) {
      this.goToPage(this.currentPage - 1);
    }
  }

  onRoleChange(newRole: string) {
    this.role = newRole;
    if (this.role == 'instructor') {
      this.program = 'all';
    }
    this.currentPage = 1;
    this.getList();
  }
  onProgramChange(newProgram: string) {
    this.program = newProgram;
    this.currentPage = 1;
    this.getList();
  }
  onVerifiedChange(newVerified: string) {
    this.verified = newVerified;
    this.currentPage = 1;
    this.getList();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, this.currentPage + 2);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages
  }
  trackByStudentId(index: number, student: any): number {
    return student.id;
  }

  setFilter(role: string) {
    if (role === 'all') {
      this.role = role;
      this.verified = 'all';
      this.program = 'all';
      this.currentPage = 1;
      this.getList();
    } else {
      this.role = role;
      this.currentPage = 1;
      this.getList();
    }
  }

  toggleDropdown(studentId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    this.userList.forEach(student => {
      if (student.id !== studentId) {
        student.showDropdown = false;
      }
    });

    const student = this.userList.find(s => s.id === studentId);
    if (student) {
      student.showDropdown = !student.showDropdown;
    }
  }

  onActionClick(action: string, studentId: number, event: Event) {
    event.stopPropagation();

    const student = this.userList.find(s => s.id === studentId);
    if (student) {
      student.showDropdown = false;
    }

    console.log(`Action: ${action} for student ID: ${studentId}`);

    switch (action) {
      case 'view-profile':
        break;
      case 'reset-password':
        break;
      case 'view-logs':
        break;
      case 'suspend':
        break;
      case 'delete':
        break;
    }
  }

  ngOnDestroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }


}
