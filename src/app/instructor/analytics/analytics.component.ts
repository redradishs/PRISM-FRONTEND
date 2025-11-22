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
  selectedPreset: any = '6months';
  startDatePresets = [
    {
      label: '6 Months',
      value: '6months',
      startDate: new Date(new Date().getTime() - 6 * 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      timeRange: '6months'
    },
    {
      label: '1 Year',
      value: '1year',
      startDate: new Date(new Date().getTime() - 12 * 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      timeRange: '1year'
    }
  ]

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
    this.auth.getCurrentUser().subscribe(user => {
      this.userId = user.id,
        this.username = user.name,
        this.profile = user.profilePicture
    })
    if (this.mobileTab === 'platform') {
      this.defaultPreset();
    } else if (this.mobileTab === 'individual') {
      this.getClasses();
    }
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
      classCode: this.selectedClassCode
    }
  }

  onTabChange(tab: 'platform' | 'individual') {
    this.mobileTab = tab;

    if (tab === 'platform') {
      this.defaultPreset();

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

  defaultPreset() {
    const preset = this.startDatePresets.find(p => p.value === '6months');
    if (preset) {
      this.selectedPreset = preset.value;
      this.startDate = preset.startDate.toISOString();
      this.endDate = preset.endDate.toISOString();
      this.platformOverview();
      this.overallClassPerformance();
      this.topicAnalysis();
      this.performanceTrend();
    }
  }
  datePresetChange(event: Event) {
    const selectedElement = event.target as HTMLSelectElement;
    const selectedValue = selectedElement.value;

    const preset = this.startDatePresets.find(p => p.value === selectedValue);
    if (preset) {
      this.selectedPreset = preset.value;
      this.startDate = preset.startDate.toISOString();
      this.endDate = preset.endDate.toISOString();
      this.platformOverview();
      this.overallClassPerformance();
      this.topicAnalysis();
      this.performanceTrend();
    }
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
          this.selectedClassCode = this.classes[0].classCode;
          this.individualClassPerformance();
          this.analyticsIndividualPerformers();
          this.analyticsIndividualPerformanceDistribution();
          this.topandlowPerformers();
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
    this.individualClassPerformance();
    this.analyticsIndividualPerformers();
    this.analyticsIndividualPerformanceDistribution();
    this.topandlowPerformers();
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
        console.log(resp.data);
      },
      error: (err) => {
        console.log(err);
      }
    })

  }

  exportPDFReport() {
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
      topicGeneratedDate: this.topicGeneratedDate
    });
  }

  private exportPlatformOverviewPDF() {
    const presetLabel = this.startDatePresets.find(p => p.value === this.selectedPreset)?.label || '';

    this.pdfExportService.exportPlatformOverviewPDF({
      selectedPreset: this.selectedPreset,
      presetLabel: presetLabel,
      platformOverviewData: this.platformOverviewData,
      overallClassPerformanceData: this.overallClassPerformanceData,
      topTopics: this.topTopics,
      leastTopics: this.leastTopics,
      performanceTrendData: this.performanceTrendData,
      topicDistribution: this.topicDistribution,
      topicGeneratedDate: this.topicGeneratedDate
    });
  }





}