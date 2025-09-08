import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
interface DatePreset {
  label: string;
  startDate: Date;
  dueDate: Date;
}

@Component({
  selector: 'app-assessment-settings',
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './assessment-settings.component.html',
  styleUrl: './assessment-settings.component.css'
})
export class AssessmentSettingsComponent implements OnInit {
  userId: string = '';
  username: string = '';
  profile: string = '';
  isMobile = window.innerWidth < 768;
  isLoading: boolean = true;
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  @HostListener('window:resize')
  onResize() { this.isMobile = window.innerWidth < 768; }
  mode: string = 'assessment'
  assignedAssessmentId: string = '68afeaba30b6ceac08ee74fa';
  startDate: string = '';
  dueDate: string = '';
  timeLimit: number = 60;
  allowLateSubmissions: boolean = false;
  showResults: 'immediate' | 'completed' = 'completed';
  passingScore: number = 70;
  attemptsAllowed: number = 1;
  masteryScore: number = 0;
  randomizeQuestions: boolean = false;
  specialInstructions: string = '';
  customTitle: string = '';
  timeLimitPerQuestion: number = 0;

  assignedData: any;
  hasChanges: boolean = false;
  private originalData: any = {};
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

  constructor(private auth: AuthService, private api: ApiService) { }

  ngOnInit(): void {
    const state = history.state as { assessmentId: string };
    if (state && state.assessmentId) {
      this.assignedAssessmentId = state.assessmentId;
      this.retrieveData();
    }
    this.auth.getCurrentUser().subscribe(user => {
      this.userId = user.id,
        this.username = user.name,
        this.profile = user.profilePicture
    })

  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  retrieveData(): void {
    this.api.getAssessmentDetails(this.assignedAssessmentId).subscribe({
      next: (resp: any) => {
        // console.log(resp.data)
        this.assignedData = resp.data;
        this.mode = resp.data.mode;
        this.populateData(this.assignedData);
        this.isLoading = false;
      }, error: (error: any) => {
        console.error('Error retrieving data', error)
      }
    })
  }



  populateData(populateData: any) {
    if (populateData.customTitle) {
      this.customTitle = populateData.title || '';
    }
    if (populateData.mode === 'mastery') {
      this.masteryScore = populateData.masteryScore || 0;
    }
    this.startDate = this.formatDateFromString(populateData.startDate);
    this.dueDate = this.formatDateFromString(populateData.endDate);

    this.showResults = populateData.modeSettings.showResults || 'immediate';
    this.attemptsAllowed = populateData.maxAttempts || 1;

    this.timeLimit = populateData.timeLimit || 60;
    this.timeLimitPerQuestion = populateData.modeSettings.timedQuestions || 0;

    this.specialInstructions = populateData.instructions || '';
    this.randomizeQuestions = populateData.modeSettings.randomizeQuestions || false;
    this.storeOriginalData();
    this.hasChanges = false;
  }

  applyStartDatePreset(preset: DatePreset) {
    this.startDate = this.formatDate(preset.startDate);

    if (this.dueDate) {
      const startDateTime = new Date(this.startDate);
      const newDueDate = new Date(startDateTime);
      newDueDate.setHours(startDateTime.getHours() + 24);
      this.dueDate = this.formatDate(newDueDate);
    }
    this.onFormChange();
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
    this.onFormChange();
  }

  private checkforChanges(): void {
    const currentData = this.getCurrentFormData();
    this.hasChanges = JSON.stringify(currentData) !== JSON.stringify(this.originalData);
  }

  private getCurrentFormData(): any {
    return {
      customTitle: this.customTitle,
      startDate: this.startDate,
      dueDate: this.dueDate,
      showResults: this.showResults,
      attemptsAllowed: this.attemptsAllowed,
      timeLimit: this.timeLimit,
      timeLimitPerQuestion: this.timeLimitPerQuestion,
      specialInstructions: this.specialInstructions,
      randomizeQuestions: this.randomizeQuestions,
      allowLateSubmissions: this.allowLateSubmissions,
      passingScore: this.passingScore
    };
  }

  private storeOriginalData(): void {
    this.originalData = { ...this.getCurrentFormData() };
  }

  onFormChange(): void {
    this.checkforChanges();
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

  private formatDateFromString(dateString: string | Date): string {
    if (!dateString) return '';

    try {
      if (dateString instanceof Date) {
        return this.formatDate(dateString);
      }
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return '';
      }

      return this.formatDate(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  getCurrentDateTime(): string {
    return this.formatDate(new Date());
  }

  timeDisplay(): string {
    if (!this.startDate && !this.dueDate) {
      return ''
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


    return `The students have ${timeParts.join(', ')} to enter the Assessment when it starts.`
  }

  saveSettings() {
    const data: any = {
      id: this.assignedAssessmentId,
      startDate: this.startDate,
      dueDate: this.dueDate,
      timeLimit: this.timeLimit,
      allowLateSubmissions: this.allowLateSubmissions,
      showResults: this.showResults,
      passingScore: this.passingScore,
      maxAttempts: this.attemptsAllowed,
      randomizeQuestions: this.randomizeQuestions,
      specialInstructions: this.specialInstructions,
      customTitle: this.customTitle,
      timeLimitPerQuestion: this.timeLimitPerQuestion
    }
    if (this.mode === 'mastery') {
      data.masteryScore = this.masteryScore
    }
    // console.log('I got this data', data)
    this.api.updateAssessmentDetails(data).subscribe({
      next: (resp: any) => {
        Swal.fire({
          title: 'Update Successful',
          text: 'You have updated the Assessment Successfully!',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });

        this.retrieveData();
      }, error: (error: any) => {
        console.error('Error updating data:', error);
      }
    })
  }

  validateMasteryScore() {
    if (this.masteryScore > this.assignedData.points) {
      this.masteryScore = this.assignedData.points;
      Swal.fire({
        icon: 'warning',
        title: 'Mastery Score Adjusted',
        text: `Mastery score cannot exceed the total points (${this.assignedData.points}). It has been automatically adjusted.`,
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
        toast: true,
        position: 'top-end'
      });
    }
  }


}