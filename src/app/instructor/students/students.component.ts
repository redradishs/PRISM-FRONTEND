import { Component, HostListener, ViewChild, OnInit } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

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
  username: string = '';
  userId: string = '';
  profile: string = '';
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
  performanceOverall: number = 0;

  showPendingModal = false;
  autoAdmission = false;
  allowJoining = false;

  showCreateClassModal = false;
  showAddStudentModal = false;
  newClass = {
    className: '',
    classCode: '',
    autoAdmission: false,
    description: '',
    year: '',
    block: '',
    allowJoining: true
  };

  showAssignAssessmentModal = false;
  assessmentSearchQuery = '';
  searchedAssessments: any[] = [];
  selectedAssessment: any = null;
  assignmentDetails = {
    startDate: '',
    dueDate: '',
    timeLimit: 60, // default 60 minutes
    instructions: '',
    randomizeQuestions: false,
    showResults: false
  };

  searchedStudents: any[] = [];
  selectedStudents: any[] = [];
  isSearchLoading: boolean = false;
  isAddingStudents: boolean = false;
  studentSearchQuery = '';
  newStudentEmails = '';
  newStudentBlock = '';
  showSelectedStudents: boolean = false;
  addingProgressText: string = '';

  showClassSettingsModal: boolean = false;

  activeTab: 'dropdown' | 'search' = 'search';
  ownAssessments: any[] = [];
  selectedDropdownAssessment: any = null;

  dateError: string = "";

  initialClassCodeToSelect: string | null = null;

  constructor(private api: ApiService, private auth: AuthService, private titleService: Title, private router: Router) {
    this.titleService.setTitle('PRISM | Students');
    
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state as { selectedClassCode?: string };
      if (state.selectedClassCode) {
        // Store the class code to select after classes are loaded
        this.initialClassCodeToSelect = state.selectedClassCode;
      }
    }
  }
  

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe((user) => {
      if (user) {
        this.userId = user.id;
        this.username = user.name;
        this.profile = user.profilePicture;
        this.getClasses();
      }
    });
    this.loadOwnAssessments();
  }

  getClasses(){
    this.isLoading = true;
    this.api.ownedClasses(this.userId).subscribe({
      next: (resp: any) => {
        this.classes = resp.data;
        this.isLoading = false;
        
        if (this.classes && this.classes.length > 0) {
          if (this.initialClassCodeToSelect) {
            // Find and select the class with the matching code
            const classToSelect = this.classes.find(c => c.classCode === this.initialClassCodeToSelect);
            if (classToSelect) {
              this.selectedClass = classToSelect;
            } else {
              this.selectedClass = this.classes[0];
            }
          } else {
            this.selectedClass = this.classes[0];
          }
          this.onClassSelect();
        }
      },
      error: (err) => {
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
        this.pendingRequests = resp.data.pendingStudents;
        this.performanceOverall = resp.data.overallPerformance;
        this.allowJoining = resp.data.allowJoining;
        this.autoAdmission = resp.data.autoAdmission;
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
      studentId: student._id,
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

  studentInfo(student: any) {
    if(student.completion.charAt(0) > 0){
      this.router.navigate(['instructor/students/assessments'], {
        state: {studentId: student._id, classCode: this.selectedClass.classCode}
      });
    } else {
      Swal.fire({
        title: 'No Submission',
        text: `${student.name} hasn\'t taken any assessment yet.`,
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

  toggleCreateClassModal() {
    this.showCreateClassModal = !this.showCreateClassModal;
    // Reset form when closing
    if (!this.showCreateClassModal) {
      this.newClass = {
        className: '',
        classCode: '',
        autoAdmission: false,
        description: '',
        year: '',
        block: '',
        allowJoining: true
      };
    }
  }

  toggleAddStudentModal() {
    this.showAddStudentModal = !this.showAddStudentModal;
    // Reset form when closing
    if (!this.showAddStudentModal) {
      this.newStudentEmails = '';
      this.newStudentBlock = '';
    }
  }

  // Fixed createClass() to include all properties
  createClass() {
    if (!this.newClass.className || !this.newClass.classCode) {
      return;
    }
    
    const data = {
      instructor: this.userId,
      className: this.newClass.className,
      classCode: this.newClass.classCode,
      autoAdmission: this.newClass.autoAdmission,
      description: this.newClass.description
    };

    this.isLoading = true;
    this.api.createClass(data).subscribe({
      next: (resp: any) => {
        this.getClasses(); 
        this.toggleCreateClassModal();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.isLoading = false;
      }
    });
  }

  // Completed addStudents() implementation
  addStudents() {
    if (!this.newStudentEmails || !this.selectedClass) {
      return;
    }

    const emails = this.newStudentEmails
      .split(/[\n,]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (emails.length === 0) {
      return;
    }

    this.isSearchLoading = true;
    
    const data = {
      instructorId: this.userId,
      classCode: this.selectedClass.classCode,
      emails: emails,
      block: this.newStudentBlock || null
    };
    
    this.api.addStudent(this.userId, this.selectedClass.classCode, data).subscribe({
      next: (resp: any) => {
        this.getStudentList();
        this.toggleAddStudentModal();
        this.isSearchLoading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.isSearchLoading = false;
      }
    });
  }

  clearSearch() {
    this.studentSearchQuery = '';
    this.searchedStudents = [];
  }
  
  clearAllSelections() {
    this.selectedStudents = [];
  }
  

  toggleAssignAssessmentModal() {
    this.showAssignAssessmentModal = !this.showAssignAssessmentModal;
    if (!this.showAssignAssessmentModal) {
      this.resetAssignAssessmentModal();
    } else {
      this.loadOwnAssessments();
    }
  }

  resetAssignAssessmentModal() {
    this.activeTab = 'dropdown';
    this.selectedAssessment = null;
    this.selectedDropdownAssessment = null;
    this.assessmentSearchQuery = '';
    this.searchedAssessments = [];
    this.assignmentDetails = {
      startDate: '',
      dueDate: '',
      timeLimit: 60,
      instructions: '',
      randomizeQuestions: false,
      showResults: false
    };
  }

  loadOwnAssessments() {
    if (!this.userId) return;
    
    this.api.getOwnAssessment(this.userId).subscribe({
      next: (data: any) => {
        this.ownAssessments = data.data;
      },
      error: (err) => {
        console.error('Error fetching assessments for dropdown:', err);
      }
    });
  }

  onAssessmentDropdownChange() {
    if (this.selectedDropdownAssessment) {
      this.selectedAssessment = this.selectedDropdownAssessment;
      this.setupDefaultScheduleSettings();
    }
  }

  searchAssessments() {
    if (!this.assessmentSearchQuery || this.assessmentSearchQuery.length < 3) {
      this.searchedAssessments = [];
      return;
    }
    
    this.api.searchAssessmentUser(
      this.userId, 
      this.assessmentSearchQuery
    ).subscribe({
      next: (resp: any) => {
        this.searchedAssessments = resp.data.assessments.map((assessment: any) => ({
          ...assessment,
          selected: this.selectedAssessment?._id === assessment._id
        }));
      },
      error: (err) => {
        console.error('Error searching assessments:', err);
      }
    });
  }

  selectAssessment(assessment: any) {
    // If clicking the same assessment, deselect it
    if (this.selectedAssessment?._id === assessment._id) {
      this.clearSelectedAssessment();
      return;
    }
    
    this.selectedAssessment = assessment;
    
    // Update selection state in search results
    this.searchedAssessments = this.searchedAssessments.map(a => ({
      ...a,
      selected: a._id === assessment._id
    }));
    
    // Find the exact matching assessment by ID in dropdown list
    this.selectedDropdownAssessment = this.ownAssessments.find(
      a => a._id === assessment._id
    ) || null;
    
    this.setupDefaultScheduleSettings();
  }

  clearAssessmentSearch() {
    this.assessmentSearchQuery = '';
    this.searchedAssessments = [];
  }

  setupDefaultScheduleSettings() {
    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    
    this.assignmentDetails.startDate = this.formatDateForInput(now);
    this.assignmentDetails.dueDate = this.formatDateForInput(dueDate);
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().slice(0, 16);
  }

  searchStudentsForAdding() {
    if(!this.selectedClass){
      this.searchedStudents = [];
      return;
    }
    if (!this.studentSearchQuery || this.studentSearchQuery.length < 2) {
      this.searchedStudents = [];
      return;
    }
    
    this.isLoading = true;
    this.api.searchStudentsAdd(this.userId, this.selectedClass.classCode, this.studentSearchQuery).subscribe({
      next: (resp: any) => {
        this.searchedStudents = resp.data.students || [];
        console.log(this.searchedStudents);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.isLoading = false;
      }
    });
  }

  isStudentSelected(student: any) {
    return this.selectedStudents.some(s => s._id === student._id);
  }

  toggleStudentSelection(student: any) {
    if (this.isStudentSelected(student)) {
      this.removeSelectedStudent(student);
    } else {
      this.selectedStudents.push(student);
    }
  }

  removeSelectedStudent(student: any) {
    this.selectedStudents = this.selectedStudents.filter(s => s._id !== student._id);
  }

  async addSelectedStudents() {
    if (this.selectedStudents.length === 0) return;
    
    this.isAddingStudents = true;
    let successCount = 0;
    let failCount = 0;
    const studentsToAdd = [...this.selectedStudents];
    this.selectedStudents = [];
    for (const student of studentsToAdd) {
      try {
        this.addingProgressText = `Adding ${successCount + 1} of ${studentsToAdd.length}...`;
        
        await this.api.addStudent(
          this.userId, 
          this.selectedClass.classCode,
          {studentId: student._id}
        ).toPromise();
        successCount++;
      } catch (error) {
        console.error(`Failed to add student ${student.name}:`, error);
        failCount++;
      }
    }
    this.isAddingStudents = false;
    if (successCount > 0) {
      console.log(`Successfully added ${successCount} student(s) to class`);
    }
    if (failCount > 0) {
      console.error(`Failed to add ${failCount} student(s)`);
    }
    if (successCount > 0) {
      this.getStudentList();
    }
    if (failCount === 0) {
      this.toggleAddStudentModal();
    }
  }

  getTotalQuestions(types: any): number {
    return 0
  }

  formatQuestionTypes(types: any): string {
    if (!types) return 'Unknown';
    
    const typeKeys = Object.keys(types);
    
    if (typeKeys.length === 0) return 'Unknown';
    if (typeKeys.length === 1) {
      const typeName = this.formatTypeName(typeKeys[0]);
      return `${typeName} (${types[typeKeys[0]]})`;
    }
    
    const totalQuestions = this.getTotalQuestions(types);
    return `Mixed (${totalQuestions})`;
  }

  formatTypeName(type: string): string {
    if (!type) return 'Unknown';
    
    return type
      .replace(/-|_/g, ' ')
      .replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  toggleClassSettingsModal() {
    this.showClassSettingsModal = !this.showClassSettingsModal;
  }

  saveClassSettings() {
    Swal.fire({
      title: 'Save Changes?',
      text: "Do you want to save changes to class settings?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#d1d5db',
      confirmButtonText: 'Yes, save changes',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const data = {
          instructorId: this.userId,
          autoAdmission: this.autoAdmission,
          allowJoining: this.allowJoining,
          className: this.selectedClass.className,
        }
        this.api.classSettings(
          this.selectedClass.classCode,
          data
        ).subscribe({
          next: (response) => {
            console.log('Class settings updated successfully');
            this.toggleClassSettingsModal();
            Swal.fire({
              title: 'Settings Saved!',
              text: 'Class settings have been updated successfully.',
              icon: 'success',
              confirmButtonColor: '#3b82f6'
            });
          },
          error: (error) => {
            console.error('Failed to update class settings', error);
            Swal.fire({
              title: 'Error!',
              text: 'Failed to update class settings. Please try again.',
              icon: 'error',
              confirmButtonColor: '#3b82f6'
            });
          }
        });
      }
    });
  }

  assignAssessment() {
    if (!this.isFormValid()) return;
    Swal.fire({
      title: 'Assign Assessment?',
      text: `Are you sure you want to assign "${this.selectedAssessment.title}" to this class?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#d1d5db',
      confirmButtonText: 'Yes, assign it',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const assignmentData = {
          assessmentId: this.selectedAssessment._id,
          classCodes: this.selectedClass?.classCode,
          createdBy: this.userId,
          startDate: new Date(this.assignmentDetails.startDate).toISOString(),
          dueDate: new Date(this.assignmentDetails.dueDate).toISOString(),
          timeLimit: this.assignmentDetails.timeLimit,
          instructions: this.assignmentDetails.instructions,
          // randomizeQuestions: this.assignmentDetails.randomizeQuestions,
          // showResults: this.assignmentDetails.showResults
        };
        
        // Call API to assign assessment
        this.api.assignAssessment(assignmentData).subscribe({
          next: (response) => {
            console.log('Assessment assigned successfully');
            
            // Show success message
            Swal.fire({
              title: 'Success!',
              text: 'Assessment has been assigned to the class.',
              icon: 'success',
              confirmButtonColor: '#3b82f6'
            });
            
            // Close modal and refresh assessment list
            this.toggleAssignAssessmentModal();
            this.getAssignedAssessments();
          },
          error: (error) => {
            console.error('Failed to assign assessment:', error);
            Swal.fire({
              title: 'Error!',
              text: 'Failed to assign assessment. Please try again.',
              icon: 'error',
              confirmButtonColor: '#3b82f6'
            });
          }
        });
      }
    });
  }

  getCurrentDateTimeString(): string {
    const now = new Date();
    now.setSeconds(0); 
    now.setMilliseconds(0); 
    return now.toISOString().slice(0, 16); 
  }

  getMinDueDateString(): string {
    if (!this.assignmentDetails.startDate) {
      return this.getCurrentDateTimeString();
    }
    
    // Use start date as minimum for due date
    const startDate = new Date(this.assignmentDetails.startDate);
    // Add at least 5 minutes to start date
    startDate.setMinutes(startDate.getMinutes() + 5);
    return startDate.toISOString().slice(0, 16);
  }

  
  isFormValid(): boolean {
    if (!this.selectedAssessment) return false;
    if (!this.assignmentDetails.startDate || !this.assignmentDetails.dueDate || !this.assignmentDetails.timeLimit) return false;
    
    // Validate time limit is positive
    if (this.assignmentDetails.timeLimit <= 0) return false;
    
    // Convert dates to compare
    const startDate = new Date(this.assignmentDetails.startDate);
    const dueDate = new Date(this.assignmentDetails.dueDate);
    const now = new Date();
    
    // Check if start date is not in the past
    if (startDate < now) {
      this.dateError = "Start date cannot be in the past";
      return false;
    }
    
    // Check if due date is after start date
    if (dueDate <= startDate) {
      this.dateError = "Due date must be after start date";
      return false;
    }
    
    // Clear error if validation passes
    this.dateError = "";
    return true;
  }

  // Clear selected assessment
  clearSelectedAssessment() {
    this.selectedAssessment = null;
    this.selectedDropdownAssessment = null;
  }

  onTabChange(tab: 'search' | 'dropdown') {
    this.activeTab = tab;
    // Clear selections when switching tabs
    this.clearSelectedAssessment();
    // Clear search results when switching to dropdown
    if (tab === 'dropdown') {
      this.assessmentSearchQuery = '';
      this.searchedAssessments = [];
    }
  }
  
}