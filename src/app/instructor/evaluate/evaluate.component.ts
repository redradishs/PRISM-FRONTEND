import { Component, HostListener, ViewChild, OnInit } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

interface AssignmentData {
  assessmentId: string;
  studentIds: string[];
  startDate: string;
  dueDate: string;
  timeLimit: number;
  instructions: string;
  file?: string;
  createdBy: string;
  assignmentMode: 'assessment' | 'mastery';
  modeSettings: {
    masteryScore?: number;
    randomizeQuestions: boolean;
    showResults: 'immediate' | 'completed';
    timedQuestions: number;
    instructorAssigned: boolean;
  };
  maxAttempts: number;
}

interface DatePreset {
  label: string;
  startDate: Date;
  dueDate: Date;
}

@Component({
  selector: 'app-evaluate',
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './evaluate.component.html',
  styleUrl: './evaluate.component.css'
})
export class EvaluateComponent implements OnInit {
  activeTab: string = 'skills';
  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  userId: string = '';
  username: string = '';
  profile: string = '';
  studentId: string = '';
  assessments: any[] = [];
  studentData: any = {};
  skillSet: any[] = [];
  filteredSkillSet: any[] = [];
  selectedSkillFilter: string = 'all';
  isLoadingSkills: boolean = false;
  
  // Modal properties
  showAssignModal: boolean = false;
  isSubmitting: boolean = false;
  availableAssessments: any[] = [];
  
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
  
  // Assignment data
  assignmentData: AssignmentData = {
    assessmentId: '',
    studentIds: [],
    startDate: '',
    dueDate: '',
    timeLimit: 60,
    instructions: '',
    createdBy: '',
    assignmentMode: 'assessment',
    modeSettings: {
      randomizeQuestions: false,
      showResults: 'completed',
      timedQuestions: 0,
      instructorAssigned: true
    },
    maxAttempts: 1
  };
  
  constructor(private router: Router, private api: ApiService, private auth: AuthService, private title: Title) {
    this.title.setTitle('PRISM | Evaluate');
    const navigation = this.router.getCurrentNavigation();
    if(navigation?.extras?.state) {
      this.studentId = navigation.extras.state['studentId']
      this.getPastAssessments();
      this.getStudentData(this.studentId);
      this.getStudentSkills(this.studentId);
      console.log('User ID:', this.userId);
    }
  }

  ngOnInit(): void {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile.bind(this));
    this.auth.getCurrentUser().subscribe((user) => {
      this.userId = user.id;
      this.username = user.name || '';
      this.profile = user.profilePicture;
      this.assignmentData.createdBy = user.id;
      this.loadAvailableAssessments();
    });
  }

  getPastAssessments() {
    this.api.evaluateAssessmentHistory(this.studentId).subscribe({
      next: (resp: any) => {
        console.log('Past Assessments:', resp);
        this.assessments =  resp.data;
      },
      error: (error) => {
        console.error('Error fetching past assessments:', error);
      }
    })
  }

  getStudentData(id: string) {
    this.api.evaluateStudentData(this.studentId).subscribe({
      next: (resp: any) => {
        this.studentData = resp.data;
        console.log('Student Data:', this.studentData);
      },
      error: (error) => {
        console.error('Error fetching student data:', error);
      }
    })
  }

  getStudentSkills(id: string) {
    this.isLoadingSkills = true;
    this.api.studentSkillSet(this.studentId).subscribe({
      next: (resp: any) => {
        this.skillSet = resp.data?.skillsPerformance || [];
        this.filteredSkillSet = [...this.skillSet];
        this.isLoadingSkills = false;
        console.log('Student Skills:', this.skillSet);
      },
      error: (error) => {
        console.error('Error fetching student skills:', error);
        this.skillSet = [];
        this.filteredSkillSet = [];
        this.isLoadingSkills = false;
      }
    })
  }

  filterSkills(): void {
    switch (this.selectedSkillFilter) {
      case 'excellent':
        this.filteredSkillSet = this.skillSet.filter(skill => 
          (skill.percentage || 0) >= 76 && (skill.percentage || 0) <= 100
        );
        break;
      case 'good':
        this.filteredSkillSet = this.skillSet.filter(skill => 
          (skill.percentage || 0) >= 51 && (skill.percentage || 0) <= 75
        );
        break;
      case 'needs-improvement':
        this.filteredSkillSet = this.skillSet.filter(skill => 
          (skill.percentage || 0) >= 1 && (skill.percentage || 0) <= 50
        );
        break;
      case 'no-data':
        this.filteredSkillSet = this.skillSet.filter(skill => 
          (skill.percentage || 0) === 0
        );
        break;
      case 'all':
      default:
        this.filteredSkillSet = [...this.skillSet];
        break;
    }
  }

  get improvementSkills() {
    return this.skillSet.filter(skill => 
      (skill.percentage || 0) >= 1 && (skill.percentage || 0) <= 75
    ).sort((a, b) => (a.percentage || 0) - (b.percentage || 0)); 
  }

getRelativeTime(dateString: string): string {
  const dateUtc = new Date(dateString); 
  
  const now = new Date();
  const nowPh = new Date(now.getTime() + (8 * 60 * 60 * 1000)); 
  
  // console.log('Now PH:', nowPh.toISOString());
  // console.log('Date UTC:', dateUtc.toISOString());

  const diffInSeconds = Math.floor((nowPh.getTime() - dateUtc.getTime()) / 1000);

  if (diffInSeconds < 0) {
    return 'Just now'; 
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 30) {
    return dateUtc.toUTCString(); 
  } else if (diffInDays > 0) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  } else if (diffInHours > 0) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  } else if (diffInMinutes > 0) {
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
  } else {
    return 'Just now';
  }
}



  getStudentInitials(name: string): string {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  }

  assessmentDetails(i: any){
    console.log("This is the data:", i)
    this.router.navigate(['/instructor/response'], {
      state: {studentId: this.studentId, assessmentId: i._id, show: false}
    }); 
  }

  checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  createNewAssessment() {
    this.openAssignModal();
  }

  addStudent() {
    this.router.navigate(['/instructor/students']);
  }

  loadAvailableAssessments() {
    this.api.getOwnAssessments(this.userId).subscribe({
      next: (resp: any) => {
        this.availableAssessments = resp.data || [];
        console.log('Available assessments:', this.availableAssessments);
      },
      error: (err) => {
        console.error('Error loading assessments:', err);
        this.availableAssessments = [];
      }
    });
  }

  openAssignModal() {
    this.showAssignModal = true;
    this.resetAssignmentData();
    this.assignmentData.studentIds = [this.studentId];
  }

  closeAssignModal(event?: Event) {
    if (event && event.target !== event.currentTarget) {
      return;
    }
    this.showAssignModal = false;
    this.resetAssignmentData();
  }

  resetAssignmentData() {
    this.assignmentData = {
      assessmentId: '',
      studentIds: [this.studentId],
      startDate: '',
      dueDate: '',
      timeLimit: 60,
      instructions: '',
      createdBy: this.userId,
      assignmentMode: 'assessment',
      modeSettings: {
        randomizeQuestions: false,
        showResults: 'completed',
        timedQuestions: 0,
        instructorAssigned: true
      },
      maxAttempts: 1
    };
  }

  getCurrentDateTime(): string {
    const now = new Date();
    return this.formatDate(now);
  }

  getMinDueDate(): string {
    if (this.assignmentData.startDate) {
      const start = new Date(this.assignmentData.startDate);
      start.setMinutes(start.getMinutes() + 10);
      return this.formatDate(start);
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 1);
      return this.formatDate(now);
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  validateDates(): void {
    if (this.assignmentData.startDate && this.assignmentData.dueDate) {
      const startTime = new Date(this.assignmentData.startDate).getTime();
      const dueTime = new Date(this.assignmentData.dueDate).getTime();
      
      if (dueTime <= startTime) {
        const start = new Date(this.assignmentData.startDate);
        start.setMinutes(start.getMinutes() + 10);
        this.assignmentData.dueDate = this.formatDate(start);
        
        Swal.fire({
          title: 'Date Adjusted',
          text: 'Due date has been adjusted to be at least 10 minutes after start date.',
          icon: 'info',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
      }
    }
  }

  getSelectedAssessmentPoints(): number {
    if (!this.assignmentData.assessmentId) return 0;
    const assessment = this.availableAssessments.find(a => a._id === this.assignmentData.assessmentId);
    return assessment ? assessment.totalPoints : 0;
  }

  canSubmitAssignment(): boolean {
    const hasRequiredFields = !!(this.assignmentData.assessmentId && 
                             this.assignmentData.startDate && 
                             this.assignmentData.dueDate);
    
    const hasValidDates = !!(this.assignmentData.startDate && 
                         this.assignmentData.dueDate &&
                         new Date(this.assignmentData.dueDate) > new Date(this.assignmentData.startDate));
    
    const hasMasteryScore = this.assignmentData.assignmentMode !== 'mastery' || 
                           !!(this.assignmentData.modeSettings.masteryScore && 
                            this.assignmentData.modeSettings.masteryScore > 0 &&
                            this.assignmentData.modeSettings.masteryScore <= this.getSelectedAssessmentPoints());
    
    return hasRequiredFields && hasValidDates && hasMasteryScore;
  }

  applyStartDatePreset(preset: DatePreset) {
    this.assignmentData.startDate = this.formatDate(preset.startDate);
    
    if (this.assignmentData.dueDate) {
      const startDateTime = new Date(this.assignmentData.startDate);
      const newDueDate = new Date(startDateTime);
      newDueDate.setHours(startDateTime.getHours() + 24);
      this.assignmentData.dueDate = this.formatDate(newDueDate);
    }
  }

  applyDueDatePreset(preset: { label: string; hoursToAdd: number }) {
    console.log('Applying due date preset:', preset.label, 'hours to add:', preset.hoursToAdd);
    
    if (!this.assignmentData.startDate) {
      const now = new Date();
      const newDueDate = new Date(now.getTime() + preset.hoursToAdd * 60 * 60 * 1000);
      this.assignmentData.dueDate = this.formatDate(newDueDate);
      console.log('Due date set from current time:', this.assignmentData.dueDate);
    } else {
      const startDateTime = new Date(this.assignmentData.startDate);
      const newDueDate = new Date(startDateTime.getTime() + preset.hoursToAdd * 60 * 60 * 1000);
      this.assignmentData.dueDate = this.formatDate(newDueDate);
      console.log('Due date set from start date:', this.assignmentData.dueDate);
    }
  }

  async assignAssessment() {
    if (!this.canSubmitAssignment()) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields correctly.'
      });
      return;
    }

    this.isSubmitting = true;

    try {
      const response = await this.api.assignSpecific(this.assignmentData).toPromise();
      
      Swal.fire({
        icon: 'success',
        title: 'Assessment Assigned',
        text: `Assessment has been successfully assigned to ${this.studentData.student?.name}.`,
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

      this.closeAssignModal();
      
    } catch (error: any) {
      console.error('Error assigning assessment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Assignment Failed',
        text: error.error?.message || 'There was an error assigning the assessment. Please try again.'
      });
    } finally {
      this.isSubmitting = false;
    }
  }
}
