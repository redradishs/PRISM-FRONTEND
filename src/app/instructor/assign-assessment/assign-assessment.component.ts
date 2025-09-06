import { CommonModule } from '@angular/common';
import { Component, HostListener, ViewChild, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { StudentService } from '../../services/student.service';
import Swal from 'sweetalert2';

interface Student {
  _id: string;
  name: string;
  email: string;
  program: string | null;
  yearLevel: string | null;
}

interface Assessment {
  _id: string;
  title: string;
  totalQuestions: number;
  totalPoints: number;
  status: string;
  createdAt: string;
  category?: string;
  questionTypes: {
    [key: string]: number;
  };
}

interface ClassData {
  _id: string;
  className: string;
  classCode: string;
  block: string;
  year: string;
  totalStudents: number;
}

interface DatePreset {
  label: string;
  startDate: Date;
  dueDate: Date;
}

interface StudentPaginationResponse {
  data: {
    students: Student[];
    totalItems: number;
    totalPages: number;
  };
}

type AssignmentType = 'classes' | 'individual' | 'public';

interface AssignmentData {
  assessmentId: string;
  customTitle: string;
  startDate: string;
  dueDate: string;
  timeLimit: number;
  timeLimitPerQuestion: number;
  instructions: string;
  createdBy: string;
  assignmentMode: 'assessment' | 'mastery' | 'public';
  classCodes: string[];
  maxAttempts: number;
  totalPoints?: number;
  modeSettings: {
    masteryScore?: number;
    joiningCode?: string;
    randomizeQuestions: boolean;
    showResults: 'immediate' | 'completed';
    passingScore: number;
  };
}

@Component({
  selector: 'app-assign-assessment',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent, RouterModule],
  templateUrl: './assign-assessment.component.html',
  styleUrls: ['./assign-assessment.component.css'],
  standalone: true
})
export class AssignAssessmentComponent implements OnInit {
  userId: string = '';
  username: string = '';
  profile: string = '';

  isMobile: boolean = window.innerWidth <= 768;
  currentStep: number = 1;
  selectedMode: 'assessment' | 'mastery' | 'public' = 'assessment';

  // Assessment configuration
  startDate: string = '';
  dueDate: string = '';
  timeLimit: number = 60;
  allowLateSubmissions: boolean = false;
  showResults: 'immediate' | 'completed' = 'completed';
  passingScore: number = 70;
  attemptsAllowed: number = 1;
  randomizeQuestions: boolean = false;
  specialInstructions: string = '';
  customTitle: string = '';

  // Mastery mode settings
  masteryScore: number = 90;

  // Public mode settings
  isPublic: boolean = false;
  joiningCode: string = '';

  // Date presets
  startDatePresets: DatePreset[] = [
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

  dueDatePresets: { label: string; hoursToAdd: number }[] = [
    { label: '1hr', hoursToAdd: 1 },
    { label: '24hrs', hoursToAdd: 24 },
    { label: '1 week', hoursToAdd: 24 * 7 }
  ];

  assessments: Assessment[] = [];
  searchQuery: string = '';
  selectedAssessments: Set<string> = new Set();
  loading: boolean = false;
  error: string | null = null;

  assignmentType: AssignmentType = 'classes';
  classes: ClassData[] = [];
  classSearchQuery: string = '';
  selectedClasses: Set<string> = new Set();

  currentPage: number = 1;
  pageSize: number = 20;
  totalStudents: number = 0;
  totalPages: number = 0;
  sortBy: string = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  students: Student[] = [];
  studentSearchQuery: string = '';
  selectedStudents: Set<string> = new Set();

  private searchTimeout: any;
  isSearching: boolean = false;

  isSearchLoading: boolean = false;

  selectedAssessmentPoints: number = 0;
  displayLimit: number = 6;
  showingAll: boolean = false;
  dateFilter: string = 'all';

  timeLimitPerQuestion: number = 0;

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 768;
  }

  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private studentService: StudentService,
    private router: Router,
    private titleService: Title
  ) {
    this.titleService.setTitle('PRISM | Assign Assessment');
  }

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe({
      next: (user) => {
        this.userId = user.id;
        this.username = user.name;
        this.profile = user.profilePicture;
        this.loadAssessments(this.userId);
        this.loadClasses(this.userId);
        this.loadStudents();
      },
      error: (err) => {
        this.error = 'Failed to load user data';
        console.error('Error loading user:', err);
      }
    });
  }

  loadAssessments(id: string) {
    this.loading = true;
    this.api.getOwnAssessments(this.userId).subscribe({
      next: (resp: any) => {
        this.assessments = resp.data;
        this.loading = false;
        // console.log('Loaded assessments:', this.assessments);
      },
      error: (err) => {
        this.error = 'Failed to load assessments';
        this.loading = false;
        console.error('Error loading assessments:', err);
      }
    });
  }

  loadClasses(id: string) {
    this.loading = true;
    this.api.getSpecifiedClasses(this.userId).subscribe({
      next: (resp: any) => {
        this.classes = resp.data;
        this.loading = false;
        // console.log('Loaded classes:', this.classes);
      },
      error: (err) => {
        this.error = 'Failed to load classes';
        this.loading = false;
        console.error('Error loading classes:', err);
      }
    });
  }

  runUpdates() {
    this.api.getActiveAssessments(this.userId).subscribe({
      next: (resp: any) => {
        // console.log('Active assessments', resp.data);
      },
      error: (error: any) => {
        console.error('Error getting active assessments', error);
      }
    })
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  setStep(step: number) {
    if (step >= 1 && step <= 4) {
      this.currentStep = step;
      this.updatePageTitle();
    }
  }

  private updatePageTitle() {
    const stepTitles = {
      1: 'Select Assessment',
      2: 'Choose Recipients',
      3: 'Configure Settings',
      4: 'Review & Confirm'
    };
    this.titleService.setTitle(`PRISM | Assign Assessment - ${stepTitles[this.currentStep as keyof typeof stepTitles]}`);
  }

  setAssignmentType(type: AssignmentType) {
    this.assignmentType = type;
    this.selectedClasses.clear();
    this.selectedStudents.clear();
    if (type === 'individual') {
      this.selectedMode = 'public';
      this.attemptsAllowed = 1;
      this.showResults = 'completed';
      this.generateJoiningCode();
    }
    if (type === 'public') {
      this.selectedMode = 'public';
      this.attemptsAllowed = 1;
      this.showResults = 'completed';
      this.generateJoiningCode();
      this.setAssessmentMode('public')
    }
  }

  toggleClassSelection(classId: string) {
    const selectedClass = this.classes.find(c => c._id === classId);
    if (!selectedClass) return;

    const classCode = selectedClass.classCode;
    if (selectedClass.totalStudents === 0) {
      this.showNoStudentsAlert();
      return;
    }
    if (this.selectedClasses.has(classCode)) {
      this.selectedClasses.delete(classCode);
    } else {
      this.selectedClasses.add(classCode);
    }
  }

  get selectedClassCount(): number {
    return this.selectedClasses.size;
  }

  clearSelectedClasses() {
    this.selectedClasses.clear();
  }

  toggleStudentSelection(studentId: string) {
    if (this.selectedStudents.has(studentId)) {
      this.selectedStudents.delete(studentId);
    } else {
      this.selectedStudents.add(studentId);
    }
  }

  toggleAssessmentSelection(assessmentId: string) {
    if (this.selectedAssessments.has(assessmentId)) {
      this.selectedAssessments.delete(assessmentId);
      this.selectedAssessmentPoints = 0;
    } else {
      this.selectedAssessments.clear();
      this.selectedAssessments.add(assessmentId);
      const assessment = this.assessments.find(a => a._id === assessmentId);
      if (assessment) {
        this.selectedAssessmentPoints = assessment.totalPoints;
        if (this.selectedMode === 'mastery') {
          this.validateMasteryScore();
        }
      }
    }
  }
  clearAssessmentSelection() {
    this.selectedAssessments.clear();
  }

  isClassSelected(classId: string): boolean {
    const selectedClass = this.classes.find(c => c._id === classId);
    return selectedClass ? this.selectedClasses.has(selectedClass.classCode) : false;
  }

  isStudentSelected(studentId: string): boolean {
    return this.selectedStudents.has(studentId);
  }

  isAssessmentSelected(assessmentId: string): boolean {
    return this.selectedAssessments.has(assessmentId);
  }

  get filteredAssessments(): Assessment[] {
    return this.assessments.filter(assessment => {
      const matchesSearch = assessment.title.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesSearch;
    });
  }

  get filteredClasses(): ClassData[] {
    return this.classes.filter(cls => {
      const searchTerm = this.classSearchQuery.toLowerCase();
      return cls.className.toLowerCase().includes(searchTerm) ||
        cls.classCode.toLowerCase().includes(searchTerm) ||
        cls.block.toLowerCase().includes(searchTerm) ||
        cls.year.toLowerCase().includes(searchTerm);
    });
  }

  get filteredStudents(): Student[] {
    return this.students;
  }

  onBack() {
    if (this.currentStep > 1) {
      this.setStep(this.currentStep - 1);
    }
  }

  async onNext() {
    if (this.currentStep === 1 && this.selectedAssessments.size > 0) {
      this.setStep(2);
    } else if (this.currentStep === 2 &&
      ((this.assignmentType === 'classes' && this.selectedClasses.size > 0) ||
        (this.assignmentType === 'individual' && this.selectedStudents.size > 0) ||
        this.assignmentType === 'public')) {
      this.setStep(3);
    } else if (this.currentStep === 3) {
      this.setStep(4);
    } else if (this.currentStep === 4) {
      if (this.assignmentType === 'individual') {
        await this.assignSpecific();
      } else {
        await this.saveAssignment();
      }
    }
  }

  getStudentName(studentId: string): string {
    const student = this.students.find(s => s._id === studentId);
    return student ? student.name : '';
  }

  getClassName(classId: string): string {
    console.log(this.classes);
    const classObj = this.classes.find(c => String(c.classCode) === String(classId));
    console.log(classObj)
    return classObj ? classObj.className : '';
  }

  clearSelection() {
    if (this.assignmentType === 'individual') {
      this.selectedStudents.clear();
    } else {
      this.selectedClasses.clear();
    }
  }

  setAssessmentMode(mode: 'assessment' | 'mastery' | 'public') {
    this.selectedMode = mode;

    if (mode === 'mastery') {
      this.attemptsAllowed = 50;
      this.showResults = 'immediate';
      this.randomizeQuestions = false;
      this.masteryScore = Math.min(90, this.selectedAssessmentPoints);
    } else if (mode === 'public') {
      this.attemptsAllowed = 1;
      this.showResults = 'immediate';
      this.isPublic = true;
      this.generateJoiningCode();
    } else {
      this.attemptsAllowed = 1;
      this.showResults = 'completed';
      this.isPublic = false;
    }
  }

  generateJoiningCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.joiningCode = code;
  }

  applyStartDatePreset(preset: DatePreset) {
    this.startDate = this.formatDate(preset.startDate);

    if (this.dueDate) {
      const startDateTime = new Date(this.startDate);
      const newDueDate = new Date(startDateTime);
      newDueDate.setHours(startDateTime.getHours() + 24);
      this.dueDate = this.formatDate(newDueDate);
    }
  }

  applyDueDatePreset(preset: { label: string; hoursToAdd: number }) {
    if (!this.startDate) {
      const now = new Date();
      const newDueDate = new Date(now.getTime() + preset.hoursToAdd * 60 * 60 * 1000);
      this.dueDate = this.formatDate(newDueDate);
    } else {
      const startDateTime = new Date(this.startDate);
      const newDueDate = new Date(startDateTime.getTime() + preset.hoursToAdd * 60 * 60 * 1000);
      this.dueDate = this.formatDate(newDueDate);
    }
  }

  private formatDate(date: Date): string {
    // Format date to local timezone in YYYY-MM-DDThh:mm format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  getCurrentDateTime(): string {
    return this.formatDate(new Date());
  }

  getMinDueDate(): string {
    if (this.startDate) {
      const start = new Date(this.startDate);
      start.setMinutes(start.getMinutes() + 10);
      return this.formatDate(start);
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 1);
      return this.formatDate(now);
    }
  }

  validateDates(): string | null {
    if (this.startDate && this.dueDate) {
      if (new Date(this.dueDate) <= new Date(this.startDate)) {
        Swal.fire({
          title: 'Date is not valid',
          text: `Please select a valid start and due date.`,
          icon: 'info',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1000,
          timerProgressBar: true,
          background: '#fff',
          iconColor: '#3b82f6'
        });

        const fallbackDue = new Date(this.startDate);
        fallbackDue.setMinutes(fallbackDue.getMinutes() + 10);
        this.dueDate = this.formatDate(fallbackDue);
        return this.formatDate(fallbackDue);
      }
    }
    return null;
  }

  computeAllotedTime(): string {
    if (!this.startDate && !this.dueDate) {
      return '';
    }
    const start = new Date(this.startDate);
    const end = new Date(this.dueDate);
    let difference = end.getTime() - start.getTime();
    const msInDay = 1000 * 60 * 60 * 24;
    const msInHour = 1000 * 60 * 60;

    const days = Math.floor(difference / msInDay);
    const hours = Math.floor((difference % msInDay) / msInHour);
    const minutes = Math.floor((difference % msInHour) / (1000 * 60));

    const timeParts = [];
    if (days > 0) timeParts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) timeParts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) timeParts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);


    return `When the Assessment starts the Students have ${timeParts.join(', ')} to enter the assessment page.`
  }


  validateMasteryScore() {
    if (this.selectedAssessmentPoints > 0 && this.masteryScore > this.selectedAssessmentPoints) {
      this.masteryScore = this.selectedAssessmentPoints;
      Swal.fire({
        icon: 'warning',
        title: 'Mastery Score Adjusted',
        text: `Mastery score cannot exceed the total points (${this.selectedAssessmentPoints}). It has been automatically adjusted.`,
        timer: 2000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end'
      });
    }
  }

  getQuestionTypes(questionTypes: { [key: string]: number }): { type: string; count: number }[] {
    return Object.entries(questionTypes).map(([type, count]) => ({
      type: type.replace(/-/g, ' '),
      count
    }));
  }

  loadStudents() {
    this.isSearchLoading = true;
    this.api.retrieveStudents(this.userId, {
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    }).subscribe({
      next: (response: any) => {
        const paginatedResponse = response as StudentPaginationResponse;
        // console.log('Paginated response:', paginatedResponse);
        this.students = paginatedResponse.data.students;
        this.totalStudents = paginatedResponse.data.totalItems;
        this.totalPages = paginatedResponse.data.totalPages;
        this.isSearchLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load students';
        this.isSearchLoading = false;
        console.error('Error loading students:', err);
      }
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadStudents();
  }

  onSortChange(sortBy: string) {
    if (this.sortBy === sortBy) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'asc';
    }
    this.loadStudents();
  }

  onStudentSearch(searchTerm: string) {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.studentSearchQuery = searchTerm;

    if (!searchTerm.trim()) {
      this.loadStudents();
      return;
    }

    this.searchTimeout = setTimeout(() => {
      this.isSearching = true;
      this.isSearchLoading = true;

      this.api.searchStudentUniversal(this.userId, searchTerm).subscribe({
        next: (response: any) => {
          if (this.studentSearchQuery === searchTerm) {
            this.students = response.data.students || [];
            this.totalStudents = response.data.totalItems || 0;
            this.totalPages = response.data.totalPages || 1;
          }
          this.isSearchLoading = false;
          this.isSearching = false;
        },
        error: (err) => {
          console.error('Error searching students:', err);
          this.error = 'Failed to search students';
          this.isSearchLoading = false;
          this.isSearching = false;
        }
      });
    }, 300);
  }

  private getAssignmentData(): AssignmentData {
    const assignmentData: AssignmentData = {
      assessmentId: Array.from(this.selectedAssessments)[0],
      customTitle: this.customTitle,
      startDate: this.startDate,
      dueDate: this.dueDate,
      timeLimit: this.timeLimit,
      timeLimitPerQuestion: this.timeLimitPerQuestion,
      instructions: this.specialInstructions,
      createdBy: this.userId,
      assignmentMode: this.selectedMode,
      classCodes: this.assignmentType === 'classes'
        ? Array.from(this.selectedClasses)
        : Array.from(this.selectedStudents),
      maxAttempts: this.attemptsAllowed,
      modeSettings: {
        randomizeQuestions: this.randomizeQuestions,
        showResults: this.showResults,
        passingScore: this.passingScore
      }
    };

    // console.log(assignmentData.classCodes);
    if (this.selectedMode === 'mastery') {
      assignmentData.modeSettings.masteryScore = this.masteryScore;
    } else if (this.selectedMode === 'public') {
      assignmentData.modeSettings.joiningCode = this.joiningCode;
    }

    return assignmentData;
  }

  private validateAssignmentData(): string | null {
    if (!this.startDate || !this.dueDate) {
      return 'Please set both start and due dates.';
    }

    const startDateTime = new Date(this.startDate).getTime();
    const dueDateTime = new Date(this.dueDate).getTime();

    if (startDateTime >= dueDateTime) {
      return 'Start date must be before due date.';
    }

    if (this.timeLimit < 1) {
      return 'Time limit must be at least 1 minute.';
    }

    if (this.timeLimitPerQuestion > 0) {
      if (this.timeLimitPerQuestion < 10) {
        return 'Time Limit per Question is Unreasonable must be at least 10'
      }
      if (this.timeLimitPerQuestion > 180) {
        return 'Time Limit per Question cannot exceed 3 minutes'
      }
    }

    if (this.selectedMode === 'mastery') {
      if (this.masteryScore < 1 || this.masteryScore > 100) {
        return 'Mastery score must be between 1 and 100.';
      }
    }

    if (this.selectedMode === 'mastery') {
      if (this.attemptsAllowed < 1 || this.attemptsAllowed > 50) {
        return 'Mastery mode must be between 1 and 20 attempts only.';
      }
    } else {
      if (this.attemptsAllowed < 1 || this.attemptsAllowed > 5) {
        return 'Assessment mode must be between 1 and 5 attempts only.';
      }
    }

    if (this.selectedMode !== 'public' &&
      this.assignmentType === 'classes' &&
      this.selectedClasses.size === 0) {
      return 'Please select at least one class.';
    }

    if (this.selectedMode !== 'public' &&
      this.assignmentType === 'individual' &&
      this.selectedStudents.size === 0) {
      return 'Please select at least one student.';
    }

    return null;
  }

  isStartDateInvalid(): boolean {
    return !this.startDate || this.startDate === '';
  }
  isDueDateInvalid(): boolean {
    return !this.dueDate || this.dueDate === '';
  }

  isTimeLimitInvalid(): boolean {
    return this.timeLimit < 0;
  }

  isAttemptsInvalid(): boolean {
    if (this.selectedMode === 'mastery') {
      return this.attemptsAllowed < 1 || this.attemptsAllowed > 50;
    } else {
      return this.attemptsAllowed < 1 || this.attemptsAllowed > 5;
    }
  }

  isTimeLimitPerQuestionInvalid(): boolean {
    if (this.timeLimitPerQuestion === 0) return false;
    return this.timeLimitPerQuestion < 10 || this.timeLimitPerQuestion > 180;
  }


  async saveAssignment() {
    const validationError = this.validateAssignmentData();
    if (validationError) {
      await Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: validationError
      });
      return;
    }

    try {
      Swal.fire({
        title: 'Assigning Assessment',
        text: 'Please wait while we assign the assessment...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const assignmentData = this.getAssignmentData();
      // console.log('Assignment Data:', assignmentData);

      // public mode can send without classCodes
      if (this.selectedMode === 'public') {
        assignmentData.classCodes = [];
        this.api.assignAssessment(assignmentData).subscribe({
          next: (response) => {
            console.log('Public Assignment Response:', response);
            this.showSuccessAndNavigate();
          },
          error: (error) => {
            this.handleAssignmentError(error);
          }
        });
      } else {
        // classes will get added individually
        const recipients = this.assignmentType === 'classes'
          ? Array.from(this.selectedClasses)
          : Array.from(this.selectedStudents);

        console.log('Recipients:', recipients);

        const assignments = recipients.map(recipient => {
          const singleAssignment = {
            ...assignmentData,
            classCodes: [recipient]
          };
          console.log('Single Assignment Data:', singleAssignment);
          return this.api.assignAssessment(singleAssignment);
        });

        // Execute all assignments in sequence
        let completed = 0;
        assignments.reduce((promise, assignment) => {
          return promise.then(() => {
            return new Promise((resolve, reject) => {
              assignment.subscribe({
                next: (response: any) => {
                  completed++;
                  console.log(`Assignment ${completed}/${assignments.length} completed:`, response);
                  resolve(response);
                },
                error: (error) => {
                  reject(error);
                }
              });
            });
          });
        }, Promise.resolve())
          .then(() => {
            this.showSuccessAndNavigate();
          })
          .catch((error) => {
            this.handleAssignmentError(error);
          });
      }
    } catch (error) {
      this.handleAssignmentError(error);
    }
  }

  private showSuccessAndNavigate() {
    Swal.fire({
      icon: 'success',
      title: 'Assessment Assigned',
      text: this.selectedMode === 'public'
        ? 'The public assessment has been successfully created.'
        : `The assessment has been successfully assigned to ${this.assignmentType === 'classes' ? 'all selected classes' : 'all selected students'},`,
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    }).then(() => {
      this.router.navigate(['/instructor/dashboard']);
      this.runUpdates();
    });
  }

  private handleAssignmentError(error: any) {
    console.error('Error assigning assessment:', error);
    Swal.fire({
      icon: 'error',
      title: 'Assignment Failed',
      text: error.error?.message || error.message || 'There was an error assigning the assessment. Please try again.',
      footer: 'If this issue persists, please contact support.'
    });
  }

  // Update the getter to remove type filtering
  get displayedAssessments(): Assessment[] {
    let filtered = this.assessments.filter(assessment => {
      const matchesSearch = assessment.title.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesDate = this.filterByDate(assessment.createdAt);
      return matchesSearch && matchesDate;
    });

    filtered = filtered.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return this.showingAll ? filtered : filtered.slice(0, this.displayLimit);
  }

  get remainingCount(): number {
    const filtered = this.assessments.filter(assessment => {
      const matchesSearch = assessment.title.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesDate = this.filterByDate(assessment.createdAt);
      return matchesSearch && matchesDate;
    });
    return Math.max(0, filtered.length - this.displayLimit);
  }

  toggleShowAll(): void {
    this.showingAll = !this.showingAll;
  }

  filterByDate(dateStr: string): boolean {
    if (this.dateFilter === 'all') return true;

    const assessmentDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (this.dateFilter) {
      case 'today':
        return assessmentDate >= today;
      case 'week': {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        return assessmentDate >= weekAgo;
      }
      case 'month': {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        monthAgo.setHours(0, 0, 0, 0);
        return assessmentDate >= monthAgo;
      }
      default:
        return true;
    }
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.selectedAssessments.size > 0;
      case 2:
        return (this.assignmentType === 'classes' && this.selectedClasses.size > 0) ||
          (this.assignmentType === 'individual' && this.selectedStudents.size > 0)
          || this.assignmentType === 'public'
      case 3:
        const validDates = !!(this.startDate && this.dueDate);
        const validTimeLimit = this.timeLimit >= 0; // allow 0 for no time limit
        // const validAttempts = this.attemptsAllowed >= 1;
        let validAttempts = false;
        if (this.selectedMode === 'mastery') {
          validAttempts = this.attemptsAllowed >= 1 && this.attemptsAllowed <= 50;
        } else {
          validAttempts = this.attemptsAllowed >= 1 && this.attemptsAllowed <= 5;
        }
        if (this.assignmentType === 'individual' || this.assignmentType === 'public') {
          if (this.assignmentType === 'public' && this.selectedMode === 'public') {
            const result = validDates && validTimeLimit && validAttempts && this.joiningCode.length > 0;
            return result;
          }
          return validDates && validTimeLimit && validAttempts
        }

        let modeValidation = false;
        if (this.selectedMode === 'mastery') {
          modeValidation = this.masteryScore >= 1 && this.masteryScore <= this.selectedAssessmentPoints;
        } else if (this.selectedMode === 'assessment') {
          // allow 0 (no limit) or at least 5 minutes for assessment mode
          modeValidation = this.timeLimit === 0 || this.timeLimit >= 5;
        } else if (this.selectedMode === 'public') {
          modeValidation = this.joiningCode.length > 0;
        }

        return validDates && validTimeLimit && validAttempts && modeValidation;
      case 4:
        return true;
      default:
        return false;
    }
  }

  async assignSpecific() {
    if (!this.canProceed()) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields correctly.'
      });
      return;
    }

    const validationError = this.validateIndividualAssignmentData();
    if (validationError) {
      await Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: validationError
      });
      return;
    }

    const assignmentData = {
      assessmentId: Array.from(this.selectedAssessments)[0],
      studentIds: Array.from(this.selectedStudents),
      startDate: this.startDate,
      dueDate: this.dueDate,
      timeLimit: this.timeLimit,
      timeLimitPerQuestion: this.timeLimitPerQuestion,
      instructions: this.specialInstructions,
      createdBy: this.userId,
      assignmentMode: "assessment",
      modeSettings: {
        randomizeQuestions: this.randomizeQuestions,
        showResults: this.showResults,
        passingScore: this.passingScore
      },
      maxAttempts: this.attemptsAllowed,
    }


    try {
      const response = await this.api.assignSpecific(assignmentData).toPromise();

      Swal.fire({
        icon: 'success',
        title: 'Assessment Assigned',
        text: `Assessment has been successfully to specific students.`,
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

      this.router.navigate(['/instructor/dashboard']);


    } catch (error: any) {
      console.error('Error assigning assessment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Assignment Failed',
        text: error.error?.message || 'There was an error assigning the assessment. Please try again.'
      });
    }
  }

  scrollToTop() {
    const element = document.getElementById('page-top');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private validateIndividualAssignmentData(): string | null {
    if (!this.startDate || !this.dueDate) {
      return 'Please set both start and due dates.';
    }

    const startDateTime = new Date(this.startDate).getTime();
    const dueDateTime = new Date(this.dueDate).getTime();

    if (startDateTime >= dueDateTime) {
      return 'Start date must be before due date.';
    }

    if (this.timeLimit < 1) {
      return 'Time limit must be at least 1 minute.';
    }

    if (this.attemptsAllowed < 1 || this.attemptsAllowed > 5) {
      return 'Attempts must be between 1 and 5.';
    }

    if (this.selectedStudents.size === 0) {
      return 'Please select at least one student.';
    }

    if (this.selectedAssessments.size === 0) {
      return 'Please select an assessment.';
    }

    return null;
  }


  showNoStudentsAlert(): void {
    Swal.fire({
      title: 'No students in this class',
      icon: 'warning',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      background: '#fee2e2',
      color: '#b91c1c',
      iconColor: '#ef4444',
      customClass: {
        popup: 'swal2-toast'
      }
    });
  }

  viewAssessment(assessmentId: string): void {
    this.router.navigate(['/instructor/edit'], { state: { assessmentId } });
  }
}