import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { StudentService } from '../../services/student.service';
import { TitleService } from '../../services/title.service';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-join-class',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './join-class.component.html',
  styleUrl: './join-class.component.css'
})
export class JoinClassComponent implements OnInit {

  classCode: string = '';
  classDetails: any = null;
  authenticated: boolean = true;
  role: string = '';
  userId: string = '';
  isAccepting: boolean = true;
  found: boolean = true;
  isLoading: boolean = true;


  constructor(private api: AuthService, private studentAPI: StudentService, private title: TitleService, private router: Router, private route: ActivatedRoute) {
    this.title.setTitle('Join Assessment');
    this.classCode = this.route.snapshot.params['code'];
    // console.log('Class Code:', this.classCode);
  }

  ngOnInit(): void {
    // console.log('PUBLIC ROUTE ACCESSED: Join Class');
    this.getClassDetails();
    this.authenticated = this.api.isAuthenticated();
    if (this.authenticated) {
      this.api.getCurrentUser().subscribe({
        next: (user: any) => {
          console.log('User:', user);
          this.userId = user.id;
          this.role = user.role;
        }, error: (err: any) => {
          console.error('Error:', err);
        }
      })
    }
  }

  getClassDetails() {
    const data = {
      classCode: this.classCode
    }
    this.api.getPublicClassData(data).subscribe({
      next: (resp: any) => {
        // console.log('Class Details:', resp);
        this.classDetails = resp.data;
        this.isAccepting = resp.data.allowJoining;
        this.isLoading = false;
        if (!this.isAccepting) {
          this.showNotAccepting();
        }
      }, error: (err: any) => {
        console.error('Error:', err);
        this.found = false;
        this.showNotFound();
      }
    })
  }

  joinClass() {
    if (!this.isAccepting) {
      this.showNotAccepting();
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
    const data = {
      studentId: this.userId,
      classCode: this.classCode
    }
    this.studentAPI.joinClass(data).subscribe({
      next: (resp: any) => {
        // console.log('Join Class Response:', resp);
        Swal.fire({
          title: 'Join Class Successful',
          text: 'You have joined the assessment.',
          icon: 'success',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          toast: true,
          position: 'top-end'
        }).then(() => {
          this.router.navigate(['/dashboard']);
        })
      }, error: (err: any) => {
        console.error('Error:', err);
      }
    })
  }

  showNotAccepting() {
    Swal.fire({
      title: 'Assessment Not Accepting',
      text: 'Instructor disabled the joining code.',
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
      title: 'Cannot Join Class',
      text: 'Instructors are not allowed to Join Classes.',
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

  showNotFound() {
    Swal.fire({
      title: 'Class Not Found',
      text: 'The Class Code provided is invalid.',
      icon: 'error',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      // toast: true,
      // position: 'top-end'
    }).then(() => {
      this.router.navigate(['/dashboard']);
    })
  }
}
