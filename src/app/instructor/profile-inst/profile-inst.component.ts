import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { TutorialService } from '../../services/tutorial.service';

interface InstructorProfile {
  id: string;
  name: string;
  email: string;
  role: 'instructor';
  avatarUrl?: string;
  phone?: string;
  dateJoined: string;
  lastActive: string;
  employeeId: string;
  department: string;
  position: string;
  classesManaged: number;
  assessmentsCreated: number;
  totalStudents: number;
  alternateEmail?: string;
  bio?: string;
  isCoordinator: 'yes' | 'no';
}

interface Assessment {
  id: string;
  title: string;
  date: string;
  score?: number;
  status?: string;
  type?: string;
}

interface ClassPerformance {
  id: string;
  name: string;
  students: number;
  avgScore: number;
  completionRate: number;
}

interface ProfileChanges {
  department?: string;
  position?: string;
  phone?: string;
  alternateEmail?: string;
  bio?: string;
  isCoordinator?: 'yes' | 'no';
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface LoginHistoryItem {
  loginDate: string;
  loginType: string;
  deviceType: string;
  browser: string;
  timeAgo: string;
}

interface LoginHistorySummary {
  totalLogins: number;
  lastLogin: string;
  deviceBreakdown: {
    [key: string]: number;
  };
  mostUsedDevice: string;
}

interface LoginHistoryData {
  loginHustory: LoginHistoryItem[];
  summary: LoginHistorySummary;
}

@Component({
  selector: 'app-profile-inst',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent, RouterLink],
  templateUrl: './profile-inst.component.html',
  styleUrls: ['./profile-inst.component.css']
})
export class ProfileInstComponent implements OnInit {
  profile: any = {
    name: '',
    email: '',
    role: '',
    avatarUrl: '',
    bio: '',
    department: '',
    position: '',
    isCoordinator: 'no',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  teachingSummary = {
    classCounts: 0,
    assessmentCounts: 0,
    studentCounts: 0,
  };

  userId: string = '';
  username: string = '';
  activeTab = 'personal';
  isMobile = false;
  profilePicture: string = '';
  isLoading: boolean = true;
  loginData: any;

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  passwordData: PasswordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  private originalProfile: InstructorProfile | null = null;

  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  recentAssessments: Assessment[] = [
    {
      id: '1',
      title: 'Midterm Exam: Advanced Programming Concepts',
      date: 'Mar 15, 2025',
      type: 'exam',
    },
    {
      id: '2',
      title: 'Quiz: Database Design Principles',
      date: 'Mar 10, 2025',
      type: 'quiz',
    },
    {
      id: '3',
      title: 'Lab Exercise: Web Development',
      date: 'Mar 5, 2025',
      type: 'lab',
    },
  ];

  upcomingAssessments: Assessment[] = [
    {
      id: '4',
      title: 'Final Exam: Advanced Programming Concepts',
      date: 'Apr 20, 2025',
      type: 'exam',
    },
    {
      id: '5',
      title: 'Project Submission: Mobile App Development',
      date: 'Apr 15, 2025',
      type: 'project',
    },
  ];

  classPerformance: ClassPerformance[] = [
    { id: '1', name: 'BSIT 3A', students: 40, avgScore: 92, completionRate: 100 },
    { id: '2', name: 'BSIT 3B', students: 35, avgScore: 85, completionRate: 95 },
    { id: '3', name: 'BSIT 3C', students: 45, avgScore: 88, completionRate: 90 },
  ];

  constructor(private api: ApiService, private auth: AuthService, private router: Router, private tutorialService: TutorialService) { }

  ngOnInit(): void {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());
    this.auth.getCurrentUser().subscribe((user) => {
      if (user) {
        this.userId = user.id;
        this.username = user.name;
        this.profilePicture = user.profilePicture;
        this.loadProfileData();
        this.loadHistory();
      }
    });
  }

  private loadProfileData(): void {
    this.auth.getCurrentProfile(this.userId).subscribe({
      next: (resp: any) => {
        this.profile = { ...this.profile, ...resp.data };
        this.originalProfile = { ...resp.data };
        this.isLoading = false;
        this.loadTeachingSummary();
      },
      error: (error) => {
        console.error('Error fetching profile:', error);
      }
    });
  }

  private loadTeachingSummary(): void {
    this.api.getTeachingSummary(this.userId).subscribe({
      next: (resp: any) => {
        this.teachingSummary = resp.data;
      },
      error: (error) => {
        console.error('Error fetching teaching summary:', error);
      }
    });
  }

  checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }
  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Update the save method
  savePersonalInfo(): void {
    if (!this.originalProfile || !this.profile) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Profile data is not available'
      });
      return;
    }

    const changes: ProfileChanges = {};

    if (this.profile.department !== undefined &&
      this.profile.department !== this.originalProfile.department) {
      changes.department = this.profile.department;
    }

    if (this.profile.position !== undefined &&
      this.profile.position !== this.originalProfile.position) {
      changes.position = this.profile.position;
    }

    if (this.profile.phone !== undefined &&
      this.profile.phone !== this.originalProfile.phone) {
      changes.phone = this.profile.phone;
    }

    if (this.profile.alternateEmail !== undefined &&
      this.profile.alternateEmail !== this.originalProfile.alternateEmail) {
      changes.alternateEmail = this.profile.alternateEmail;
    }

    if (this.profile.bio !== undefined &&
      this.profile.bio !== this.originalProfile.bio) {
      changes.bio = this.profile.bio;
    }

    if (this.profile.isCoordinator !== undefined &&
      this.profile.isCoordinator !== this.originalProfile.isCoordinator) {
      changes.isCoordinator = this.profile.isCoordinator || 'no';
    }

    if (Object.keys(changes).length > 0) {
      Swal.fire({
        title: 'Saving changes...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.auth.updateProfile(this.userId, changes).subscribe({
        next: (response) => {
          this.originalProfile = { ...this.profile };


          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Profile updated successfully',
            timer: 1500
          });
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          if (this.originalProfile) {
            this.profile = { ...this.originalProfile };
            this.profile.isCoordinator = this.originalProfile?.isCoordinator ?? 'no';
          }

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update profile. Please try again.'
          });
        }
      });
    } else {
      Swal.fire({
        icon: 'info',
        title: 'No Changes',
        text: 'No changes were made to save',
        timer: 1500
      });

    }
  }

  updatePassword(): void {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Password Mismatch',
        text: 'New password and confirmation do not match'
      });
      return;
    }

    Swal.fire({
      title: 'Updating password...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.auth.changePassword(this.userId, this.passwordData).subscribe({
      next: (response) => {
        this.passwordData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Password updated successfully',
          timer: 1500
        });
      },
      error: (error) => {
        console.error('Error updating password:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error.message || 'Failed to update password'
        });
      }
    });
  }

  logout(): void {
    Swal.fire({
      text: 'Are you sure you want to log out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      confirmButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.auth.logout();
      }
    });
  }

  private loadHistory() {
    this.auth.loginHistory(this.userId).subscribe({
      next: (resp: any) => {
        this.loginData = resp.data;
        // console.log('Login history:', this.loginData);
      }, error: (error) => {
        console.error('Error loading login history:', error);
      }
    })
  }

  get loginHistory(): LoginHistoryItem[] {
    return this.loginData?.loginHustory || [];
  }

  get loginSummary(): LoginHistorySummary | null {
    return this.loginData?.summary || null;
  }

  getBrowserIcon(browser: string): string {
    const browserLower = browser.toLowerCase();
    if (browserLower.includes('chrome')) return 'fab fa-chrome';
    if (browserLower.includes('firefox')) return 'fab fa-firefox-browser';
    if (browserLower.includes('safari')) return 'fab fa-safari';
    if (browserLower.includes('edge')) return 'fab fa-edge';
    if (browserLower.includes('opera')) return 'fab fa-opera';
    return 'fas fa-globe';
  }

  getDeviceIcon(deviceType: string): string {
    const deviceLower = deviceType.toLowerCase();
    if (deviceLower.includes('mobile')) return 'fas fa-mobile-alt';
    if (deviceLower.includes('tablet')) return 'fas fa-tablet-alt';
    if (deviceLower.includes('desktop')) return 'fas fa-desktop';
    return 'fas fa-laptop';
  }

  getLoginTypeDisplayName(loginType: string): string {
    switch (loginType) {
      case 'email_password':
        return 'Email & Password';
      case 'google':
        return 'Google OAuth';
      case 'github':
        return 'GitHub OAuth';
      default:
        return loginType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  trackByLoginDate(index: number, item: LoginHistoryItem): string {
    return item.loginDate;
  }


  toggleSidebar(): void {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  onCoordinatorToggle(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (this.profile) {
      this.profile.isCoordinator = checkbox.checked ? 'yes' : 'no';
      this.savePersonalInfo();
    }
  }

  getCoordinatorStatus(): string {
    if (!this.profile) return 'Not set';
    return this.profile.isCoordinator === 'yes' ?
      'Yes, I want to be a coordinator' :
      'No, not at this time';
  }

  getCoordinatorStatusLabel(): string {
    if (!this.profile) return 'Not Available';

    switch (this.profile.coordinatorStatus) {
      case 'PENDING':
        return 'Application Pending';
      case 'APPROVED':
        return 'Coordinator Active';
      case 'REJECTED':
        return 'Application Rejected';
      default:
        return this.profile.isCoordinator === 'yes' ?
          'Applied for Coordinator Position' :
          'Not Applied';
    }
  }

  getCoordinatorStatusMessage(): string {
    if (!this.profile) return '';

    switch (this.profile.coordinatorStatus) {
      case 'PENDING':
        return 'Your application is currently under review.';
      case 'APPROVED':
        return 'You are currently serving as a coordinator.';
      case 'REJECTED':
        return 'Your application was not approved. You may reapply after 30 days.';
      default:
        return this.profile.isCoordinator === 'yes' ?
          'Your request to become a coordinator has been submitted.' :
          'Toggle the switch to apply for a coordinator position.';
    }
  }

  getStatusClass(): string {
    if (!this.profile) return '';

    switch (this.profile.coordinatorStatus) {
      case 'PENDING':
        return 'status-pending';
      case 'APPROVED':
        return 'status-approved';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return '';
    }
  }

  onCoordinatorChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (this.profile) {
      this.profile.isCoordinator = select.value as 'yes' | 'no';
      this.savePersonalInfo();
    }
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  }

  startTutorial(): void {
    this.tutorialService.tutorialInitialize();
  }
}
