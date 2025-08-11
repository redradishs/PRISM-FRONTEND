import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { TimePeriodRuleType } from 'exceljs';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { StudentService } from '../../services/student.service';


@Component({
  selector: 'app-archive',
  imports: [CommonModule, FormsModule, SidebarComponent, ReactiveFormsModule],
  templateUrl: './archive.component.html',
  styleUrl: './archive.component.css'
})
export class ArchiveComponent {

  userId: string = '';
  username: string = '';
  profile: string = '';
  isMobile = window.innerWidth < 768; isLoading: boolean = false; //dfg to change @ViewChild(SidebarComponent) sidebar!:
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  @HostListener('window:resize') onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  totalClasses: number = 0;
  pendingApplication: number = 0;

  page: number = 1;
  limit: number = 10;
  totalPages: number = 0;
  hasNextPage: boolean = false;
  hasPreviousPage: boolean = false;

  searchControl = new FormControl('');
  showJoinClassModal = false;






  activeTab = 'classes';
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

  constructor(private auth: AuthService, private api: StudentService, private titleService: Title, private fb: FormBuilder, private router: Router,
    private inst: ApiService
  ) {
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
      this.getArchivedClasses(); // Get archived classes
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
      }
    })
  }

  setActiveTab(tab: 'classes' | 'assessments') {
    this.activeTab = tab;
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  getStats() {
    const data = {
      instructorId: this.userId
    }
    this.inst.archivesData(data).subscribe({
      next: (resp: any) => {
        this.totalClasses = resp.data.archivedClasses;
        this.pendingApplication = resp.data.archivedAssessments;
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

  pendingApplicationList() {
    this.api.pendingApplications(this.userId, this.page, this.limit).subscribe({
      next: (resp: any) => {
        this.pendingApplications = resp.data.result;
      }, error: (err: any) => {
        console.log(err);
      }
    })
  }

  getBadgeColor(index: number): string {
    return this.badgeColors[index % this.badgeColors.length];
  }



  unarchiveClass(classData: any) {
    console.log(classData);
    const data = {
      instructorId: this.userId,
    }
    Swal.fire({
      title: 'Unarchive Class?',
      text: 'Are you sure you want to unarchive this class?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Unarchive!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.inst.unarchiveClass(classData.classCode, data).subscribe({
          next: (resp: any) => {
            this.getStats();
            // this.pendingApplicationList();
            this.getArchivedClasses();
          }, error: (err: any) => {
            console.error(err);
            Swal.fire({
              title: 'Error',
              text: 'An error occurred while unarchiving the class',
              icon: 'error',
              timer: 1500,
              toast: true,
              position: 'top-right'
            })
          }
        })
      }
    });
  }

  getArchivedClasses() {
    this.inst.getArchiveClasses(this.userId, { page: this.page, limit: this.limit }).subscribe({
      next: (resp: any) => {
        this.classes = resp.data.data.map((c: any, i: number) => ({
          ...c,
          color: this.getBadgeColor(i)
        }));
        this.totalPages = resp.data.total;
        this.hasNextPage = resp.data.hasNext;
        this.hasPreviousPage = resp.data.hasPrev;
      },
      error: (err: any) => {
        console.log('Error fetching archived classes:', err);
      }
    });
  }

  searchClasses() {
    this.api.searchClasses(this.userId, this.searchControl.value || '', 1, 5).subscribe({
      next: (resp: any) => {
        this.classes = resp.data.result;
        // console.log(this.classes);
      }, error: (err: any) => {
        console.log(err);
      }
    })
  }






}
