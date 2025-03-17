import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../services/student.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-stud-confirmation',
  imports: [SidebarComponent, CommonModule],
  templateUrl: './stud-confirmation.component.html',
  styleUrl: './stud-confirmation.component.css'
})
export class StudConfirmationComponent {
  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
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
  confirmationData: any;
  isAgreed: boolean = false;


  constructor(private api: StudentService, private auth: AuthService, private router: Router){

    const navigation = this.router.getCurrentNavigation();
    if(navigation?.extras.state){
      this.assignedAssessmentId = navigation.extras.state['assessmentId']
      console.log("I received this id", this.assignedAssessmentId)
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
          this.getConfirmationData();
        } else {
          console.error('Invalid user response');
          this.router.navigate(['/login']);
        }
      },
      error: (err: any) => {
        console.error("Authentication error:", err);
        this.router.navigate(['/login']);
      }
    });
  }

  getConfirmationData() {
    const data = {
      assignedAssessmentId: this.assignedAssessmentId,
      studentId: this.userId
    };


    this.api.getConfirmationData(data).subscribe({
      next: (resp: any) => {
        if (resp && resp.data) {
          this.confirmationData = resp.data;
        } else {
          console.error("Invalid response format");
        }
      },
      error: (err) => {
        console.error("Error fetching confirmation data:", err);
      }
    });
  }

  cancel(){
    this.router.navigate(['/student/dashboard'])
  }

  toggleAgreement(){
    this.isAgreed = !this.isAgreed;
  }







}
