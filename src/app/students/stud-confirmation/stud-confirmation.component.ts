import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../services/student.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-stud-confirmation',
  imports: [SidebarComponent, CommonModule],
  templateUrl: './stud-confirmation.component.html',
  styleUrl: './stud-confirmation.component.css',
})
export class StudConfirmationComponent {
  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent)
  sidebar!: SidebarComponent;
  hasStarted: boolean = false;
  errorMessage: string = '';
  hasCompleted: boolean = false;
  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }
  userId: string = '';
  assignedAssessmentId: string = '';
  confirmationData: any = {
    timeLimit: 0,
    questionCount: 0,
    totalPoints: 0,
    title: '',
    typeAss: 'assessment',
    dueDate: new Date(),
    status: 'scheduled',
    attempts: {
      current: 0,
      max: 1
    },
    instructor: {
      name: ''
    },
    student: {
      name: '',
      email: ''
    }
  };
  isAgreed: boolean = false;
  username: string = '';

  constructor(
    private api: StudentService,
    private auth: AuthService,
    private router: Router,
    private titleService: Title
  ) {
    this.titleService.setTitle('PRISM | Confirmation');
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.assignedAssessmentId = navigation.extras.state['assessmentId'];
      console.log('I received this id', this.assignedAssessmentId);
    }
  }

  ngOnInit(): void {
    if (!this.assignedAssessmentId) {
      console.error('No assessment ID provided');
      this.router.navigate(['/student/dashboard']);
      return;
    }

    this.auth.getCurrentUser().subscribe({
      next: (resp: any) => {
        if (resp && resp.id) {
          this.userId = resp.id;
          this.username = resp.name;
          this.getConfirmationData();
        } else {
          console.error('Invalid user response');
          this.router.navigate(['/login']);
        }
      },
      error: (err: any) => {
        console.error('Authentication error:', err);
        this.router.navigate(['/login']);
      },
    });
  }

  getConfirmationData() {
    const data = {
      assignedAssessmentId: this.assignedAssessmentId,
      studentId: this.userId,
    };

    this.api.getConfirmationData(data).subscribe({
      next: (resp: any) => {
        if (resp && resp.data) {
          this.confirmationData = resp.data;
          this.hasStarted = this.confirmationData.hasStarted;
          this.hasCompleted = this.confirmationData.hasSubmitted;
        } else {
          console.error('Invalid response format');
        }
      },
      error: (err) => {
        console.error('Error fetching confirmation data:', err);
      },
    });
  }

  cancel() {
    this.router.navigate(['/student/dashboard']);
  }

  toggleAgreement() {
    this.isAgreed = !this.isAgreed;
  }

  enter() {
    const data = {
      assignedAssessmentId: this.assignedAssessmentId,
      studentId: this.userId,
    };
    this.api.recordStartTime(data).subscribe({
      next: (resp: any) => {
        console.log('Successfully recorded start time', resp);
        console.log('assessment mode: ', this.confirmationData.typeAss);
        if (
          this.confirmationData.typeAss === 'assessment' ||
          this.confirmationData.typeAss === 'public'
        ) {
          this.router.navigate(['/student/assessment/take/normal'], {
            state: { assessmentId: this.assignedAssessmentId },
          });
        } else if (this.confirmationData.typeAss === 'mastery') {
          this.router.navigate(['/student/assessment/take'], {
            state: { assessmentId: this.assignedAssessmentId },
          });
        } else {
          console.error('Invalid assessment type');
          this.router.navigate(['/student/dashboard']);
        }
      },
      error: (err: any) => {
        console.error('Error recording start time:', err);
      },
    });
  }

  continue() {
    if (
      this.confirmationData.typeAss === 'assessment' ||
      this.confirmationData.typeAss === 'public'
    ) {
      this.router.navigate(['/student/assessment/take/normal'], {
        state: { assessmentId: this.assignedAssessmentId },
      });
    } else if (this.confirmationData.typeAss === 'mastery') {
      this.router.navigate(['/student/assessment/take'], {
        state: { assessmentId: this.assignedAssessmentId },
      });
    } else {
      console.error('Invalid assessment type');
      this.router.navigate(['/student/dashboard']);
    }
  }

  result() {
    this.router.navigate(['/student/assessment/result'], {
      state: { assessmentId: this.assignedAssessmentId },
    });
  }
}
