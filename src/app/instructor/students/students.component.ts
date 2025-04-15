import { Component, HostListener, ViewChild, OnInit } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

interface Student {
  name: string;
  studentId: string;
  block: string;
  accuracy: number;
}

interface StudentInfo {
  name: string;
  email: string;
  block: string;
  accuracy: number;
  completion: string;
  performance: string;
}

interface ClassDetails {
  stats: {
    totalAdmitted: number;
    totalPending: number;
  };
  admitted: StudentInfo[];
  pending: {
    _id: string;
    name: string;
    email: string;
  }[];
}

export interface PendingRequest {
  id: string;
  studentName: string;
  email: string;
  requestDate?: Date;
}

@Component({
  selector: 'app-students',
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './students.component.html',
  styleUrl: './students.component.css'
})
export class StudentsComponent implements OnInit {
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

  userId: string = '';
  searchTerm: string = '';
  assessmentSearchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 20;
  currentPage2: number = 1;
  itemsPerPage2: number = 5;
  selectedCourse: string = 'networking';
  classes: any[] = [];
  selectedClass: any;
  isLoading: boolean = false;
  error: string | null = null;
  admittedCount: number = 0;
  pendingCount: number = 0;

  private searchTimeout: any;
  private readonly DEBOUNCE_TIME = 300;
  currentStudentsInfo: any[] = [];
  filteredStudents: any[] = [];
  assignedAssessments: any[] = [];
  pendingRequests: any[] = [];
  totalStudents: number = 0;
  totalPages: number = 0;
  totalAssessments: number = 0;
  totalPages2: number = 0;

  showPendingModal = false;
  autoAdmission = false;

  constructor(private api: ApiService, private auth: AuthService, private titleService: Title, private router: Router) {
    this.titleService.setTitle('PRISM | Students');
  }
  

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe((user) => {
      if (user) {
        this.userId = user.id;
        this.getClasses();

        
      }
    })
    
  }

  getClasses(){
    this.isLoading = true;
    this.api.ownedClasses(this.userId).subscribe({
      next: (resp: any) => {
        this.classes = resp.data;
        this.isLoading = false;
        if(this.classes && this.classes.length > 0){
          this.selectedClass = this.classes[0];
          this.onClassSelect();
        }
      }, error: (err) => {
        this.error = err.message;
        this.isLoading = false;
      }
    })
  }

  getStudentList(page: number = 1) {
    if(!this.selectedClass){
      return;
    }

    this.currentPage = page;
    this.isLoading = true;
    this.api.studentList(this.userId, this.selectedClass.classCode, this.currentPage, this.itemsPerPage).subscribe({
      next: (resp: any) => {
        this.currentStudentsInfo = resp.data.students;
        this.filteredStudents = this.currentStudentsInfo;
        this.totalStudents = resp.data.totalItems;
        this.totalPages = resp.data.totalPages;
        this.isLoading = false;

        this.totalStudents = resp.data.totalItems;
        this.totalPages = resp.data.totalPages;
      }, error: (err) => {
        this.error = err.message;
        this.isLoading = false;
      }
    })
  }

  getAssignedAssessments(page: number = 1) {
    if(!this.selectedClass){
      return;
    }
    this.currentPage2 = page;
    this.isLoading = true;
    this.api.assignedAssessments(this.userId, this.selectedClass.classCode, this.currentPage2, this.itemsPerPage2).subscribe({
      next: (resp: any) => {
        this.assignedAssessments = resp.data.assessments;
        this.totalPages2 = resp.data.pagination.totalPages;
        this.totalAssessments = resp.data.pagination.totalItems;
        this.isLoading = false;
      }, error: (err) => {
        this.error = err.message;
        this.isLoading = false;
      }
    })
  }

  statsClass(){
    this.api.statsClass(this.userId, this.selectedClass.classCode).subscribe({
      next: (resp: any) => {
        this.admittedCount = resp.data.stats.admitted;
        this.pendingCount = resp.data.stats.pending;
        this.pendingRequests = resp.data.pendingRequests;
      }, error: (err) => {
        console.log(err);
      }
    })
  }

  searchStudent() {
    if (!this.selectedClass) {
      return;
    }
    if(!this.searchTerm){
      return this.getStudentList();
    }
    
    this.currentPage = 1;
    this.isLoading = true;
    
    this.api.searchStudents(
      this.userId, 
      this.selectedClass.classCode, 
      this.searchTerm,
      this.currentPage,
      this.itemsPerPage
    ).subscribe({
      next: (resp: any) => {
        this.currentStudentsInfo = resp.data.students || [];
        this.filteredStudents = this.currentStudentsInfo;
        this.totalStudents = resp.data.totalItems || 0;
        this.totalPages = resp.data.totalPages;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.isLoading = false;
      }
    });
  }

  searchAssessment() {
    if (!this.selectedClass) {
      return;
    }
    if(!this.assessmentSearchTerm){
      return this.getAssignedAssessments();
    }
    
    this.currentPage2 = 1;
    this.isLoading = true;
    
    this.api.searchAssessment(
      this.userId, 
      this.selectedClass.classCode, 
      this.assessmentSearchTerm,
      this.currentPage2,
      this.itemsPerPage2
    ).subscribe({
      next: (resp: any) => {
        this.assignedAssessments = resp.data.assessments || [];
        this.totalAssessments = resp.data.pagination.totalItems;
        this.totalPages2 = resp.data.pagination.totalPages || 0;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.isLoading = false;
      }
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  onClassSelect(){
    this.currentPage = 1;
    this.currentPage2 = 1;

    this.getStudentList();
    this.getAssignedAssessments();
    this.statsClass();
  }


  togglePendingModal() {
    this.showPendingModal = !this.showPendingModal;
  }

  approveRequest(student: any) {
    console.log(student);
    const data = {
      instructorId: this.userId,
      studentId: student.id,
      classCode: this.selectedClass.classCode,
      action: 'accept'
    }
    this.api.approve(data).subscribe({
      next: (resp: any) => {
        console.log(resp);
        this.pendingRequests = this.pendingRequests.filter(req => req.id !== student.id);
        this.updateDisplayedData(this.selectedClass);
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

  rejectRequest(student: any) {
    console.log(student);
    const data = {
      instructorId: this.userId,
      studentId: student.id,
      classCode: this.selectedClass.classCode,
      action: 'decline'
    }
    this.api.approve(data).subscribe({
      next: (resp: any) => {
        console.log(resp);
        this.pendingRequests = this.pendingRequests.filter(req => req.id !== student.id);
        this.updateDisplayedData(this.selectedClass);
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

  goToResult(id: number){
    this.router.navigate(['instructor/result'],{
      state: {assessmentId: id}
    })
  }

  onSearchInputChange(searchType: 'student' | 'assessment') {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      if (searchType === 'student') {
        this.searchStudent();
      } else {
        this.searchAssessment();
      }
    }, this.DEBOUNCE_TIME);
  }



  updateDisplayedData(selectedClass: any) {
    if (!selectedClass) return;
    
    this.selectedClass = selectedClass;
    this.getStudentList();
    this.getAssignedAssessments();
    this.statsClass();
  }

  toggleAutoAdmission() {
    console.log('Auto admission:', this.autoAdmission);
  }

  getCompletionPercentage(completion: string): number {
    if (!completion) return 0;
    
    try {
      const [completed, total] = completion.split('/').map(Number);
      if (isNaN(completed) || isNaN(total) || total === 0) return 0;
      return (completed / total) * 100;
    } catch (error) {
      console.error('Error parsing completion string:', error);
      return 0;
    }
  }

  isFullyCompleted(completion: string): boolean {
    if (!completion) return false;
    
    try {
      const [completed, total] = completion.split('/').map(Number);
      return completed === total;
    } catch (error) {
      return false;
    }
  }

  getInitials(name: string){
    const names = name.split(' ');
    return names[0][0] + names[names.length - 1][0];
  }

  getStatusClass(status: string): string {
    if (!status) return 'status-unknown';
    
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus === 'completed') {
      return 'status-completed';
    } else if (normalizedStatus === 'ongoing') {
      return 'status-ongoing';
    } else if (normalizedStatus === 'scheduled') {
      return 'status-scheduled';
    }
    
    return 'status-unknown';
  }

}
