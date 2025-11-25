import { CommonModule } from '@angular/common';
import { Component, HostListener, ViewChild, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import { saveAs } from 'file-saver';
import * as QRCode from 'qrcode';
import { RollingNumberComponent } from '../../shared/components/rolling-number/rolling-number.component';


interface Student {
  id: number;
  name: string;
  profile: string;
  block: string;
  score: number;
  performance: string;
  percentage: number;
}

interface QuestionData {
  id: number;
  question: string;
  correct: number;
  incorrect: number;
  successRate: number;
}

interface SubmissionStatus {
  submitted: number;
  inProgress: number;
  notStarted: number;
  total: number;
}

@Component({
  selector: 'app-result',
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent, FormsModule, RollingNumberComponent],
  templateUrl: './result.component.html',
  styleUrl: './result.component.css'
})
export class ResultComponent implements OnInit, OnDestroy {
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
  showSettings: boolean = false;
  assessmentId: string = '';
  classOverview: any = {
    mode: String,
    totalStudents: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0
  };
  username: string = '';
  itemAnalysis: any;
  topPerforming: Student[] = [];
  leastPerforming: Student[] = [];

  searchTerm: string = '';
  selectedStatus: string = 'all';
  allStudents: any[] = [];
  filteredStudents: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 9;
  activeTab: string = 'results';
  mobileTab: string = 'insights';
  classResult: any;
  className: string = '';
  classCode: string = '';
  assessmentTitle: string = '';
  studentResult: any;
  questions: any;
  questionLength: number = 0;
  scoreDistribution: any;
  submissionStatus: SubmissionStatus = {
    submitted: 0,
    inProgress: 0,
    notStarted: 0,
    total: 0
  };
  completionStatistics: any;
  isLoading: boolean = true;
  selectedQuestionType: string = 'all';
  allQuestions: any[] = [];
  userId: String = '';
  profile: string = '';
  private scoreStream: EventSource | null = null;
  insights: any[] = [
    {
      primary: "Assessment in Progress, insights will be availble once completed.",
      secondary: "Insights will be available once the assessment is completed."
    },
    {
      primary: "Real-time Student Progress in the list below.",
      secondary: "You can monitor student progress in the student list below."
    },
    {
      primary: "Student Status in the list below.",
      secondary: "Track submission status and performance metrics in real-time."
    }
  ];
  expandedIndex: number | null = null;
  showJoiningCodeModal: boolean = false;
  qrCodeDataUrl: string = '';
  private lastNamePrefixes = [
    'De', 'Del', 'Dela', 'De la', 'De los', 'San', 'Santa', 'Sta.'
  ];
  allowJoining: boolean = false;
  fabOpen: boolean = false;
  fabActive = false;
  fabFaded = false;
  private fabTimeoutId: any = null;
  private readonly FAB_TIMEOUT_DURATION = 10000;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private titleService: Title,
    private ngZone: NgZone
  ) {
    this.titleService.setTitle('PRISM | Result');
  }

  ngOnInit(): void {
    const state = history.state as { assessmentId: string };

    if (state && state.assessmentId) {
      this.assessmentId = state.assessmentId;
      Promise.all([
        this.getResultOverview(this.assessmentId),
        this.getClassResult(this.assessmentId)
      ]).finally(() => {
        // this.isLoading = false;
      });
      // console.log('Assessment ID:', this.assessmentId);
    } else {
      // console.log("Could not find the assessment ID");
      this.router.navigate(['/instructor/assessment']);
    }

    this.auth.getCurrentUser().subscribe((user) => {
      this.userId = user.id,
        this.username = user.name,
        this.profile = user.profilePicture;
    });
  }

  ngOnDestroy(): void {
    if (this.scoreStream) {
      this.scoreStream.close();
    }

    if (this.fabTimeoutId) {
      clearTimeout(this.fabTimeoutId);
    }
  }

  //rt updates with the help of SSE
  private setupScoreStream(): void {
    this.scoreStream = this.api.getScoreStream(this.assessmentId);

    this.scoreStream.onmessage = (event) => {
      this.ngZone.run(() => {
        try {
          const data = JSON.parse(event.data);
          // console.log('Received update:', data);
          if (data.type === 'connected') {
            console.log('PRISM: Connected to RealTime Updates');
            return;
          }
          if (data.assessmentId === this.assessmentId && data.student) {
            const studentIndex = this.allStudents.findIndex(s => s.id === data.student.id);

            if (studentIndex !== -1) {
              const student = this.allStudents[studentIndex];
              if (data.operation === 'insert') {
                // console.log(`${student.name} started the assessment`);
              } else if (data.operation === 'update') {
                // console.log(`${student.name}'s score updated to ${data.student.score}`);
              }

              const updatedStudents = [...this.allStudents];
              updatedStudents[studentIndex] = {
                ...student,
                score: data.student.score,
                status: data.student.status,
                violationCount: data.student.violationCount,
                block: data.student.block || student.block
              };

              // Update our lists with the new data
              this.allStudents = updatedStudents;
              this.filteredStudents = [...updatedStudents];

              // Re-sort and filter the list
              this.filterStudents();
              const counts = {
                submitted: 0,
                inProgress: 0,
                notStarted: 0,
                total: this.allStudents.length
              };
              this.allStudents.forEach(s => {
                switch (s.status.toLowerCase()) {
                  case 'submitted':
                    counts.submitted++;
                    break;
                  case 'in-progress':
                    counts.inProgress++;
                    break;
                  case 'not_started':
                    counts.notStarted++;
                    break;
                }
              });
              //status count updater
              this.submissionStatus = counts;
              this.completionStatistics = { ...counts };
            }
          }
        } catch (error) {
          console.error('Problem processing update:', error);
        }
      });
    };

    this.scoreStream.onerror = (error) => {
      console.error('Connection error:', error);

      setTimeout(() => {
        if (this.scoreStream) {
          this.scoreStream.close();
          this.setupScoreStream();
          console.log('Attempting to reconnect...');
        }
      }, 5000);
    };

    console.log('Started listening for score updates');
  }

  getResultOverview(id: string) {
    this.api.getClassOverview(this.assessmentId).subscribe({
      next: (resp: any) => {
        this.classOverview = resp.data;
        this.assessmentTitle = resp.data.title;
        this.allowJoining = resp.data.enableJoining;
        if (resp.data.classes && resp.data.classes.length > 0) {
          this.className = resp.data.classes[0].className;
          this.classCode = resp.data.classes[0].classCode;
        }
        if (resp.data.status === 'ongoing') {
          this.setupScoreStream();
        }
        if (resp.data.status === 'completed') {
          this.getItemAnalysis(this.assessmentId);
          this.insights = resp.data.insights;
        }
        // console.log('Assessment Title:', this.assessmentTitle);
        // console.log('Class Code:', this.classCode);
        // console.log('Class Overview:', this.classOverview);
      },
      error: (error) => {
        console.error('Error getting class overview:', error);
      }
    });
  }

  getItemAnalysis(id: string) {
    this.api.getQuestionAnalysis(this.assessmentId).subscribe({
      next: (resp: any) => {
        // console.log('Question Analysis Response:', resp.data);
        this.itemAnalysis = resp.data;
        if (resp.data && resp.data.questions) {
          this.allQuestions = resp.data.questions;
          this.questions = [...this.allQuestions];
          this.questionLength = this.questions.length;
          // console.log('Questions loaded:', this.questions);
          // console.log('Question Length:', this.questionLength);
          this.getStudentPerformance(this.assessmentId);
        }
      },
      error: (error) => {
        console.error('Error getting item analysis:', error);
      }
    });
  }

  getStudentPerformance(id: string) {
    this.api.getTopandLowPerformers(this.assessmentId).subscribe(({
      next: (resp: any) => {
        this.topPerforming = resp.data.studentPerformance.topPerformers;
        this.leastPerforming = resp.data.studentPerformance.strugglingStudents;
        // console.log('Top Performing Students:', this.topPerforming);
        // console.log('Least Performing Students:', this.leastPerforming);

        //////student performance 
        this.scoreDistribution = resp.data.scoreDistribution;
        this.submissionStatus = resp.data.submissionStatus;
        this.completionStatistics = resp.data.submissionStatus;
        // console.log('Class Overview:', this.classOverview);
        if (this.classOverview.status === 'completed' && this.insights.length === 0) {
          this.prismInsights();
        }
      },
      error: (error) => {
        console.error('Error getting student performance:', error);
      }
    }))
  }

  getClassResult(id: string) {
    this.api.getClassScore(this.assessmentId).subscribe({
      next: (resp: any) => {
        // console.log('Class Result:', resp.data);
        this.classResult = resp.data;
        this.allStudents = resp.data.results;
        this.filteredStudents = [...this.allStudents];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error getting class result:', error);
      }
    });
  }

  toggleShowSettings() {
    this.showSettings = !this.showSettings;
  }

  filterStudents() {
    let filtered = this.allStudents.filter(student => {
      const statusMatch = this.selectedStatus === 'all' ||
        student.status.toLowerCase() === this.selectedStatus;

      const searchMatch = !this.searchTerm ||
        student.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (student.block && student.block.toLowerCase().includes(this.searchTerm.toLowerCase()));

      return statusMatch && searchMatch;
    });

    filtered.sort((a, b) => {
      const statusA = a.status.toLowerCase();
      const statusB = b.status.toLowerCase();

      // for sorting of students, if not started they will be at the bottom
      if (statusA === 'not_started' && statusB !== 'not_started') {
        return 1;
      }
      if (statusB === 'not_started' && statusA !== 'not_started') {
        return -1;
      }
      //null sort by name
      if (statusA === 'not_started' && statusB === 'not_started') {
        return a.name.localeCompare(b.name);
      }
      return b.score - a.score; // Higher scores come first
    });
    this.filteredStudents = filtered;
  }

  filterQuestions() {
    if (this.selectedQuestionType === 'all') {
      this.questions = [...this.allQuestions];
    } else {
      this.questions = this.allQuestions.filter(question =>
        question.questionType.toLowerCase() === this.selectedQuestionType.toLowerCase()
      );
    }
    this.questionLength = this.questions.length;
    // console.log('Filtered Questions:', this.questions);
    // console.log('Selected Type:', this.selectedQuestionType);
  }


  prismInsights() {
    const data = {
      totalStudents: this.itemAnalysis.totalStudents,
      submittedCount: this.itemAnalysis.submittedCount,
      questions: this.questions
    }
    this.api.analyzeResult(data).subscribe({
      next: (resp: any) => {
        console.log('Prism Insights:', resp.analysis);
        this.insights = resp.analysis || [
          {
            primary: "AI analysis not available",
            secondary: "Please check the data and try again."
          }
        ];
        this.saveInsights();
      },
      error: (error) => {
        console.error('Error getting prism insights:', error);
      }
    });
  }

  saveInsights() {
    console.log('Saving insights:', this.insights);
    const data = {
      assignedAssessmentId: this.assessmentId,
      insights: this.insights
    }
    this.api.saveInsights(data).subscribe({
      next: (resp: any) => {
        console.log('Insights saved:', resp);
      },
      error: (error) => {
        console.error('Error saving insights:', error);
      }
    })
  }

  assessmentDetails(student: any) {
    if (student.status?.toLowerCase() === 'submitted') {
      this.router.navigate(['/instructor/response'], {
        state: { studentId: student.id, assessmentId: this.assessmentId }
      });
    } else {
      Swal.fire({
        title: 'No Submission',
        text: `${student.name} hasn\'t taken the assessment yet`,
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

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  get totalPages() {
    return Math.ceil(this.filteredStudents.length / this.itemsPerPage);
  }

  get currentStudents() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredStudents.slice(start, end);
  }

  getPerformanceColor(performance: string): string {
    switch (performance) {
      case "Excellent":
        return "text-green-500";
      case "Good":
        return "text-orange-500";
      case "Needs Improvement":
        return "text-red-500";
      default:
        return "";
    }
  }

  getAssessmentTypeIcon(assessment: string): string {
    switch (assessment) {
      case 'mastery':
        return 'fa-trophy';
      case 'public assessment':
        return 'fa-globe';
      case 'assessment':
        return 'fa-clipboard-check';
      default:
        return 'fa-clipboard-check';
    }
  }

  getAssessmentTypeColor(assessment: string): string {
    switch (assessment) {
      case 'mastery':
        return '#d97706';
      case 'public assessment':
        return '#2563eb';
      case 'assessment':
        return '#4f46e5';
      default:
        return '#4f46e5';
    }
  }

  endAssessment() {
    Swal.fire({
      title: 'End Assessment?',
      text: 'This will end the assessment for all students. Are you sure you want to proceed?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, end it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    }).then((result) => {
      if (result.isConfirmed) {
        const currentDT = new Date();
        const extended = new Date(currentDT.getTime() + 60 * 60 * 1000);
        const phTime = new Date(extended.getTime() + (8 * 60 * 60 * 1000));
        const data = {
          instructorId: this.userId,
          assignedAssessmentId: this.assessmentId,
          endDate: phTime
        }
        this.api.endNow(data).subscribe({
          next: (resp: any) => {
            Swal.fire({
              title: 'Assessment Ended',
              text: 'The assessment has been ended successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.getResultOverview(this.assessmentId);
            this.toggleShowSettings();
          },
          error: (error) => {
            Swal.fire({
              title: 'Error',
              text: 'Failed to end the assessment. Please try again.',
              icon: 'error',
              confirmButtonColor: '#dc2626'
            });
            console.error('Error ending assessment:', error);
          }
        });
      }
    });
  }

  extendAssessment() {
    Swal.fire({
      title: 'Extend Assessment?',
      text: 'This will extend the assessment time by 1 hour. Do you want to continue?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, extend it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#6b7280',
    }).then((result) => {
      if (result.isConfirmed) {
        const currentDT = new Date();
        const extended = new Date(currentDT.getTime() + 60 * 60 * 1000);
        const data = {
          instructorId: this.userId,
          assignedAssessmentId: this.assessmentId,
          endDate: extended
        }
        this.api.extendNow(data).subscribe({
          next: (resp: any) => {
            Swal.fire({
              title: 'Assessment Extended',
              text: 'The assessment time has been extended by 1 hour',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.getResultOverview(this.assessmentId);
            this.toggleShowSettings();
          },
          error: (error) => {
            Swal.fire({
              title: 'Error',
              text: 'Failed to extend the assessment. Please try again.',
              icon: 'error',
              confirmButtonColor: '#dc2626'
            });
            console.error('Error extending assessment:', error);
          }
        });
      }
    });
  }

  startAssessment() {
    Swal.fire({
      title: 'Start Assessment?',
      text: 'This will start the assessment for all students. Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, start it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#6b7280',
    }).then((result) => {
      if (result.isConfirmed) {
        const data = {
          instructorId: this.userId,
          assignedAssessmentId: this.assessmentId
        }
        this.api.startNow(data).subscribe({
          next: (resp: any) => {
            Swal.fire({
              title: 'Assessment Started',
              text: 'The assessment has been started successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.getResultOverview(this.assessmentId);
            this.getClassResult(this.assessmentId)
            this.toggleShowSettings();

          },
          error: (error) => {
            Swal.fire({
              title: 'Error',
              text: 'Failed to start the assessment. Please try again.',
              icon: 'error',
              confirmButtonColor: '#dc2626'
            });
            console.error('Error starting assessment:', error);
          }
        });
      }
    });
  }

  refreshData(): void {
    this.getResultOverview(this.assessmentId),
      this.getClassResult(this.assessmentId)

    Swal.fire({
      title: 'Refresh Success',
      text: 'You have Successfully Refresh the page please do not SPAM as the page refreshes Realtime.',
      icon: 'success',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    })
  }

  gotoSettings() {
    this.router.navigate(['/instructor/result/settings'], {
      state: { assessmentId: this.assessmentId }
    })
  }

  getProgressWidth(score: number): string {
    return `${score}%`;
  }

  handlePrevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  handleNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  toggleInsight(index: number) {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  private getLastName(name: string): string {
    if (!name) return '';

    const nameParts = name.trim().split(' ');
    if (nameParts.length <= 1) return name;

    // Check for compound last names
    let lastName = nameParts[nameParts.length - 1];
    let secondLastName = nameParts[nameParts.length - 2];

    // Check if second to last word is a prefix
    if (this.lastNamePrefixes.includes(secondLastName)) {
      lastName = `${secondLastName} ${lastName}`;
    }

    return lastName;
  }

  private sortStudents(students: any[], sortBy: 'score' | 'name'): any[] {
    return [...students].sort((a, b) => {
      if (sortBy === 'score') {
        // Sort by score (descending)
        return (b.score || 0) - (a.score || 0);
      } else {
        // Sort by last name
        const lastNameA = this.getLastName(a.name || '');
        const lastNameB = this.getLastName(b.name || '');
        return lastNameA.localeCompare(lastNameB);
      }
    });
  }


  export() {
    Swal.fire({
      title: 'Export Results',
      text: 'Do you want to export the Result?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.exportToCSV();
      }
    });
  }

  async exportToCSV() {
    const data: any = {
      assessmentIds: [this.assessmentId]
    }
    if (this.className) {
      data.className = this.className;
    }
    const blob = await this.api.exportToJs(data).toPromise();
    //save the file
    if (blob) {
      const fileName = `${this.assessmentTitle}_Assessment_Results_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);
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
    }

  }

  copyJoiningCode() {
    if (this.classOverview.joiningCode) {
      navigator.clipboard.writeText(this.classOverview.joiningCode).then(() => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Joining code copied!',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
      }).catch(err => {
        console.error('Failed to copy joining code: ', err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed to copy joining code',
          showConfirmButton: false,
          timer: 2000
        });
      });
    }
  }

  toggleAllowJoining() {
    this.allowJoining = !this.allowJoining;

    const data = {
      assignedAssessmentId: this.assessmentId,
      instructorId: this.userId,
      enableJoining: this.allowJoining
    }

    // console.log(data);

    this.api.updateJoiningAccess(data).subscribe({
      next: (resp: any) => {
        Swal.fire({
          title: 'Success',
          text: `Joining access has been ${this.allowJoining ? 'enabled' : 'disabled'}.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.getResultOverview(this.assessmentId);
      }, error: (error) => {
        Swal.fire({
          title: 'Error',
          text: 'Failed to update joining access. Please try again.',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
        console.error('Error updating joining access:', error);
      }
    })
  }

  async showJoiningCodeDetails() {
    if (this.classOverview.joiningCode) {
      this.showJoiningCodeModal = true;
      await this.generateQRCode();
    }
  }

  toggleJoiningCodeModal() {
    this.showJoiningCodeModal = !this.showJoiningCodeModal;
    if (!this.showJoiningCodeModal && !this.classOverview) {
      this.qrCodeDataUrl = '';
    }
  }

  getJoiningLink() {
    const url = `${window.location.origin}/join/public/${this.classOverview.joiningCode}`;
    return url;
  }

  async generateQRCode() {
    try {
      if (this.classOverview.mode === 'public') {
        const joiningLink = `${window.location.origin}/join/public/${this.classOverview.joiningCode}`;

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
    navigator.clipboard.writeText(this.getJoiningLink()).then(() => {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Joining link copied!',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
    }).catch(err => {
      console.error('Failed to copy joining link: ', err);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Failed to copy joining link',
        showConfirmButton: false,
        timer: 2000
      });
    });
  }


  closeFab() {
    this.fabOpen = false;
    this.setFabActive();
  }

  toggleFab() {
    this.fabOpen = !this.fabOpen;
    this.setFabActive();
  }

  private setFabActive(): void {
    this.fabActive = true;
    this.fabFaded = false;

    if (this.fabTimeoutId) {
      clearTimeout(this.fabTimeoutId);
    }

    if (!this.fabOpen) {
      this.fabTimeoutId = setTimeout(() => {
        this.fabActive = false;
        this.fabFaded = true;
      }, this.FAB_TIMEOUT_DURATION);
    }
  }

  onFabInteraction(): void {
    if (!this.fabOpen) {
      this.setFabActive();
    }
  }

}
