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
import * as ExcelJS from 'exceljs';
import * as QRCode from 'qrcode';


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
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent, FormsModule],
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
        const data = {
          instructorId: this.userId,
          assignedAssessmentId: this.assessmentId,
          endDate: new Date().toISOString()
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
        const extended = new Date(currentDT.getTime() + 60 * 60 * 1000)
        const data = {
          instructorId: this.userId,
          assignedAssessmentId: this.assessmentId,
          endDate: extended.toISOString()
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
      text: 'Choose how you want to sort the results',
      icon: 'question',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Ranking',
      denyButtonText: 'Alphabetical',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.exportToCSV('score');
      } else if (result.isDenied) {
        this.exportToCSV('name');
      }
    });
  }

  async exportToCSV(sortBy: 'score' | 'name' = 'score') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Assessment Results');

    // Title Row
    worksheet.mergeCells('A1', 'F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${this.assessmentTitle.toUpperCase()} - ASSESSMENT RESULTS`;
    titleCell.font = { size: 22, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6366f1' } };
    titleCell.border = {
      top: { style: 'thick', color: { argb: '4f46e5' } },
      left: { style: 'thick', color: { argb: '4f46e5' } },
      bottom: { style: 'thick', color: { argb: '4f46e5' } },
      right: { style: 'thick', color: { argb: '4f46e5' } }
    };

    // Summary Section
    worksheet.addRow([]);
    worksheet.addRow(['Report Generated:', new Date().toLocaleDateString()]);
    worksheet.addRow(['Total Students:', this.allStudents.length]);
    worksheet.addRow(['Completed Assessments:', this.allStudents.filter(s => s.status === 'completed').length]);
    worksheet.addRow(['Completion Rate:', `${((this.allStudents.filter(s => s.status === 'completed').length / this.allStudents.length) * 100).toFixed(1)}%`]);
    worksheet.addRow(['Average Score:', `${(this.allStudents.reduce((sum, s) => sum + (s.score || 0), 0) / this.allStudents.length).toFixed(1)}%`]);
    worksheet.addRow(['Highest Score:', `${Math.max(...this.allStudents.map(s => s.score || 0))}%`]);
    worksheet.addRow(['Sorted By:', sortBy === 'score' ? 'Score Ranking' : 'Last Name']);
    worksheet.addRow([]);
    worksheet.getRow(3).alignment = { horizontal: 'center' };
    worksheet.getRow(4).alignment = { horizontal: 'center' };
    worksheet.getRow(5).alignment = { horizontal: 'center' };
    worksheet.getRow(6).alignment = { horizontal: 'center' };
    worksheet.getRow(7).alignment = { horizontal: 'center' };
    worksheet.getRow(8).alignment = { horizontal: 'center' };
    worksheet.getRow(9).alignment = { horizontal: 'center' };


    // Header
    const header = ['#', 'Student Name', 'Score (%)', 'Status', 'Violation Count', 'Performance'];
    const headerRow = worksheet.addRow(header);
    headerRow.eachCell(cell => {
      cell.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
      cell.alignment = { horizontal: 'center' };
    });

    // Sort students based on the selected criteria
    const sortedStudents = this.sortStudents(this.allStudents, sortBy);

    // Data Rows
    sortedStudents.forEach((student, index) => {
      const row = worksheet.addRow([
        index + 1,
        student.name || 'Unknown',
        `${student.score || 0}/${this.classOverview.totalScore}`,
        this.getStatusText(student.status),
        student.violationCount || 0,
        this.getPerformanceCategory(student.score || 0)
      ]);

      const score = student.score || 0;
      const totalItems = this.classOverview.totalScore;
      const scorePercentage = (score / totalItems) * 100;

      let style = { fontColor: '000000', bgColor: 'FFFFFF' };
      if (scorePercentage >= 85) {
        style = { fontColor: '166534', bgColor: 'DCFCE7' };
      } else if (scorePercentage >= 70) {
        style = { fontColor: '854D0E', bgColor: 'FEF9C3' };
      } else if (scorePercentage >= 60) {
        style = { fontColor: '4338CA', bgColor: 'E0E7FF' };
      }
      else {
        style = { fontColor: 'BE185D', bgColor: 'FCE7F3' };
      }


      const violationCount = student.violationCount || 0;
      if (violationCount <= 0) {
        row.getCell(5).font = { bold: true, color: { argb: '166534' }, size: 11 };
        row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0FDF4' } };
      } else if (violationCount <= 3) {
        row.getCell(5).font = { bold: true, color: { argb: 'B45309' }, size: 11 };
        row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEB' } };
      } else {
        row.getCell(5).font = { bold: true, color: { argb: 'B91C1C' }, size: 11 };
        row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } };
      }


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
      row.eachCell(cell => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      row.getCell(2).alignment = { horizontal: 'left' };
    });
    worksheet.getColumn(1).width = 22;  // #
    worksheet.getColumn(2).width = 30; // Student Name
    worksheet.getColumn(3).width = 12; // Score
    worksheet.getColumn(4).width = 14; // Status
    worksheet.getColumn(5).width = 15; // Violation Count
    worksheet.getColumn(6).width = 22; // Performance

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const filename = `${this.assessmentTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Results_${sortBy === 'score' ? 'Ranked' : 'Alphabetical'}.xlsx`;
    saveAs(blob, filename);
  }

  // Helper methods
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

}
