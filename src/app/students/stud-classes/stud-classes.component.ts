import { Component, HostListener, ViewChild, OnInit } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { StudentService } from '../../services/student.service';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { distinctUntilChanged } from 'rxjs';

interface Class {
  id: number;
  code: string;
  name: string;
  instructor: string;
  schedule: string;
  status: string;
  progress: number;
  assessments: number;
  completed: number;
  color: string;
}

interface Application {
  id: number;
  code: string;
  name: string;
  instructor: string;
  dateApplied: string;
  status: string;
  reason?: string;
}

@Component({
  selector: 'app-stud-classes',
  imports: [SidebarComponent, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './stud-classes.component.html',
  styleUrl: './stud-classes.component.css'
})
export class StudClassesComponent implements OnInit {
  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  userId: string = '';
  username: string = '';
  profile: string = '';
  totalClasses: number = 0;
  pendingApplication: number = 0;

  page: number = 1;
  limit: number = 10;

  searchControl = new FormControl('');
  showJoinClassModal = false;






  activeTab = 'enrolled';
  searchQuery = '';
  classCode = '';
  viewMode: 'grid' | 'list' = 'grid';
  classes: any[] = [];

  pendingApplications: any[] = [];

  joinClassForm: FormGroup;

  readonly badgeColors = [
    '#8b5cf6', // violet
    '#6366f1', // blue
    '#10b981', // green
    '#f59e42', // orange
    '#f43f5e', // pink/red (optional, for more variety)
    '#06b6d4', // cyan (optional)
  ];

  constructor(private auth: AuthService, private api: StudentService, private titleService: Title, private fb: FormBuilder, private router: Router) {
    this.titleService.setTitle('PRISM | Classes');
    this.joinClassForm = this.fb.group({
      classCode: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.auth.getCurrentUser().subscribe(user => {
      this.userId = user.id;
      this.username = user.name;
      this.profile = user.profilePicture;
      this.getStats();
      this.enrolledClasses();
      this.pendingApplicationList();
    })
    const savedView = localStorage.getItem('classView');
    if (savedView) {
      this.viewMode = savedView as 'grid' | 'list';
    } else {
      this.viewMode = 'grid';
    }

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((value: string | null) => {
      if (value && value.length >= 2) {
        this.searchClasses();
      } else {
        this.enrolledClasses();
      }
    })
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
    localStorage.setItem('classView', mode);
  }

  setActiveTab(tab: 'enrolled' | 'pending') {
    this.activeTab = tab;
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  getStats() {
    this.api.classesStats(this.userId).subscribe({
      next: (resp: any) => {
        this.totalClasses = resp.data.accepted;
        this.pendingApplication = resp.data.pending;
      },
      error: (err: any) => {
        console.log(err);
      }
    })
  }

  getPerformanceColors(performance: number) {
    if (performance < 50) {
      return {
        bg: '#fee2e2', // light red
        color: '#dc2626', // red
      };
    } else if (performance <= 75) {
      return {
        bg: '#fef3c7', // light orange
        color: '#f59e42', // orange
      };
    } else {
      return {
        bg: '#d1fae5', // light green
        color: '#10b981', // green
      };
    }
  }

  enrolledClasses() {
    this.api.joinedClasses(this.userId, this.page, this.limit).subscribe({
      next: (resp: any) => {
        this.classes = resp.data.map((c: any, i: number) => {
          const perf = this.getPerformanceColors(c.performance);
          return {
            ...c,
            performanceBg: perf.bg,
            performanceColor: perf.color,
            color: this.getBadgeColor(i)
          };
        });
        console.log(this.classes);
      },
      error: (err: any) => {
        console.log(err);
      }
    })
  }

  pendingApplicationList() {
    this.api.pendingApplications(this.userId, this.page, this.limit).subscribe({
      next: (resp: any) => {
        this.pendingApplications = resp.data.result;
        console.log(this.pendingApplications);
      }, error: (err: any) => {
        console.log(err);
      }
    })
  }

  getBadgeColor(index: number): string {
    return this.badgeColors[index % this.badgeColors.length];
  }

  cancelApplication(application: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to cancel your application?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed) {
        const data = {
          "studentId": this.userId,
          "classCode": application.classCode
        }
        this.api.cancelApplication(data).subscribe({
          next: (resp: any) => {
            console.log(resp);
            Swal.fire({
              title: 'Success',
              text: 'Your application has been cancelled',
              icon: 'success',
              timer: 1500,
              toast: true,
              position: 'top-right'
            })
            this.pendingApplicationList();
            this.enrolledClasses();
            this.getStats();
          }
        })
      }
    })
  }

  exitClass(classObj: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to exit this class?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed) {
        const data = {
          "studentId": this.userId,
          "classCode": classObj.classCode
        }
        this.api.exitClass(data).subscribe({
          next: (resp: any) => {
            Swal.fire({
              title: 'Success',
              text: 'You have exited the class',
              icon: 'success',
              timer: 1500,
              toast: true,
              position: 'top-right'
            })
            this.enrolledClasses();
            this.getStats();
            this.pendingApplicationList();
          }
        })
      }
    })
  }

  searchClasses() {
    this.api.searchClasses(this.userId, this.searchControl.value || '', 1, 5).subscribe({
      next: (resp: any) => {
        this.classes = resp.data.result;
        console.log(this.classes);
      }, error: (err: any) => {
        console.log(err);
      }
    })
  }

  openJoinClassModal() {
    this.showJoinClassModal = true;
  }

  closeJoinClassModal() {
    this.showJoinClassModal = false;
    this.joinClassForm.reset();
  }

  goToClassDetails(classObj: any) {
    console.log(classObj);
    this.router.navigate(['/student/classes/details'], {
      state: { instructorId: classObj.instructor.id, classCode: classObj.classCode }
    })
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
          if (resp.remarks === "Success") {
            this.getStats();
            this.enrolledClasses();
            this.pendingApplicationList();
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
            this.joinClassForm.reset();
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

}
