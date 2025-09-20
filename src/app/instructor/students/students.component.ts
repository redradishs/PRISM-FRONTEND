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
import * as QRCode from 'qrcode';


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
    totalItems: number,
    startDate: Date,
    endDate: Date,
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
  isThereClasses: boolean = true;

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
    autoAdmission: true,
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
    timeLimit: 60,
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

  startDatePresets = [
    {
      label: 'Now',
      startDate: new Date(),
      dueDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
    },
    {
      label: 'Tomorrow',
      startDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      dueDate: new Date(new Date().getTime() + 48 * 60 * 60 * 1000)
    },
    {
      label: 'Next Week',
      startDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000)
    }
  ];

  dueDatePresets = [
    { label: '1hr', hoursToAdd: 1 },
    { label: '24hrs', hoursToAdd: 24 },
    { label: '1 week', hoursToAdd: 24 * 7 }
  ];

  initialClassCodeToSelect: string | null = null;

  selectedAssessmentsForExport: any[] = [];
  showExportModal: boolean = false;
  showJoiningCodeModal: boolean = false;
  qrCodeDataUrl: string = '';

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
  }

  setSelectedClass(selectedClass: any) {
    this.selectedClass = selectedClass;
    localStorage.setItem('classCode', selectedClass.classCode);
  }

  getClasses() {
    this.isLoading = true;
    this.api.ownedClasses(this.userId).subscribe({
      next: (resp: any) => {
        this.classes = resp.data || [];
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
        } else {
          this.selectedClass = null;
          this.isThereClasses = false;
          this.handleEmptyClass();
        }
      },
      error: (err) => {
        this.error = err.message;
        this.isLoading = false;
        this.classes = [];
        this.selectedClass = null;
      }
    })
  }

  // private handleEmptyClass() {
  //   Swal.fire({
  //     title: 'No classes found',
  //     text: 'You haven\'t created any classes yet. Would you like to create your first class?',
  //     icon: 'info',
  //     showCancelButton: true,
  //     confirmButtonText: 'Create class',
  //     cancelButtonText: 'Later'
  //   }).then((result) => {
  //     if (result.isConfirmed) {
  //       this.toggleCreateClassModal();
  //     }
  //   })
  // }

  private handleEmptyClass() {
    Swal.fire({
      title: 'No Classes Found',
      icon: 'info',
      showConfirmButton: false,
      toast: true,
      timer: 2000,
      position: 'top-end',
      timerProgressBar: true
    })
  }

  getStudentList(page: number = 1) {
    if (!this.selectedClass) {
      console.log('No available classes')
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
        autoAdmission: true,
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
        this.isThereClasses = true;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.isLoading = false;
      }
    });
  }

  generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.newClass.classCode = result;
  }

  isClassCodeInvalid(): boolean {
    return !this.newClass.classCode || this.newClass.classCode.length !== 6;
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

  copyClassCode() {
    if (this.selectedClass?.classCode) {
      navigator.clipboard.writeText(this.selectedClass.classCode).then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Copied!',
          text: 'Class code copied to clipboard',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = this.selectedClass.classCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        Swal.fire({
          icon: 'success',
          title: 'Copied!',
          text: 'Class code copied to clipboard',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      });
    }
  }

  async showJoiningCodeDetails() {
    if (this.selectedClass?.classCode) {
      this.showJoiningCodeModal = true;
      await this.generateQRCode();
    }
  }

  toggleJoiningCodeModal() {
    this.showJoiningCodeModal = !this.showJoiningCodeModal;
    if (!this.showJoiningCodeModal) {
      this.qrCodeDataUrl = '';
    }
  }

  async generateQRCode() {
    try {
      if (this.selectedClass?.classCode) {
        const joiningLink = `${window.location.origin}/join/class/${this.selectedClass.classCode}`;

        this.qrCodeDataUrl = await QRCode.toDataURL(joiningLink, {
          width: 256,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        });
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }

  copyJoiningLink() {
    if (this.selectedClass?.classCode) {
      const joiningLink = `${window.location.origin}/join/class/${this.selectedClass.classCode}`;
      navigator.clipboard.writeText(joiningLink).then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Link Copied!',
          text: 'Joining link copied to clipboard',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      });
    }
  }

  getJoiningLink(): string {
    if (this.selectedClass?.classCode) {
      return `${window.location.origin}/join/class/${this.selectedClass.classCode}`;
    }
    return '';
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

  archiveClass() {
    const data = {
      instructorId: this.userId,
    }
    Swal.fire({
      title: 'Archive Class?',
      text: `Are you sure you want to archive "${this.selectedClass.className}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#d1d5db',
      confirmButtonText: 'Yes, archive',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.archiveClass(this.selectedClass.classCode, data).subscribe({
          next: (resp: any) => {
            Swal.fire({
              title: 'Class Archived!',
              text: 'Class has been archived successfully.',
              icon: 'success',
              showConfirmButton: false,
              toast: true,
              position: 'top-end',
              timer: 2000,
              timerProgressBar: true,
            })
            this.getClasses();
          }, error: (error) => {
            console.error('Failed to archive class:', error);
            Swal.fire({
              title: 'Error!',
              text: 'Failed to archive class. Please try again.',
              icon: 'error',
              confirmButtonColor: '#3b82f6'
            });
          }
        })
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

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private formatPhilippineDate(date: Date): string {
    const phDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Manila" }));

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Manila',
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };

    return phDate.toLocaleString('en-US', options);
  }


  getCurrentDateTimeString(): string {
    return this.formatDate(new Date());
  }

  getMinDueDateString(): string {
    if (this.assignmentDetails.startDate) {
      const start = new Date(this.assignmentDetails.startDate);
      start.setMinutes(start.getMinutes() + 10);
      return this.formatDate(start);
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 1);
      return this.formatDate(now);
    }
  }

  validateDates(): string | null {
    if (this.assignmentDetails.startDate && this.assignmentDetails.dueDate) {
      if (new Date(this.assignmentDetails.dueDate) <= new Date(this.assignmentDetails.startDate)) {
        this.dateError = 'Due date must be after start date';
        const fallbackDue = new Date(this.assignmentDetails.startDate);
        fallbackDue.setMinutes(fallbackDue.getMinutes() + 10);
        this.assignmentDetails.dueDate = this.formatDate(fallbackDue);
        return this.formatDate(fallbackDue);
      }
    }
    this.dateError = '';
    return null;
  }

  applyStartDatePreset(preset: any) {
    this.assignmentDetails.startDate = this.formatDate(preset.startDate);

    // if there is an existing due, adjust it as well.
    if (this.assignmentDetails.dueDate) {
      const startDateTime = new Date(this.assignmentDetails.startDate);
      const newDueDate = new Date(startDateTime);
      newDueDate.setHours(startDateTime.getHours() + 24);
      this.assignmentDetails.dueDate = this.formatDate(newDueDate);
    }
    this.dateError = '';
  }

  applyDueDatePreset(preset: { label: string; hoursToAdd: number }) {
    if (!this.assignmentDetails.startDate) {
      const now = new Date();
      const newDueDate = new Date(now.getTime() + preset.hoursToAdd * 60 * 60 * 1000);
      this.assignmentDetails.dueDate = this.formatDate(newDueDate);
    } else {
      const startDateTime = new Date(this.assignmentDetails.startDate);
      const newDueDate = new Date(startDateTime.getTime() + preset.hoursToAdd * 60 * 60 * 1000);
      this.assignmentDetails.dueDate = this.formatDate(newDueDate);
    }

    this.dateError = '';
  }

  isFormValid(): boolean {
    if (!this.selectedAssessment) return false;
    if (!this.assignmentDetails.startDate || !this.assignmentDetails.dueDate || !this.assignmentDetails.timeLimit) return false;

    if (this.assignmentDetails.timeLimit <= 0) return false;
    this.validateDates();
    if (this.dateError) return false;

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

    let lastIndex = nameParts.length - 1;
    if (this.lastNamePrefixes.includes(nameParts[lastIndex])) {
      lastIndex--;
    }

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
      const data = {
        className: this.selectedClass.className,
        assessmentIds: this.selectedAssessmentsForExport.map(assessment => assessment._id)
      }
      const blob = await this.api.exportToJs(data).toPromise();
      //save the file
      if (blob) {
        const fileName = `${this.selectedClass.className}_Assessment_Results_${new Date().toISOString().split('T')[0]}.xlsx`;
        saveAs(blob, fileName);
        this.selectedAssessmentsForExport = [];
        this.showExportModal = false;
      } else {
        throw new Error('Failed to generate export file');
        Swal.fire({
          title: 'Limit Reached',
          text: 'You may request again after 15 minutes',
          icon: 'error',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        })
        this.selectedAssessmentsForExport = [];
        this.showExportModal = false;
      }
    }
    catch (error) {
      console.error(error)

    }

  }
}