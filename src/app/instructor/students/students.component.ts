import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

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
export class StudentsComponent {
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
  currentPage: number = 1;
  itemsPerPage: number = 5;
  selectedCourse: string = 'networking';
  classes: any[] = [];
  selectedClass: any;
  isLoading: boolean = false;
  error: string | null = null;
  admittedCount: number = 0;
  pendingCount: number = 0;

  currentStudentsInfo: StudentInfo[] = [];
  filteredStudents: StudentInfo[] = [];

  showPendingModal = false;
  pendingRequests: PendingRequest[] = [
    {
      id: '1',
      studentName: 'John Doe',
      email: 'john.doe@example.com',
      requestDate: new Date('2024-03-20')
    },
    {
      id: '2',
      studentName: 'Jane Smith',
      email: 'jane.smith@example.com',
      requestDate: new Date('2024-03-19')
    }
  ];

  autoAdmission = false;

  constructor(private api: ApiService, private auth: AuthService) {

  }
  

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe((user) => {
      if (user) {
        this.userId = user.id;
        this.loadClassDetails(this.userId);
        
      }
    })
    
  }

  loadClassDetails(id: string) {
    this.isLoading = true;
    this.error = null;

    this.api.getAllDetails(this.userId).subscribe({
      next: (resp: any) => {
        this.classes = resp.data;
        if(this.classes.length > 0) {
          this.selectedClass = this.classes[0];
          this.updateDisplayedData(this.selectedClass);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load class details';
        this.isLoading = false;
      }
    })
  }


  updateDisplayedData(classData: ClassDetails) {
    this.admittedCount = classData.stats.totalAdmitted;
    this.pendingCount = classData.stats.totalPending;
    this.currentStudentsInfo = classData.admitted;
    this.filteredStudents = classData.admitted;
  
  this.pendingRequests = classData.pending.map(student => ({
    id: student._id,
    studentName: student.name,
    email: student.email
  }));
  
    this.searchTerm = '';


  }

  onClassSelect() {
    console.log('Selected class:', this.selectedClass);
    if(this.selectedClass) {
      this.updateDisplayedData(this.selectedClass);
    }
  }
  
  


  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  filterStudents() {
    if (!this.searchTerm.trim()) {
      this.filteredStudents = this.currentStudentsInfo;
    } else {
      this.filteredStudents = this.currentStudentsInfo.filter(student => 
        student.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    this.currentPage = 1;
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value;
    this.filterStudents();
  }

  get currentStudents() {
    return this.filteredStudents.slice(
      (this.currentPage - 1) * this.itemsPerPage,
      this.currentPage * this.itemsPerPage
    );
  }

  get totalPages() {
    return Math.ceil(this.filteredStudents.length / this.itemsPerPage);
  }

  previousPage() {
    this.currentPage = Math.max(1, this.currentPage - 1);
  }

  nextPage() {
    this.currentPage = Math.min(this.totalPages, this.currentPage + 1);
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

  toggleAutoAdmission() {
    console.log('Auto admission:', this.autoAdmission);
  }

}
