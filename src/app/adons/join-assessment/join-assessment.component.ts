import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TitleService } from '../../services/title.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-join-assessment',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './join-assessment.component.html',
  styleUrl: './join-assessment.component.css'
})
export class JoinAssessmentComponent implements OnInit {

  joiningCode: string = '';
  assessmentDetails: any = null;
  canJoin: boolean = true;
  authenticated: boolean = true;
  role: string = '';
  userId: string = '';
  found: boolean = true;


  constructor(private api: AuthService, private studentAPI: StudentService, private title: TitleService, private router: Router, private route: ActivatedRoute) {
    this.title.setTitle('Join Assessment');
    this.joiningCode = this.route.snapshot.params['code'];

    console.log('Joining Code:', this.joiningCode);
  }

  ngOnInit(): void {
    console.log('PUBLIC ROUTE ACCESSED: Join Assessment');
    this.getAssessmentDetails();
    this.authenticated = this.api.isAuthenticated();
    // console.log('Authenticated:', this.authenticated);
    if (this.authenticated) {
      this.api.getCurrentUser().subscribe({
        next: (resp: any) => {
          this.userId = resp.id;
          this.role = resp.role;
          console.log('User ID:', this.userId);
        },
        error: (error: any) => {
          console.error(error);
        }
      });
    }
  }

  getAssessmentDetails() {
    const data = {
      joiningCode: this.joiningCode
    }
    this.api.getPublicAssessmentData(data).subscribe({
      next: (resp: any) => {
        if (resp.remarks === 'Success') {
          console.log(resp);
          this.assessmentDetails = resp.data;
          if (resp.data.status === 'completed') {
            this.canJoin = false;
            this.showCompletedMessage();
          }
        } else {
          this.found = false;
          this.showNotFoundMessage();
        }
      },
      error: (error: any) => {
        console.error(error);
        this.found = false;
        this.showNotFoundMessage();
      }
    })
  }

  joinAssessment() {
    if (!this.canJoin) {
      return;
    }
    if (!this.authenticated) {
      this.showNoSession();
      return;
    }
    if (this.role === 'instructor' || this.role === 'admin') {
      this.showCannotJoin();
      return;
    }
    const studentId = this.userId;
    this.studentAPI.joinPublicAssessment(this.joiningCode, studentId).subscribe({
      next: (resp: any) => {
        console.log(resp);
        Swal.fire({
          title: 'Success!',
          text: 'You have successfully joined the assessment.',
          icon: 'success',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          toast: true,
          position: 'top-end'
        }).then(() => {
          this.router.navigate(['/dashboard']);
        });
      },
      error: (error: any) => {
        console.error(error);
      }
    })
  }

  showCompletedMessage() {
    Swal.fire({
      title: 'Assessment Completed',
      text: 'You can no longer join this assessment.',
      icon: 'warning',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      toast: true,
      position: 'top-end'
    })
  }

  showCannotJoin() {
    Swal.fire({
      title: 'Cannot Join Assessment',
      text: 'Instructors are not allowed to Join Assessments.',
      icon: 'error',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      toast: true,
      position: 'top-end'
    })
  }


  showNoSession() {
    const redirectUrl = this.router.url;
    sessionStorage.setItem('redirectUrl', redirectUrl);
    Swal.fire({
      title: 'No Session Found',
      text: 'Redirecting to login page.',
      icon: 'info',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      toast: true,
      position: 'top-end'
    })
    setTimeout(() => {
      this.api.logout();
      this.router.navigate(['/login']);
    }, 3000);
  }

  showNotFoundMessage() {
    Swal.fire({
      title: 'Assessment Not Found',
      text: 'The Assessment Link or Code could not be found please ensure you have the right code.',
      icon: 'error',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    }).then(() => {
      this.router.navigate(['/dashboard']);
    });
  }

}
