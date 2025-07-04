import { CommonModule } from '@angular/common';
import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Title } from '@angular/platform-browser';


@Component({
  selector: 'app-student-attempt',
  imports: [CommonModule, SidebarComponent, FormsModule],
  templateUrl: './student-attempt.component.html',
  styleUrl: './student-attempt.component.css'
})
export class StudentAttemptComponent {
  userId: string = '';
  username: string = '';
  profile: string = '';
  isMobile = window.innerWidth < 768;
  isLoading: boolean = true;
  String = String;
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  questionData: any = [];
  attemptData: any = null;
  assignedAssessmentId: string = '';
  studentId: string = '';
  spec: number = 0;
  assessmentTitle: string = '';

  constructor(private api: ApiService, private auth: AuthService, private router: Router, private titleService: Title) {
    this.titleService.setTitle('PRISM | Student Attempt');
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.assignedAssessmentId = navigation?.extras?.state['assessmentId'];
      this.studentId = navigation?.extras?.state?.['studentId'];
      this.spec = navigation?.extras?.state?.['spec'];
      this.attemptHistory();
    }
  }


  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe(user => {
      this.userId = user.id;
      this.username = user.name;
      this.profile = user.profilePicture;
      this.attemptHistory();
    });

  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  attemptHistory() {
    const data = {
      assignedAssessmentId: this.assignedAssessmentId,
      studentId: this.studentId,
      spec: this.spec
    }
    this.api.getAttemptHistory(data).subscribe({
      next: (resp: any) => {
        this.attemptData = resp.data.attemptHistory[0];
        this.assessmentTitle = resp.data.assessment.title;
        this.questionData = resp.data.attemptHistory[0].answers;
        console.log('Attempt Data:', this.attemptData);
        console.log('Question Data:', this.questionData);
        this.isLoading = false;
      }, error: (err: any) => {
        Swal.fire('Error', 'Failed to retrieve attempt history', 'error');
        console.error(err);
      }
    })
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

  getQuestionTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'multiple-choice':
        return 'fa-list-ul';
      case 'enumeration':
        return 'fa-list-ol';
      default:
        return 'fa-question';
    }
  }

  getFriendlyTypeName(type: string): string {
    return type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  formatAnswer(answer: string | string[]): string {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return answer;
  }

  formatTimeSpent(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }




}
