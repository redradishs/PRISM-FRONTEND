import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, NgModel } from '@angular/forms';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-adm-userlist',
  imports: [CommonModule, SidebarComponent, FormsModule],
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
  isLoadingReports: boolean = false;
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  totalUserDB: number = 0;

  private searchTimeout: any;

  showResetPasswordModal: boolean = false;
  showBanUserModal: boolean = false;
  selectedUser: any = null;
  newPassword: string = '';
  showPassword: boolean = false;
  selectedBanDuration: number = 60;
  banReason: string = 'Malicious Activity Detected';

  // QUERY PARAMS 
  currentPage: number = 1;
  hasNext: boolean = false;
  hasPrevious: boolean = false;
  totalPages: number = 0;
  totalUsers: number = 0;
  isBanned: boolean = false;


  currentView: string = 'userlist';

  role: string = 'student';
  program: string = 'bsit';
  verified: string = 'all'
  limit: number = 10;
  searchTerm: string = '';
  userList: any[] = [];
  paginationData: any;
  Math = Math;
  basicData: any;

  reportStatsData: any;
  reportsList: any[] = [];
  currentReportsPage: number = 1;
  reportsLimit: number = 10;
  totalReports: number = 0;
  totalReportsPages: number = 0;
  hasReportsNext: boolean = false;
  hasReportsPrevious: boolean = false;

  reportStatus: string = 'all';
  reportSeverity: string = 'all';
  reportReason: string = 'all';

  showReviewModal: boolean = false;
  selectedReport: any = null;
  activeReviewTab: string = 'review';
  reviewData = {
    status: '',
    resolution: '',
    adminNotes: '',
    banDuration: ''
  };
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
    this.currentView = localStorage.getItem('currentView') as 'userlist' | 'reports';
    if (this.currentView === 'reports') {
      this.reportStats();
      this.getReportsList();
    } else {
      this.currentView = 'userlist';
      this.getList();
      this.getData();
    }
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
      ? this.api.searchAllUsers(this.role, this.limit, this.program, this.currentPage, this.searchTerm, this.verified, this.isBanned)
      : this.api.getAllUsers(this.role, this.limit, this.program, this.currentPage, this.verified, this.isBanned);

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
      },
      error: (error: any) => {
        console.error('Error fetching users', error);
        this.isLoadingUsers = false;
      }
    });
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
  trackByStudentId(index: number, student: any): any {
    return student._id;
  }

  setFilter(role: string) {
    this.isBanned = false;
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
  viewBanned() {
    this.isBanned = true;
    this.role = 'all';
    this.verified = 'all';
    this.program = 'all';
    this.currentPage = 1;
    this.getList();
  }

  toggleDropdown(studentId: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    this.userList.forEach(student => {
      if (student._id !== studentId) {
        student.showDropdown = false;
      }
    });

    const student = this.userList.find(s => s._id === studentId);
    if (student) {
      student.showDropdown = !student.showDropdown;
    }
  }

  onActionClick(action: string, studentId: any, event: Event) {
    event.stopPropagation();

    const student = this.userList.find(s => s._id === studentId);
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

  unbanUser(userData: any) {
    console.log('Unbanning user:', userData);

    Swal.fire({
      title: 'Unban User',
      text: `Are you sure you want to unban ${userData.name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, unban user',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.unbanUser(userData._id).subscribe({
          next: (resp: any) => {
            console.log('User unbanned successfully', resp.data);
            this.getList();
            this.getData();
            Swal.fire({
              title: 'User Unbanned!',
              text: `${userData.name} has been unbanned successfully`,
              icon: 'success',
              confirmButtonColor: '#059669'
            });
          },
          error: (error: any) => {
            console.error('Error unbanning user', error);
            Swal.fire({
              title: 'Error!',
              text: 'Failed to unban user. Please try again.',
              icon: 'error',
              confirmButtonColor: '#dc2626'
            });
          }
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  openResetPasswordModal(user: any) {
    this.selectedUser = user;
    this.newPassword = '';
    this.showResetPasswordModal = true;
  }

  closeResetPasswordModal() {
    this.showResetPasswordModal = false;
    this.selectedUser = null;
    this.newPassword = '';
    this.showPassword = false;
  }

  confirmResetPassword() {
    if (this.selectedUser && this.newPassword) {
      Swal.fire({
        title: 'Reset Password',
        text: `Are you sure you want to reset the password for ${this.selectedUser.name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, reset password',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          const data = {
            newPassword: this.newPassword
          };
          this.api.resetUserPassword(this.selectedUser._id, data).subscribe({
            next: (resp: any) => {
              Swal.fire({
                title: 'Password Reset!',
                text: `${this.selectedUser.name} password has been changed!`,
                icon: 'success',
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
                timer: 2000,
                timerProgressBar: true,
              });
              this.getList();
              this.closeResetPasswordModal();
            },
            error: (e: any) => {
              console.error('Error resetting password', e);
              Swal.fire({
                title: 'Error!',
                text: 'Failed to reset password. Please try again.',
                icon: 'error',
                confirmButtonColor: '#dc2626'
              });
            }
          });
        }
      });
    }
  }

  openBanUserModal(user: any) {
    this.selectedUser = user;
    this.selectedBanDuration = 60;
    this.banReason = 'Inappropriate behavior';
    this.showBanUserModal = true;
    // console.log('This is the selected user', this.selectedUser);
  }

  closeBanUserModal() {
    this.showBanUserModal = false;
    this.selectedUser = null;
    this.selectedBanDuration = 60;
    this.banReason = 'Inappropriate behavior';
  }

  confirmBanUser() {
    if (this.selectedUser && this.selectedBanDuration) {
      const durationText = this.getBanDurationText(this.selectedBanDuration);

      Swal.fire({
        title: 'Ban User',
        html: `Are you sure you want to ban <strong>${this.selectedUser.name}</strong> for <strong>${durationText}</strong>?<br><br>Reason: ${this.banReason}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, ban user',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          const data = {
            banDuration: this.selectedBanDuration,
            banReason: this.banReason
          };
          this.api.banUser(this.selectedUser._id, data).subscribe({
            next: (resp: any) => {
              console.log('User banned successfully', resp.data);
              Swal.fire({
                title: 'User Banned!',
                text: `${this.selectedUser.name} has been banned for ${durationText}`,
                icon: 'success',
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
                timer: 2000,
                timerProgressBar: true,
              });
              this.getList();
              this.getData();
              this.closeBanUserModal();
            },
            error: (error: any) => {
              console.error('Error banning user', error);
              Swal.fire({
                title: 'Error!',
                text: 'Failed to ban user. Please try again.',
                icon: 'error',
                confirmButtonColor: '#dc2626'
              });
            }
          });
        }
      });
    }
  }

  getBanDurationText(duration: number): string {
    switch (duration) {
      case 60: return '1 Hour';
      case 1440: return '1 Day';
      case 10080: return '7 Days';
      case 43200: return '1 Month';
      default: return `${duration} minutes`;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }



  reportStats() {
    this.api.reviewReportStats().subscribe({
      next: (resp: any) => {
        this.reportStatsData = resp.data;

      }, error: (error: any) => {
        console.error('Error fetching report stats', error);
      }
    })
  }
  toggleView() {
    this.currentView = this.currentView === 'userlist' ? 'reports' : 'userlist';
    localStorage.setItem('currentView', this.currentView);
    if (this.currentView === 'reports') {
      this.reportStats();
      this.getReportsList();
    }
  }

  changeTab(currentTab: string) {
    const tab = currentTab;
    switch (tab) {
      case 'all':
        this.reportStatus = 'all';
        this.reportSeverity = 'all';
        this.reportReason = 'all';
        this.currentReportsPage = 1;
        this.getReportsList();
        break;
      case 'pending':
        this.reportStatus = 'pending';
        this.reportSeverity = 'all';
        this.reportReason = 'all';
        this.currentReportsPage = 1;
        this.getReportsList();
        break;
      case 'resolved':
        this.reportStatus = 'resolved';
        this.currentReportsPage = 1;
        this.getReportsList();
        break;
      case 'high':
        this.reportSeverity = 'high';
        this.reportStatus = 'all';
        this.reportReason = 'all';
        this.currentReportsPage = 1;
        this.getReportsList();
        break;
    }
  }

  getReportsList() {
    this.isLoadingReports = true;

    const queryParams: any = {
      page: this.currentReportsPage,
      limit: this.reportsLimit
    };

    if (this.reportStatus !== 'all') {
      queryParams.status = this.reportStatus;
    }
    if (this.reportSeverity !== 'all') {
      queryParams.severity = this.reportSeverity;
    }
    if (this.reportReason !== 'all') {
      queryParams.reason = this.reportReason;
    }

    this.api.getStudentReports(queryParams).subscribe({
      next: (resp: any) => {
        // Map the backend response to match our component expectations
        this.reportsList = (resp.data.reports || []).map((report: any) => ({
          ...report,
          studentName: report.studentId?.name || 'Unknown Student',
          instructorName: report.instructorId?.name || 'Unknown Instructor',
          className: report.classCode || 'Unknown Class'
        }));

        const pagination = resp.data.pagination;
        this.currentReportsPage = pagination.page;
        this.totalReportsPages = pagination.pages;
        this.totalReports = pagination.total;
        this.hasReportsNext = pagination.page < pagination.pages;
        this.hasReportsPrevious = pagination.page > 1;
        this.isLoadingReports = false;
      },
      error: (error: any) => {
        console.error('Error fetching reports', error);
        this.isLoadingReports = false;
      }
    });
  }

  trackByReportId(index: number, report: any): string {
    return report._id;
  }


  openReviewModal(report: any) {
    this.selectedReport = report;
    this.showReviewModal = true;
    this.resetReviewForm();
  }

  closeReviewModal() {
    this.showReviewModal = false;
    this.selectedReport = null;
    this.resetReviewForm();
  }

  resetReviewForm() {
    this.reviewData = {
      status: '',
      resolution: '',
      adminNotes: '',
      banDuration: ''
    };
    this.activeReviewTab = 'review';
  }

  switchReviewTab(tab: string) {
    this.activeReviewTab = tab;
  }

  isReviewFormValid(): boolean {
    const isBasicValid = !!(this.reviewData.status && this.reviewData.resolution && this.reviewData.adminNotes);

    if (this.reviewData.resolution === 'student_banned') {
      return isBasicValid && !!this.reviewData.banDuration;
    }

    return isBasicValid;
  }

  submitReview() {
    if (!this.isReviewFormValid() || !this.selectedReport) {
      return;
    }

    const data = {
      adminId: this.userId,
      reportId: this.selectedReport._id,
      status: this.reviewData.status,
      adminNotes: this.reviewData.adminNotes,
      resolution: this.reviewData.resolution,
      ...(this.reviewData.resolution === 'student_banned' && { banDuration: parseInt(this.reviewData.banDuration) })
    };

    this.api.reviewReport(data).subscribe({
      next: (resp: any) => {
        Swal.fire({
          title: 'Success!',
          text: 'Report has been reviewed successfully',
          icon: 'success',
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
          timer: 2000,
          timerProgressBar: true
        });

        this.closeReviewModal();
        this.getReportsList();
        this.getData();
      },
      error: (error: any) => {
        console.error('Error reviewing report', error);
        Swal.fire({
          title: 'Error!',
          text: error.error?.message || 'Failed to review report. Please try again.',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      }
    });
  }



  // Reports pagination methods
  getReportsPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentReportsPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalReportsPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToReportsPage(page: number) {
    if (page >= 1 && page <= this.totalReportsPages) {
      this.currentReportsPage = page;
      this.getReportsList();
    }
  }

  previousReportsPage() {
    if (this.hasReportsPrevious) {
      this.currentReportsPage--;
      this.getReportsList();
    }
  }

  nextReportsPage() {
    if (this.hasReportsNext) {
      this.currentReportsPage++;
      this.getReportsList();
    }
  }

  // Reports filter methods
  onReportStatusChange(status: string) {
    this.reportStatus = status;
    this.currentReportsPage = 1;
    this.getReportsList();
  }

  onReportSeverityChange(severity: string) {
    this.reportSeverity = severity;
    this.currentReportsPage = 1;
    this.getReportsList();
  }

  onReportReasonChange(reason: string) {
    this.reportReason = reason;
    this.currentReportsPage = 1;
    this.getReportsList();
  }

}
