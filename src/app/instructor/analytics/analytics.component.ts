import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { AnalyticsPdfExportService } from './analytics-pdf-export.service';

@Component({
  selector: 'app-analytics',
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent implements OnInit {
  private readonly monthMs = 30 * 24 * 60 * 60 * 1000;
  private readonly STORAGE_KEY = 'analytics_preferences';
  userId: string = '';
  username: string = '';
  profile: string = '';
  isMobile = window.innerWidth < 768;
  isLoading: boolean = false;
  Math = Math;
  @ViewChild(SidebarComponent)
  sidebar!: SidebarComponent;
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  mobileTab: string = 'individual';


  //date variables
  startDate: string = '';
  endDate: string = '';
  selectedPreset: '6months' | '1year' | 'custom' = '6months';
  customStartDate: string = '';
  customEndDate: string = '';
  dateRangeError: string = '';
  startDatePresets = [
    {
      label: '6 Months',
      value: '6months',
      timeRange: '6months'
    },
    {
      label: '1 Year',
      value: '1year',
      timeRange: '1year'
    },
    {
      label: 'Custom Range',
      value: 'custom',
      timeRange: 'custom'
    }
  ];

  //platform overview
  platformOverviewData: any = {};
  overallClassPerformanceData: any = {};
  topTopics: any = [];
  leastTopics: any = [];
  performanceTrendData: any = [];

  analyticsGenerating: boolean = false;


  ///classes variables
  classStats: any = null;
  classes: any[] = [];
  selectedClassCode: string = '';
  selectedClass: any = null;

  performers: any = [];
  performanceDistribution: any = [];

  topPerformers: any = [];
  leastPerformers: any = [];

  //topic distribution
  topicDistribution: any = [];
  topicGeneratedDate: string = '';


  constructor(
    private auth: AuthService,
    private api: ApiService,
    private pdfExportService: AnalyticsPdfExportService
  ) {

  }

  ngOnInit(): void {
    const prefs = this.loadPreferences();
    if (prefs) {
      this.mobileTab = prefs.mobileTab || 'individual';
      this.selectedPreset = prefs.selectedPreset || '6months';
      this.customStartDate = prefs.customStartDate || '';
      this.customEndDate = prefs.customEndDate || '';
      this.selectedClassCode = prefs.selectedClassCode || '';
    }

    this.auth.getCurrentUser().subscribe(user => {
      this.userId = user.id;
      this.username = user.name;
      this.profile = user.profilePicture;

      if (this.selectedPreset === 'custom' && this.customStartDate && this.customEndDate) {
        this.startDate = new Date(this.customStartDate + 'T00:00:00').toISOString();
        this.endDate = new Date(this.customEndDate + 'T23:59:59').toISOString();
      } else {
        const preset = this.selectedPreset === 'custom' ? '6months' : this.selectedPreset;
        this.selectedPreset = preset;
        this.setRangeFromPreset(preset);
      }

      if (this.mobileTab === 'platform') {
        this.refreshPlatformData();
      } else {
        this.getClasses();
      }
    });
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  get requestData() {
    return {
      instructorId: this.userId,
      startDate: this.startDate,
      endDate: this.endDate,
      timeRange: this.selectedPreset
    }
  }

  get individualRequestData() {
    return {
      instructorId: this.userId,
      classCode: this.selectedClassCode,
      startDate: this.startDate,
      endDate: this.endDate,
      timeRange: this.selectedPreset
    };
  }

  get selectedClassName() {
    return this.classes.find(c => c.classCode === this.selectedClassCode)?.className || '';
  }

  get hasPlatformData(): boolean {
    return !!(
      this.platformOverviewData?.totalAssessments > 0 ||
      (this.overallClassPerformanceData?.length > 0) ||
      this.topTopics?.length > 0 ||
      this.leastTopics?.length > 0 ||
      this.performanceTrendData?.summary?.totalSubmissions > 0
    );
  }

  get hasIndividualData(): boolean {
    return !!(
      this.classStats?.totalStudents > 0 ||
      this.performers?.length > 0 ||
      this.topPerformers?.length > 0 ||
      this.leastPerformers?.length > 0
    );
  }

  get canExport(): boolean {
    return this.mobileTab === 'platform' ? this.hasPlatformData : this.hasIndividualData;
  }

  get hasRealTrendData(): boolean {
    return !!(
      this.performanceTrendData?.summary?.totalSubmissions > 0
    );
  }

  onTabChange(tab: 'platform' | 'individual') {
    this.mobileTab = tab;
    this.savePreferences();

    if (tab === 'platform') {
      if (!this.startDate || !this.endDate) {
        this.defaultPreset();
      } else {
        this.refreshPlatformData();
      }
    } else if (tab === 'individual') {
      this.getClasses();
    }
  }

  platformOverview() {
    this.api.analyticsPlatformOverview(this.requestData).subscribe({
      next: (resp: any) => {
        this.platformOverviewData = resp.data;
        if (resp.data.snapshotData === null) {
          this.analyticsTopicParser();
        } else {
          this.topicDistribution = resp.data.snapshotData;
          this.topicGeneratedDate = resp.data.snapshotGeneratedAt;
        }
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

  defaultPreset(runPlatformLoad: boolean = true) {
    this.selectedPreset = '6months';
    this.setRangeFromPreset('6months');
    if (runPlatformLoad) {
      this.refreshPlatformData();
    }
  }

  onPresetSelectionChange() {
    this.dateRangeError = '';
    if (this.selectedPreset === 'custom') {
      this.syncCustomRangeInputs();
      this.savePreferences();
      return;
    }

    this.setRangeFromPreset(this.selectedPreset);
    this.savePreferences();
    this.applySelectedRange();
  }

  applyCustomDateRange() {
    this.dateRangeError = '';
    if (!this.customStartDate || !this.customEndDate) {
      this.dateRangeError = 'Please select both start and end dates.';
      return;
    }

    const start = new Date(this.customStartDate + 'T00:00:00');
    const end = new Date(this.customEndDate + 'T23:59:59');
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      this.dateRangeError = 'Please provide a valid date range.';
      return;
    }
    if (start >= end) {
      this.dateRangeError = 'Start date must be earlier than end date.';
      return;
    }

    this.startDate = start.toISOString();
    this.endDate = end.toISOString();
    this.savePreferences();
    this.applySelectedRange();
  }


  overallClassPerformance() {
    this.api.analyticsClassPerformance(this.requestData).subscribe({
      next: (resp: any) => {
        this.overallClassPerformanceData = resp.data.classesPerformance;
      },
      error: (err) => {
        console.log(err);
      }
    })
  }


  topicAnalysis() {
    this.api.analyticsTopicAnalysis(this.requestData).subscribe({
      next: (resp: any) => {
        this.topTopics = resp.data.topPerforming;
        this.leastTopics = resp.data.lowPerforming;
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

  performanceTrend() {
    this.api.analyticsPerformanceTrend(this.requestData).subscribe({
      next: (resp: any) => {
        this.performanceTrendData = resp.data;
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

  getScoreColorClass(score: number): string {
    if (score >= 90) return 'text-green-600 font-semibold';
    if (score >= 80) return 'text-blue-600 font-semibold';
    if (score >= 70) return 'text-yellow-600 font-semibold';
    if (score >= 60) return 'text-orange-600 font-semibold';
    return 'text-red-600 font-semibold';
  }

  getPerformanceColorClass(performance: string): string {
    const perf = performance.toLowerCase();
    if (perf === 'excellent') return 'text-green-600 font-semibold';
    if (perf === 'good') return 'text-blue-600 font-semibold';
    if (perf === 'average') return 'text-yellow-600 font-semibold';
    if (perf === 'below average') return 'text-orange-600 font-semibold';
    return 'text-red-600 font-semibold';
  }

  getTopicDataLevel(percentage: number): string {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 80) return 'good';
    if (percentage >= 70) return 'average';
    return 'weak';
  }


  getTopicPerformanceLabel(percentage: number): string {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Good';
    if (percentage >= 70) return 'Average';
    return 'Weak';
  }

  getMissedTopicPerformanceLabel(percentage: number): string {
    if (percentage <= 10) return 'Excellent';
    if (percentage <= 20) return 'Good';
    if (percentage <= 30) return 'Average';
    return 'Weak';
  }

  getMissedTopicLevel(percentage: number): string {
    if (percentage <= 20) return 'low';
    if (percentage <= 40) return 'medium';
    return 'high';
  }




  //////////////////////////// individual class performance ////////////////////////////

  getClasses() {
    this.isLoading = true;
    this.api.ownedClasses(this.userId).subscribe({
      next: (resp: any) => {
        this.classes = resp.data || [];
        this.isLoading = false;

        if (this.classes && this.classes.length > 0) {
          const savedExists = this.selectedClassCode &&
            this.classes.some((c: any) => c.classCode === this.selectedClassCode);
          if (!savedExists) {
            this.selectedClassCode = this.classes[0].classCode;
          }
          this.savePreferences();
          this.refreshIndividualData();
        } else {
          this.selectedClassCode = '';
        }
      },
      error: (err) => {
        this.classes = [];
      }
    })
  }


  individualClassPerformance() {
    this.api.analyticsIndividualClassPerformance(this.individualRequestData).subscribe({
      next: (resp: any) => {
        this.classStats = resp.data;
        if (resp.data.snapshotData === null) {
          this.analyticsTopicParser();
        } else {
          this.topicDistribution = resp.data.snapshotData;
          this.topicGeneratedDate = resp.data.snapshotGeneratedAt;
        }
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

  analyticsIndividualPerformers() {
    this.api.analyticsIndividualPerformers(this.individualRequestData).subscribe({
      next: (resp: any) => {
        this.performers = resp.data.assessments;
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

  topandlowPerformers() {
    this.api.topandlowPerformers(this.individualRequestData).subscribe({
      next: (resp: any) => {
        this.topPerformers = resp.data.topPerformers;
        this.leastPerformers = resp.data.leastPerformers;
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

  analyticsIndividualPerformanceDistribution() {
    this.api.analyticsIndividualPerformanceDistribution(this.individualRequestData).subscribe({
      next: (resp: any) => {
        this.performanceDistribution = resp.data;
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

  onClassCodeChange() {
    this.savePreferences();
    this.refreshIndividualData();
  }


  analyticsTopicParser() {
    if (this.analyticsGenerating) return;
    this.analyticsGenerating = true;
    let monthRange = 0;
    switch (this.selectedPreset) {
      case '6months':
        monthRange = 6;
        break;
      case '1year':
        monthRange = 12;
        break;
      case 'custom':
        monthRange = this.getCustomMonthRange();
        break;
    }
    const data = {
      instructorId: this.userId,
      monthRange: monthRange
    }
    this.api.analyticsTopicParser(data).subscribe({
      next: (resp: any) => {
        // console.log(resp.data);
        this.aiTopicAnalysis(resp.data);
      },
      error: (err) => {
        console.log(err);
        this.analyticsGenerating = false;
      }
    });
  }

  aiTopicAnalysis(data: any) {
    const aiData = {
      requestData: data.topics
    }
    this.api.analyzePlatformPerformance(aiData).subscribe({
      next: (resp: any) => {
        // console.log(resp.data);
        this.topicDistribution = resp.formattedResponse;
        this.topicGeneratedDate = new Date().toISOString();
        this.saveSnapshot(resp.formattedResponse);
        this.analyticsGenerating = false;
      },
      error: (err) => {
        console.log(err);
        this.analyticsGenerating = false;
      }
    })
  }

  saveSnapshot(data: any) {
    let scope = '';
    switch (this.mobileTab) {
      case 'platform':
        scope = 'overall';
        break;
      case 'individual':
        scope = 'class';
        break;
    }
    const saveData = {
      instructorId: this.userId,
      scope: scope,
      classCode: this.mobileTab === 'platform' ? null : this.selectedClassCode,
      analysis: data
    }
    this.api.analyticsSaveSnapshot(saveData).subscribe({
      next: (resp: any) => {
        // console.log(resp.data);
      },
      error: (err) => {
        console.log(err);
      }
    })

  }

  exportPDFReport() {
    if (!this.canExport) return;
    if (this.mobileTab === 'platform') {
      this.exportPlatformOverviewPDF();
    } else {
      this.exportIndividualClassPDF();
    }
  }

  private exportIndividualClassPDF() {
    const selectedClassObj = this.classes.find(c => c.classCode === this.selectedClassCode);

    this.pdfExportService.exportIndividualClassPDF({
      classStats: this.classStats,
      selectedClassCode: this.selectedClassCode,
      selectedClassName: selectedClassObj?.className || '',
      performers: this.performers,
      topPerformers: this.topPerformers,
      leastPerformers: this.leastPerformers,
      performanceDistribution: this.performanceDistribution,
      topicDistribution: this.topicDistribution,
      topicGeneratedDate: this.topicGeneratedDate,
      instructorName: this.username,
      dateRangeLabel: this.getSelectedRangeLabel()
    });
  }

  private exportPlatformOverviewPDF() {
    const presetLabel = this.getSelectedRangeLabel();

    this.pdfExportService.exportPlatformOverviewPDF({
      selectedPreset: this.selectedPreset,
      presetLabel: presetLabel,
      platformOverviewData: this.platformOverviewData,
      overallClassPerformanceData: this.overallClassPerformanceData,
      topTopics: this.topTopics,
      leastTopics: this.leastTopics,
      performanceTrendData: this.performanceTrendData,
      topicDistribution: this.topicDistribution,
      topicGeneratedDate: this.topicGeneratedDate,
      instructorName: this.username,
      dateRangeLabel: presetLabel
    });
  }

  private applySelectedRange() {
    if (this.mobileTab === 'platform') {
      this.refreshPlatformData();
      return;
    }
    this.refreshIndividualData();
  }

  private refreshPlatformData() {
    this.platformOverview();
    this.overallClassPerformance();
    this.topicAnalysis();
    this.performanceTrend();
  }

  private refreshIndividualData() {
    if (!this.selectedClassCode) {
      return;
    }
    this.individualClassPerformance();
    this.analyticsIndividualPerformers();
    this.analyticsIndividualPerformanceDistribution();
    this.topandlowPerformers();
  }

  private setRangeFromPreset(preset: '6months' | '1year') {
    const now = new Date();
    const start = new Date(now.getTime() - (preset === '6months' ? 6 : 12) * this.monthMs);
    this.startDate = start.toISOString();
    this.endDate = now.toISOString();
    this.syncCustomRangeInputs();
  }

  private syncCustomRangeInputs() {
    if (this.startDate && this.endDate) {
      this.customStartDate = this.toLocalDate(new Date(this.startDate));
      this.customEndDate = this.toLocalDate(new Date(this.endDate));
      return;
    }
    const now = new Date();
    this.customEndDate = this.toLocalDate(now);
    this.customStartDate = this.toLocalDate(new Date(now.getTime() - this.monthMs));
  }

  private toLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getCustomMonthRange() {
    if (!this.startDate || !this.endDate) {
      return 1;
    }
    const start = new Date(this.startDate).getTime();
    const end = new Date(this.endDate).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
      return 1;
    }
    const months = Math.ceil((end - start) / this.monthMs);
    return Math.max(months, 1);
  }

  getSelectedRangeLabel(): string {
    if (this.selectedPreset === 'custom') {
      if (!this.startDate || !this.endDate) {
        return 'Custom Range';
      }
      const formatter = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });
      return `${formatter.format(new Date(this.startDate))} - ${formatter.format(new Date(this.endDate))}`;
    }
    return this.startDatePresets.find(p => p.value === this.selectedPreset)?.label || '';
  }

  private savePreferences() {
    const prefs = {
      mobileTab: this.mobileTab,
      selectedPreset: this.selectedPreset,
      customStartDate: this.customStartDate,
      customEndDate: this.customEndDate,
      selectedClassCode: this.selectedClassCode
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(prefs));
  }

  private loadPreferences() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}