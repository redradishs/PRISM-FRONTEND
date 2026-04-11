import { Component, HostListener, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsConfiguration, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { SidebarComponent } from "../../adons/sidebar/sidebar.component";
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AfterViewInit } from '@angular/core';
import { TutorialService } from '../../services/tutorial.service';
import { TutorialPromptComponent } from '../../shared/components/tutorial-prompt/tutorial-prompt.component';
import { AnalyticsPdfExportService } from '../analytics/analytics-pdf-export.service';
import { BarchartService } from '../../services/barchart.service';

interface AssessmentProgress {
  id: string;
  assessmentId: string;
  title: string;
  startDate: string;
  dueDate: string;
  timeLimit: number;
  type: string;
  masteryScore?: number;
  modeSettings?: {
    joiningCode: string;
    masteryScore?: number;
  };
  classes: {
    classCode: string;
    className: string;
    totalStudents: number;
    stats: {
      inProgress: number;
      submitted: number;
      graded: number;
      mastered?: number;
    };
    remainingStudents: number;
    responses: {
      status: string;
      score: number;
      studentId: string;
    }[];
  }[];
}



@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    SidebarComponent,
    RouterLink,
    TutorialPromptComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  userId: string = '';
  username: string = '';
  profile: string = '';
  totalStudents: number = 0;
  totalActiveAssessments: number = 0;
  totalClasses: number = 0;
  onGoingAssessments: AssessmentProgress[] = [];
  totalOngoingAssessments: number = 0;
  remainingOngoingAssessments: number = 0;
  showAllOngoing: boolean = false;
  scheduledAssessments: AssessmentProgress[] = [];
  totalScheduledAssessments: number = 0;
  remainingScheduledAssessments: number = 0;
  onGoingDisputes: any[] = [];
  topPerformingStudents: any[] = [];
  charts: any[] = [];
  dueThisWeek: number = 0;
  isMobile = window.innerWidth < 768;
  isLoading: boolean = true;
  showExportDropdown: boolean = false;
  selectedTimeRange: string = '6 months';
  weekLoad: number = 0;
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  @ViewChild('barChart') barChart?: BaseChartDirective;
  @ViewChild('pieChart') pieChart?: BaseChartDirective;

  private eventSource: EventSource | null = null;

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
    this.resizeCharts();
  }

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private titleService: Title,
    private tutorialService: TutorialService,
    private ngZone: NgZone,
    private pdfExportService: AnalyticsPdfExportService,
    private barchartService: BarchartService
  ) {
    this.titleService.setTitle('PRISM | Home');
  }

  ngOnInit() {
    this.auth.getCurrentUser().subscribe((user) => {
      if (user) {
        this.userId = user.id;
        this.username = user.name;
        this.profile = user.profilePicture;
        this.instructorData();
        this.getOnGoingAssessments(this.userId);
        this.getScheduledAssessments(this.userId);
        this.getDisputes();

        this.setupRealTimeUpdates();
      } else {
        console.log('No user found');
      }
    })
    setTimeout(() => {
      if (this.tutorialService.isTutorialInProgress()) {
        this.tutorialService.continueTutorial();
      }
    }, 500);
  }

  ngOnDestroy() {
    this.closeEventSource();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.resizeCharts();
    }, 100);
  }

  resizeCharts() {
    if (this.barChart?.chart) {
      this.barChart.chart.update();
    }
    if (this.pieChart?.chart) {
      this.pieChart.chart.update();
    }
  }

  instructorData() {
    const data = {
      id: this.userId
    }
    this.api.instructorData(data).subscribe({
      next: (resp: any) => {
        this.totalStudents = resp.data.totalStudents || 0;
        this.totalActiveAssessments = resp.data.totalActiveAssessments || 0;
        this.totalClasses = resp.data.totalClasses;
        if (this.totalClasses > 0) {
          this.getClassesCharts();
          this.getStudentPerformance(this.userId);
        }
      }
    })
  }

  getStudentPerformance(id: string) {
    this.api.getStudentPerformance(id).subscribe({
      next: (resp: any) => {
        this.topPerformingStudents = resp.data;
      },
      error: (error) => {
        console.error('Error getting student performance:', error);
      }
    })
  }

  getInitials(name: string) {
    const names = name.split(' ');
    return names[0][0] + names[names.length - 1][0];
  }

  private getWeekStartAndEnd() {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
  }

  getDueThisWeek(assessments: any[]): number {
    const { startOfWeek, endOfWeek } = this.getWeekStartAndEnd();

    const dueThisWeek = assessments.filter(assessment => {
      const dueDate = new Date(assessment.dueDate);
      return dueDate >= startOfWeek && dueDate <= endOfWeek;
    });

    return dueThisWeek.length;
  }

  private setupRealTimeUpdates() {
    if (!this.userId) return;

    this.eventSource = this.api.instructorDashboardUpdates(this.userId);

    this.eventSource.onmessage = (event) => {
      this.ngZone.run(() => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'update_detected') {
            this.getOnGoingAssessments(this.userId);
            this.getScheduledAssessments(this.userId);
          }

          switch (data.type) {
            case 'connected':
              console.log('Real-time connection established.');
              break;
            case 'update_detected':
              console.log('Real-time update detected. Fetching latest data...');
              this.getOnGoingAssessments(this.userId);
              this.getScheduledAssessments(this.userId);
              break;
            case 'max_reached':
              this.closeEventSource();
              console.warn('Maximum EventSource connections reached. Connection closed.');
              break;
            default:
              console.log('Unknown real-time event type:', data.type);
          }

        } catch (error) {
          console.error('Error handling real-time update:', error);
        }
      });
    };

    this.eventSource.onerror = (error: any) => {
      this.ngZone.run(() => {
        if (this.eventSource) {
          const readyState = this.eventSource.readyState;
          if (readyState === EventSource.CLOSED) {
            console.warn('Maximum EventSource connections reached or connection closed.');
          } else if (readyState === EventSource.CONNECTING) {
            console.log('EventSource is reconnecting...');
            this.reconnectAfterDelay();
          } else {
            console.log('EventSource connection error. ReadyState:', readyState);
          }
        }
      });
    };

  }


  private reconnectAfterDelay() {
    setTimeout(() => {
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.setupRealTimeUpdates();
      }
    }, 5000);
  }

  private closeEventSource() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }



  studentDetails(student: any) {
    this.router.navigate(['instructor/students/assessments'], {
      state: { studentId: student._id, classCode: student.classes[0].classCode }
    })
  }

  navigateToStudentClass(event: Event, studentId: string, classCode: string) {
    event.stopPropagation();
    this.router.navigate(['instructor/students/assessments'], {
      state: { studentId: studentId, classCode: classCode }
    });
  }

  getClassesCharts() {
    this.api.getClassesCharts(this.userId).subscribe({
      next: (resp: any) => {
        this.charts = resp.data;

        this.updateBarChartData();
        this.updatePieChartData();
      },
      error: (error) => {
        console.error('Error getting class charts:', error);
      }
    })
  }

  updateBarChartData() {
    this.barchartService.buildBarChartData(this.charts);
    setTimeout(() => {
      if (this.barChart?.chart) {
        this.barChart.chart.update();
      }
    }, 100);
  }

  updatePieChartData() {
    this.barchartService.buildPieChartData(this.charts);
    setTimeout(() => {
      if (this.pieChart?.chart) {
        this.pieChart.chart.update();
      }
    }, 100);
  }

  viewAll(tab: string) {
    // console.log('Viewing all', tab);
    this.router.navigate(['/instructor/manage'], { queryParams: { tab: tab } });
  }

  calculateProgress(assessment: AssessmentProgress): number {
    if (assessment.type === 'Public Assessment') {
      return 0;
    }
    const totalStudents = assessment.classes[0]?.totalStudents || 0;
    const gradedCount = assessment.classes[0]?.stats.submitted || 0;
    return totalStudents > 0 ? (gradedCount / totalStudents) * 100 : 0;
  }


  getOnGoingAssessments(userId: string) {
    this.api.getOngoingAssessments(this.userId, 4).subscribe((resp: any) => {
      try {
        this.onGoingAssessments = resp.data.data;
        this.totalOngoingAssessments = resp.data.total;
        this.remainingOngoingAssessments = resp.data.left;
        this.dueThisWeek = this.getDueThisWeek(this.onGoingAssessments);
        this.isLoading = false;
      } catch (error) {
        console.error('Error getting ongoing assessments:', error);
      }
    })
  }

  getDisputes() {
    this.api.getOngoingDisputes(this.userId).subscribe({
      next: (resp: any) => {
        this.onGoingDisputes = resp.data;
        // console.log('Ongoing disputes:', this.onGoingDisputes);
      }, error: (error) => {
        console.error('Error getting ongoing disputes:', error);
      }
    })
  }

  getDisplayedOngoingAssessments() {
    return this.showAllOngoing ? this.onGoingAssessments : this.onGoingAssessments.slice(0, 6);
  }

  gotoAssessment(ass: any) {
    // console.log('Going to assessment', ass);
    if (ass.type === 'Assessment' || ass.type === 'Public Assessment') {
      this.router.navigate(['/instructor/result'], {
        state: { assessmentId: ass.id }
      });
      // console.log('Going to result', ass.id);
    } else {
      this.router.navigate(['instructor/result/mastery'], {
        state: { assessmentId: ass.id }
      });
    }
  }


  createNewAssessment() {
    this.router.navigate(['/instructor/manage']);
  }

  addStudent() {
    this.router.navigate(['instructor/students']);
  }

  toggleExportDropdown() {
    this.showExportDropdown = !this.showExportDropdown;
  }

  selectTimeRange(range: string) {
    this.selectedTimeRange = range;
    this.showExportDropdown = false;
    this.exportPlatformOverviewPDF(range);
  }

  exportPlatformOverviewPDF(timeRange: string) {
    // Calculate date range based on selection
    let startDate: Date;
    const endDate = new Date();

    if (timeRange === '6 months') {
      startDate = new Date(endDate.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
    } else { // 1 year
      startDate = new Date(endDate.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
    }

    const requestData = {
      instructorId: this.userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      timeRange: timeRange === '6 months' ? '6months' : '1year'
    };

    // Fetch all required data for PDF export
    this.fetchPlatformOverviewData(requestData, timeRange);
  }

  private fetchPlatformOverviewData(requestData: any, timeRange: string) {
    // Fetch platform overview
    this.api.analyticsPlatformOverview(requestData).subscribe({
      next: (platformResp: any) => {
        // Fetch class performance
        this.api.analyticsClassPerformance(requestData).subscribe({
          next: (classResp: any) => {
            // Fetch topic analysis
            this.api.analyticsTopicAnalysis(requestData).subscribe({
              next: (topicResp: any) => {
                // Fetch performance trend
                this.api.analyticsPerformanceTrend(requestData).subscribe({
                  next: (trendResp: any) => {
                    // Generate PDF with all data
                    this.generatePDF({
                      selectedPreset: requestData.timeRange,
                      presetLabel: timeRange === '6 months' ? '6 Months' : '1 Year',
                      platformOverviewData: platformResp.data,
                      overallClassPerformanceData: classResp.data.classesPerformance,
                      topTopics: topicResp.data.topPerforming,
                      leastTopics: topicResp.data.lowPerforming,
                      performanceTrendData: trendResp.data,
                      topicDistribution: platformResp.data.snapshotData || [],
                      topicGeneratedDate: platformResp.data.snapshotGeneratedAt || new Date().toISOString()
                    });
                  },
                  error: (err) => console.error('Error fetching performance trend:', err)
                });
              },
              error: (err) => console.error('Error fetching topic analysis:', err)
            });
          },
          error: (err) => console.error('Error fetching class performance:', err)
        });
      },
      error: (err) => console.error('Error fetching platform overview:', err)
    });
  }

  private generatePDF(data: any) {
    this.pdfExportService.exportPlatformOverviewPDF(data);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.export-dropdown-container')) {
      this.showExportDropdown = false;
    }
  }

  getAssessmentTypeLabel(assessment: any): string {
    return assessment.type || 'Assessment';
  }

  getAssessmentTypeIcon(assessment: AssessmentProgress): string {
    switch (assessment.type) {
      case 'Mastery':
        return 'fa-trophy';
      case 'Public Assessment':
        return 'fa-globe';
      default:
        return 'fa-clipboard-check';
    }
  }

  getAssessmentTypeColor(assessment: AssessmentProgress): string {
    switch (assessment.type) {
      case 'Mastery':
        return 'amber';
      case 'Public Assessment':
        return 'blue';
      default:
        return 'indigo';
    }
  }

  //if public assessment is fetched, return 0 as if it has no students yet
  getAssessmentTotalStudents(assessment: any): number {
    if (assessment.type === 'Public Assessment') {
      return 0;
    }
    return assessment.classes.reduce((total: number, classData: any) => total + classData.totalStudents, 0);
  }

  getJoiningCode(assessment: any): string {
    return assessment.type === 'Public Assessment' ? assessment.modeSettings?.joiningCode : '';
  }

  getScheduledAssessments(userId: string) {
    this.api.getScheduledAssessments(this.userId, 4).subscribe((resp: any) => {
      try {
        this.scheduledAssessments = resp.data.data;
        this.totalScheduledAssessments = resp.data.total;
        this.remainingScheduledAssessments = resp.data.left;
      } catch (error) {
        console.error('Error getting scheduled assessments:', error);
      }
    })
  }

  navigateToClass(classCode: string) {
    this.router.navigate(['instructor/students'], {
      state: { selectedClassCode: classCode }
    });
  }


  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }


  viewAllReports() {
    this.router.navigate(['/instructor/reports']);
  }

  getReasonBadgeClass(reason: string): string {
    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes('wrong') || reasonLower.includes('incorrect')) {
      return 'reason-error';
    } else if (reasonLower.includes('technical') || reasonLower.includes('system')) {
      return 'reason-technical';
    } else if (reasonLower.includes('time') || reasonLower.includes('constraint')) {
      return 'reason-time';
    } else if (reasonLower.includes('unclear') || reasonLower.includes('wording')) {
      return 'reason-unclear';
    }
    return 'reason-other';
  }

  getReasonIcon(reason: string): string {
    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes('wrong') || reasonLower.includes('incorrect')) {
      return 'fa-times-circle';
    } else if (reasonLower.includes('technical') || reasonLower.includes('system')) {
      return 'fa-cog';
    } else if (reasonLower.includes('time') || reasonLower.includes('constraint')) {
      return 'fa-clock';
    } else if (reasonLower.includes('unclear') || reasonLower.includes('wording')) {
      return 'fa-question-circle';
    }
    return 'fa-flag';
  }

  reviewReport(report: any) {
    // console.log('Reviewing report:', report);
    this.router.navigate(['/instructor/response'], {
      state: { studentId: report.studentId, assessmentId: report.assessmentId }
    });
  }

  resolveReport(report: any) {
    if (confirm(`Mark this report from ${report.studentName} as resolved?`)) {
      // console.log('Resolving report:', report);
      const index = this.onGoingDisputes.findIndex(d => d.id === report.id);
      if (index !== -1) {
        this.onGoingDisputes[index].status = 'Resolved';
      }
    }
  }

  get barChartData() { return this.barchartService.barChartData; }
  get barChartOptions() { return this.barchartService.barChartOptions; }
  get pieChartData() { return this.barchartService.pieChartData; }
  get pieChartOptions() { return this.barchartService.pieChartOptions; }
  onChartClick(event: any) {
    if (event.active && event.active.length > 0) {
      const dataIndex = event.active[0].index;
      if (this.charts && this.charts.length > dataIndex) {
        const selectedClass = this.charts[dataIndex];
        // console.log('Chart clicked:', selectedClass);
        this.navigateToClass(selectedClass.classCode);
      }
    }
  }

}