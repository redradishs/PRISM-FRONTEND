import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';



interface StudentProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  bio?: string;
  phone?: string;
  avatarUrl?: string;
}



interface ProfileChanges {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
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
  selector: 'app-adm-profile',
  imports: [CommonModule, SidebarComponent, ReactiveFormsModule, FormsModule],
  templateUrl: './adm-profile.component.html',
  styleUrl: './adm-profile.component.css'
})
export class AdmProfileComponent {
  profile: StudentProfile = {
    _id: '',
    name: '',
    email: '',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bio: '',
    phone: '',
    avatarUrl: ''
  };

  isLoading = true;
  isEditing = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  activeTab = 'personal';
  isMobile = false;
  loginData: LoginHistoryData | null = null;
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  userId: string = '';
  profilePicture: string = '';
  username: string = '';
  private originalProfile: StudentProfile | null = null;

  // Password related properties
  passwordData: PasswordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

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

  constructor(private api: AdminService, private auth: AuthService, private router: Router) {
  }

  ngOnInit(): void {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());

    this.auth.getCurrentUser().subscribe({
      next: (user) => {
        if (user?.id) {
          this.userId = user.id;
          this.username = user.name;
          this.profilePicture = user.profilePicture;
          this.loadProfileData();
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error getting current user:', error);
        if (!this.router.url.includes('/login')) {
          this.handleError('Failed to load user data');
        }
        this.isLoading = false;
      }
    });
  }

  private loadProfileData(): void {
    this.isLoading = true;

    this.auth.getCurrentProfile(this.userId).subscribe({
      next: (resp: any) => {
        if (resp?.data) {
          this.profile = {
            ...this.profile,
            ...resp.data
          };
          this.originalProfile = { ...this.profile };
        }
        this.loadHistory();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.handleError('Failed to load profile data');
        this.isLoading = false;
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



  private handleError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message
    });
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

  checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

  toggleEditing(): void {
    this.isEditing = !this.isEditing;
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

  savePersonalInfo(): void {
    if (!this.originalProfile || !this.profile) {
      this.handleError('Profile data is not available');
      return;
    }

    const changes: ProfileChanges = {};

    if (this.profile.bio !== this.originalProfile.bio) {
      changes.bio = this.profile.bio;
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
          this.isEditing = false;

          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Profile updated successfully',
            timer: 1500,
            toast: true,
            position: 'top-end',
            timerProgressBar: true,
            showConfirmButton: false,
            background: '#fff',
            iconColor: '#10b981',
            color: '#1f2937'
          });
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          if (this.originalProfile) {
            this.profile = { ...this.originalProfile };
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
      this.isEditing = false;
    }
  }

  updatePassword(): void {
    if (!this.passwordData.currentPassword || !this.passwordData.newPassword || !this.passwordData.confirmPassword) {
      this.handleError('All password fields are required');
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.handleError('New passwords do not match');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(this.passwordData.newPassword)) {
      this.handleError('Password does not meet requirements');
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
      next: () => {
        this.passwordData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Password updated successfully',
          timer: 1500,
          toast: true,
          position: 'top-end',
          timerProgressBar: true,
          showConfirmButton: false,
          background: '#fff',
          iconColor: '#10b981',
          color: '#1f2937'
        });
      },
      error: (error) => {
        console.error('Error updating password:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.message || 'Failed to update password'
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

  toggleSidebar(): void {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  goHome(): void {
    this.router.navigate(['/student/dashboard']);
  }

  ngOnDestroy(): void {
  }
}
