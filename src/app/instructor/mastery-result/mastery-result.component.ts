import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mastery-result',
  imports: [SidebarComponent, CommonModule],
  templateUrl: './mastery-result.component.html',
  styleUrl: './mastery-result.component.css'
})
export class MasteryResultComponent {
  userId: string = '';
  username: string = '';
  profile: string = '';
  assignedAssessmentId: string = '';
  resultData: any;
  isLoading: boolean = true;

  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  constructor(private api: ApiService, private auth: AuthService, private router: Router, private titleService: Title) {
    this.titleService.setTitle('PRISM | Mastery Result');
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.assignedAssessmentId = navigation.extras.state['assessmentId']
      this.masteryResult(this.assignedAssessmentId);
    }
  }

  ngOnInit(): void {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile.bind(this));
    this.auth.getCurrentUser().subscribe((user) => {
      this.userId = user.id;
      this.username = user.name || '';
      this.profile = user.profilePicture || '';
    });
  }

  checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  masteryResult(id: string) {
    this.api.masteryResultData(this.assignedAssessmentId).subscribe({
      next: (resp: any) => {
        this.resultData = resp.data;
        this.isLoading = false;
      }, error: (err) => {
        console.error('There was a problem:', err.message)
      }
    })
  }

  createNewAssessment() {
    this.router.navigate(['/instructor/generate']);
  }

  addStudent() {
    this.router.navigate(['instructor/students']);
  }

  gotoSettings() {
    this.router.navigate(['instructor/result/settings'], {
      state: { assessmentId: this.assignedAssessmentId }
    });
  }

  getRelativeTime(dateString: string | null): string {
    if (!dateString) return 'Never';

    const dateUtc = new Date(dateString);

    const now = new Date();
    const nowPh = new Date(now.getTime() + (8 * 60 * 60 * 1000));

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

  gotoResult(s: any) {
    console.log("Student Data:", s)
    const assignedAssessmentId = this.assignedAssessmentId;
    const studentId = s.student._id
    if (s.attemptCount > 0) {
      this.router.navigate(['/instructor/response'], {
        state: { assessmentId: assignedAssessmentId, studentId: studentId }
      });
    } else {
      Swal.fire({
        title: 'No Submission',
        text: `${s.student.name} no attempt found`,
        icon: 'info',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1000,
        timerProgressBar: true,
        background: '#fff',
        iconColor: '#3b82f6'
      })
    }




  }
}
