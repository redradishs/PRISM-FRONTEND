import { Component, HostListener, ViewChild, OnInit } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { StudentService } from '../../services/student.service';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-stud-home',
  imports: [SidebarComponent, CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './stud-home.component.html',
  styleUrl: './stud-home.component.css'
})
export class StudHomeComponent implements OnInit {
  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  activeTab = 'upcoming';
  userId: string = '';
  username: string = '';
  totalUpcomingAssessments: number = 0;
  totalActiveAssessments: number = 0;
  totalClasses: number = 0;
  totalCompletedAssessments: number = 0;
  onGoingAssessments: any[] = [];
  upcomingAssessments: any[] = [];
  completedAssessments: any[] = [];
  dueThisWeek: number = 0;
  joinClassForm: FormGroup;
  joinAssessmentForm: FormGroup;
  showJoinClassModal = false;
  showJoinAssessmentModal = false;

  constructor(
    private auth: AuthService,
    private api: StudentService,
    private titleService: Title,
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.titleService.setTitle('PRISM | Dashboard');
    this.joinClassForm = this.fb.group({
      classCode: ['', [Validators.required]]
    });

    this.joinAssessmentForm = this.fb.group({
      assessmentCode: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe({
      next: (resp: any) => {
        this.userId = resp.id;
        this.username = resp.name;
        this.getStatistics(this.userId);
      },
      error: (err) => {
        console.log(err);
      }
    })
    
  }

  getStatistics(id: string) {
    this.api.getDashboardData(this.userId).subscribe({
      next: (resp: any) => {
        this.totalUpcomingAssessments = resp.data.stats.totalScheduled;
        this.totalActiveAssessments = resp.data.stats.totalOngoing;
        this.totalCompletedAssessments = resp.data.stats.totalCompleted;
        this.totalClasses = resp.data.stats.totalClasses;
        this.onGoingAssessments = resp.data.ongoing;
        this.dueThisWeek = this.getDueThisWeek(this.onGoingAssessments);
        this.upcomingAssessments = resp.data.scheduled;
        this.completedAssessments = resp.data.completed;
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  gotoAssessments(id: string) {
    const assessment = this.onGoingAssessments.find(a => a.assignedAssessmentId === id);
    if (assessment.hasSubmitted && !assessment.canRetake) {
      this.router.navigate(['/student/assessment/result'], {
        state: { assessmentId: id }
      });
    } else {
      this.router.navigate(['/student/confirmation'], {
        state: { assessmentId: id }
      });
    }
    console.log("I received this id", id);
  }

  gotoResult(id: string) {
    const assessment = this.completedAssessments.find(a => a.assignedAssessmentId === id);
    if (assessment && assessment.hasSubmitted) {
      this.router.navigate(['/student/assessment/result'], {
        state: { assessmentId: id }
      });
    } else {
      Swal.fire({
        title: 'No Submission',
        text: `You did not take ${assessment.title}`,
        icon: 'info',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1000,
        timerProgressBar: true,
        background: '#fff',
        iconColor: '#dc2626'
      });
    }
  }

  getDueThisWeek(assessments: any[]): number {
    const now = new Date();
  
    const day = now.getDay(); 
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
  
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
  
    const dueThisWeek = assessments.filter(assessment => {
      const dueDate = new Date(assessment.endDate);
      return dueDate >= startOfWeek && dueDate <= endOfWeek;
    });
  
    return dueThisWeek.length;
  }
  

  getStatusClass(assessment: any): string {
    if (assessment.hasSubmitted) {
      return 'status-result';
    }
    
    switch (assessment.attemptStatus.toLowerCase()) {
      case 'ongoing':
        return 'status-ongoing';
      case 'pending':
        return 'status-pending';
      case 'completed':
        return 'status-completed';
      default:
        return '';
    }
  }

  openJoinClassModal() {
    this.showJoinClassModal = true;
  }

  openJoinAssessmentModal() {
    this.showJoinAssessmentModal = true;
  }

  closeJoinClassModal() {
    this.showJoinClassModal = false;
    this.joinClassForm.reset();
  }

  closeJoinAssessmentModal() {
    this.showJoinAssessmentModal = false;
    this.joinAssessmentForm.reset();
  }

  onSubmitJoinClass() {
    if (this.joinClassForm.valid) {
      const data = {
        studentId: this.userId,
        classCode: this.joinClassForm.value.classCode
      }
      this.api.joinClass(data).subscribe({
        next: (resp: any) => {
          console.log(resp);
          if(resp.remarks === "Success") {
            this.getStatistics(this.userId);
            Swal.fire({
              title: 'Success',
              text: 'You have joined the class successfully',
              icon: 'success',
              toast: true,
              position: 'top-end',
              timer: 3000,
              timerProgressBar: true,
              showConfirmButton: false,
              background: '#fff',
              iconColor: '#10b981',
              color: '#1f2937',
              customClass: {
                popup: 'colored-toast',
                title: 'text-base font-semibold',
                htmlContainer: 'text-sm'
              }
            })
            this.closeJoinClassModal();
          } else if (resp.remarks === "Failed") {
            let errorMessage = resp.message;
            // Normalize error messages
            if (errorMessage === "Class is not open for Joining") {
              errorMessage = "Class is not open for joining";
            }
            
            Swal.fire({
              title: 'Error',
              text: errorMessage,
              icon: 'error',
              toast: true,
              position: 'top-end',
              timer: 3000,
              timerProgressBar: true,
              showConfirmButton: false,
              background: '#fff',
              iconColor: '#ef4444',
              color: '#1f2937',
              customClass: {
                popup: 'colored-toast',
                title: 'text-base font-semibold',
                htmlContainer: 'text-sm'
              }
            })
            this.closeJoinClassModal();
          }
        },
        error: (err) => {
          console.error('Error joining class:', err);
          Swal.fire({
            title: 'Error',
            text: 'An error occurred while joining the class',
            icon: 'error',
            toast: true,
            position: 'top-end',
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            background: '#fff',
            iconColor: '#ef4444',
            color: '#1f2937',
            customClass: {
              popup: 'colored-toast',
              title: 'text-base font-semibold',
              htmlContainer: 'text-sm'
            }
          })
        }
      })
    }
  }

  onSubmitJoinAssessment() {
    if (this.joinAssessmentForm.valid) {
      const studentId = this.userId;
      this.api.joinPublicAssessment(this.joinAssessmentForm.value.assessmentCode, studentId).subscribe({
        next: (resp: any) => {
          console.log(resp);
          if(resp.remarks === "Success") {
            this.getStatistics(this.userId);
            Swal.fire({
              title: 'Success',
              text: 'You have joined the assessment successfully',
              icon: 'success',
              toast: true,
              position: 'top-end',
              timer: 3000,
              timerProgressBar: true,
              showConfirmButton: false,
              background: '#fff',
              iconColor: '#10b981',
              color: '#1f2937',
              customClass: {
                popup: 'colored-toast',
                title: 'text-base font-semibold',
                htmlContainer: 'text-sm'
              }
            })
            this.closeJoinAssessmentModal();
          } else if(resp.remarks === "Failed") {
            let errorMessage = resp.message;
            if(errorMessage === "Assessment not found") {
              errorMessage = "The assessment you are trying to join does not exist";
            } else if(errorMessage === "This assessment has already ended") {
              errorMessage = "This assessment has already ended";
            } else if(errorMessage === "You have already joined this assessment") {
              errorMessage = "You have already joined this assessment";
            }
            
            Swal.fire({
              title: 'Error',
              text: errorMessage,
              icon: 'error',
              toast: true,
              position: 'top-end',
              timer: 3000,
              timerProgressBar: true,
              showConfirmButton: false,
              background: '#fff',
              iconColor: '#ef4444',
              color: '#1f2937',
              customClass: {
                popup: 'colored-toast',
                title: 'text-base font-semibold',
                htmlContainer: 'text-sm'
              }
            })
            this.closeJoinAssessmentModal();
          }
        },
        error: (err) => {
          console.error('Error joining assessment:', err);
          Swal.fire({
            title: 'Error',
            text: 'An error occurred while joining the assessment',
            icon: 'error',
            toast: true,
            position: 'top-end',
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            background: '#fff',
            iconColor: '#ef4444',
            color: '#1f2937',
            customClass: {
              popup: 'colored-toast',
              title: 'text-base font-semibold',
              htmlContainer: 'text-sm'
            }
          })
        }
      });
    }
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  onResize() {
    this.isMobile = window.innerWidth < 768;
  }
}
