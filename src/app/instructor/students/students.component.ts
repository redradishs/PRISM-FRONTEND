import { Component, HostListener, ViewChild, OnInit } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { saveAs } from 'file-saver';
import * as ExcelJS from 'exceljs';


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

interface AssessmentResult {
  studentName: string;
  studentId: string;
  score: number;
  completionTime: string;
  completedAt: string;
  totalQuestions: number;
  correctAnswers: number;
}

interface ExportDataRow {
  'Student Name': string;
  'Student ID': string;
  'Assessment': string;
  'Score': number;
  'Completion Time': string;
  'Date Completed': string;
  'Total Questions': number;
  'Correct Answers': number;
}

interface ClassScoreResponse {
  remarks: string;
  message: string;
  data: {
    assessmentStatus: string;
    mode: string;
    results: Array<{
      id: string;
      name: string;
      block: string | null;
      score: number;
      status: string;
      violationCount: number;
    }>;
  };
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

  selectedAssessmentsForExport: any[] = [];
  showExportModal: boolean = false;

  private lastNamePrefixes = [
    'De', 'Del', 'Dela', 'De la', 'De los', 'San', 'Santa', 'Sta.'
  ];

  constructor(private api: ApiService, private auth: AuthService, private titleService: Title, private router: Router) {
    this.titleService.setTitle('PRISM | Students');

    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state as { selectedClassCode?: string };
      if (state.selectedClassCode) {
        this.initialClassCodeToSelect = state.selectedClassCode;
      }
    }

    if (localStorage.getItem('classCode')) {
      this.initialClassCodeToSelect = localStorage.getItem('classCode');
    } else {
      this.selectedClass = this.classes[0];
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

  setSelectedClass(selectedClass: any) {
    this.selectedClass = selectedClass;
    localStorage.setItem('classCode', selectedClass.classCode);
  }

  getClasses() {
    this.isLoading = true;
    this.api.ownedClasses(this.userId).subscribe({
      next: (resp: any) => {
        this.classes = resp.data;
        this.isLoading = false;

        if (this.classes && this.classes.length > 0) {
          if (this.initialClassCodeToSelect) {
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
    if (!this.selectedClass) {
      return;
    }

    this.currentPage = page;
    this.isLoading = true;
    this.api.studentList(this.userId, this.selectedClass.classCode, this.currentPage, this.itemsPerPage).subscribe({
      next: (resp: any) => {
        this.currentStudentsInfo = this.sortByLastName(resp.data.students);
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
    if (!this.selectedClass) {
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

  statsClass() {
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
    if (!this.searchTerm) {
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
        this.currentStudentsInfo = this.sortByLastName(resp.data.students || []);
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
    if (!this.assessmentSearchTerm) {
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

  onClassSelect() {
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

  goToResult(id: number) {
    this.router.navigate(['instructor/result'], {
      state: { assessmentId: id }
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
    if (student.completion.charAt(0) > 0) {
      this.router.navigate(['instructor/students/assessments'], {
        state: { studentId: student._id, classCode: this.selectedClass.classCode }
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

  getInitials(name: string) {
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
    if (!this.showAddStudentModal) {
      this.newStudentEmails = '';
      this.newStudentBlock = '';
    }
  }

  createClass() {
    if (!this.newClass.className || !this.newClass.classCode) {
      return;
    }

    const data = {
      instructor: this.userId,
      className: this.newClass.className,
      classCode: this.newClass.classCode,
      autoAdmission: this.newClass.autoAdmission,
      block: this.newClass.block,
      year: this.newClass.year,
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
    if (this.selectedAssessment?._id === assessment._id) {
      this.clearSelectedAssessment();
      return;
    }

    this.selectedAssessment = assessment;

    this.searchedAssessments = this.searchedAssessments.map(a => ({
      ...a,
      selected: a._id === assessment._id
    }));

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
    if (!this.selectedClass) {
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
          { studentId: student._id }
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

        this.api.assignAssessment(assignmentData).subscribe({
          next: (response) => {
            console.log('Assessment assigned successfully');
            Swal.fire({
              title: 'Success!',
              text: 'Assessment has been assigned to the class.',
              icon: 'success',
              confirmButtonColor: '#3b82f6'
            });

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

  removeStudent(student: any) {
    // console.log("This is the student", student);
    const data = {
      studentId: student._id,
      classCode: this.selectedClass.classCode
    }
    Swal.fire({
      title: 'Remove Student?',
      text: `Are you sure you want to remove "${student.name}" from this class?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#d1d5db',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.removeStudent(data).subscribe({
          next: (resp: any) => {
            this.getStudentList();
            this.statsClass();
            console.log('Student removed successfully');
            Swal.fire({
              title: `{student.name} Removed!`,
              text: 'Student has been removed from the class.',
              icon: 'success',
              confirmButtonColor: '#3b82f6',
              position: 'top-end',
              timer: 3000,
              toast: true
            })
          }, error: (error) => {
            console.error('Failed to remove student:', error);
            Swal.fire({
              title: 'Error!',
              text: 'Failed to remove student. Please try again.',
              icon: 'error',
              confirmButtonColor: '#3b82f6'
            });
          }
        })
      }
    })
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

    const startDate = new Date(this.assignmentDetails.startDate);
    startDate.setMinutes(startDate.getMinutes() + 5);
    return startDate.toISOString().slice(0, 16);
  }


  isFormValid(): boolean {
    if (!this.selectedAssessment) return false;
    if (!this.assignmentDetails.startDate || !this.assignmentDetails.dueDate || !this.assignmentDetails.timeLimit) return false;

    if (this.assignmentDetails.timeLimit <= 0) return false;

    const startDate = new Date(this.assignmentDetails.startDate);
    const dueDate = new Date(this.assignmentDetails.dueDate);
    const now = new Date();

    if (startDate < now) {
      this.dateError = "Start date cannot be in the past";
      return false;
    }

    if (dueDate <= startDate) {
      this.dateError = "Due date must be after start date";
      return false;
    }

    this.dateError = "";
    return true;
  }

  clearSelectedAssessment() {
    this.selectedAssessment = null;
    this.selectedDropdownAssessment = null;
  }

  onTabChange(tab: 'search' | 'dropdown') {
    this.activeTab = tab;
    this.clearSelectedAssessment();
    if (tab === 'dropdown') {
      this.assessmentSearchQuery = '';
      this.searchedAssessments = [];
    }
  }

  exportCompletedAssessments() {
    if (!this.selectedClass) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select a class first'
      });
      return;
    }

    this.showExportModal = true;
  }

  private getLastName(name: string): string {
    if (!name) return '';

    const nameParts = name.split(' ');
    if (nameParts.length <= 1) return name;

    // Check if the last part is a prefix
    let lastIndex = nameParts.length - 1;
    if (this.lastNamePrefixes.includes(nameParts[lastIndex])) {
      lastIndex--;
    }

    // Get the last name(s)
    const lastName = nameParts.slice(lastIndex).join(' ');
    return lastName;
  }

  private sortByLastName(students: any[]): any[] {
    return [...students].sort((a, b) => {
      const lastNameA = this.getLastName(a.name || '');
      const lastNameB = this.getLastName(b.name || '');
      return lastNameA.localeCompare(lastNameB);
    });
  }

  async exportSelectedAssessments() {
    try {
      if (this.selectedAssessmentsForExport.length === 0) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Please select at least one assessment to export'
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      for (let i = 0; i < this.selectedAssessmentsForExport.length; i++) {
        const assessment = this.selectedAssessmentsForExport[i];
        try {
          const response = await this.api.getClassScore(assessment._id).toPromise() as ClassScoreResponse;
          console.log("Response for assessment:", assessment.title, response);

          if (response?.data?.results && Array.isArray(response.data.results)) {
            const worksheet = workbook.addWorksheet(`A${i + 1} - ${assessment.title.substring(0, 20)}`);

            // Title Row
            worksheet.mergeCells('A1', 'F1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = `${assessment.title.toUpperCase()} - ASSESSMENT RESULTS`;
            titleCell.font = { size: 20, bold: true, color: { argb: '1F2937' } };
            titleCell.alignment = { horizontal: 'center' };
            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } };

            // Summary Section
            worksheet.addRow([]);
            worksheet.addRow(['Report Generated:', new Date().toLocaleDateString()]);
            worksheet.addRow(['Total Students:', response.data.results.length]);
            worksheet.addRow(['Completed Assessments:', response.data.results.filter(s => s.status === 'submitted').length]);
            worksheet.addRow(['Average Score:', `${(response.data.results.reduce((sum, s) => sum + (s.score || 0), 0) / response.data.results.length).toFixed(1)}`]);
            worksheet.addRow(['Highest Score:', `${Math.max(...response.data.results.map(s => s.score || 0))}`]);
            worksheet.addRow(['Assessment Status:', response.data.assessmentStatus.toUpperCase()]);
            const statusRow = worksheet.getRow(worksheet.rowCount);
            statusRow.getCell(2).font = { bold: true, color: { argb: '166534' } };
            statusRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
            statusRow.alignment = { horizontal: 'center' };

            // Mode row with styling
            const modeRow = worksheet.addRow(['Mode:', response.data.mode.toUpperCase()]);
            const modeCell = modeRow.getCell(2);
            modeCell.font = { bold: true };
            if (response.data.mode === 'mastery') {
              modeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
              modeCell.font.color = { argb: '166534' };
            } else {
              modeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF9C3' } };
              modeCell.font.color = { argb: '854D0E' };
            }
            worksheet.addRow([]);

            for (let i = 3; i <= 10; i++) {
              worksheet.getRow(i).alignment = { horizontal: 'center' };
            }

            // Header
            const header = ['#', 'Student Name', 'Score', 'Status', 'Violation Count', 'Performance'];
            const headerRow = worksheet.addRow(header);
            headerRow.eachCell(cell => {
              cell.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } };
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
              cell.alignment = { horizontal: 'center' };
            });

            const sortedStudents = this.sortByLastName(response.data.results);

            // Data Rows
            sortedStudents.forEach((student, index) => {
              const row = worksheet.addRow([
                index + 1,
                student.name || 'Unknown',
                student.score || 0,
                this.getStatusText(student.status),
                student.violationCount || 0,
                this.getPerformanceCategory(student.score || 0)
              ]);

              const score = student.score || 0;
              let style = { fontColor: '000000', bgColor: 'FFFFFF' };
              if (score >= 90) {
                style = { fontColor: '166534', bgColor: 'DCFCE7' };
              } else if (score >= 75) {
                style = { fontColor: '854D0E', bgColor: 'FEF9C3' };
              } else {
                style = { fontColor: '991B1B', bgColor: 'FEE2E2' };
              }

              // Apply style to score column (3rd)
              row.getCell(3).font = {
                bold: true,
                size: 11,
                color: { argb: style.fontColor }
              };
              row.getCell(3).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: style.bgColor }
              };

              // Apply alignments to all cells
              row.eachCell(cell => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
              });

              // Left align name
              row.getCell(2).alignment = { horizontal: 'left' };
            });

            // Set fixed widths for specific columns
            worksheet.getColumn(1).width = 22;  // #
            worksheet.getColumn(2).width = 30; // Student Name
            worksheet.getColumn(3).width = 12; // Score
            worksheet.getColumn(4).width = 14; // Status
            worksheet.getColumn(5).width = 15; // Violation Count
            worksheet.getColumn(6).width = 22; // Performance
          } else {
            console.warn('Unexpected response format for assessment:', assessment.title, response);
          }
        } catch (error) {
          console.error('Error processing assessment:', assessment.title, error);
        }
      }
      //generate the file name
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileName = `${this.selectedClass.className}_Assessment_Results_${new Date().toISOString().split('T')[0]}.xlsx`;

      saveAs(blob, fileName);

      this.showExportModal = false;
      this.selectedAssessmentsForExport = [];

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Assessment results exported successfully!'
      });
    } catch (error) {
      console.error('Export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to export assessment results'
      });
    }
  }

  private getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'completed': 'Completed',
      'in_progress': 'In Progress',
      'not_started': 'Not Started',
      'submitted': 'Submitted'
    };
    return statusMap[status] || status;
  }

  private getPerformanceCategory(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Satisfactory';
    return 'Needs Improvement';
  }

  toggleAssessmentSelection(assessment: any) {
    const index = this.selectedAssessmentsForExport.findIndex(a => a._id === assessment._id);
    if (index === -1) {
      this.selectedAssessmentsForExport.push(assessment);
    } else {
      this.selectedAssessmentsForExport.splice(index, 1);
    }
  }

  isAssessmentSelected(assessment: any): boolean {
    return this.selectedAssessmentsForExport.some(a => a._id === assessment._id);
  }
}