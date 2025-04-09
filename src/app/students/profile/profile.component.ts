import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

interface StudentProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  studentId?: string;
  program?: string;
  year?: string;
  block?: string;
  bio?: string;
  phone?: string;
  avatarUrl?: string;
  assessmentsTaken: number;
  averageScore: number;
  completionRate: number;
}

interface Assessment {
  id: string;
  title: string;
  date: string;
  score?: number;
  status?: string;
  type?: string;
}

interface SubjectPerformance {
  id: string;
  name: string;
  score: number;
  completionRate: number;
}

interface ProfileChanges {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  program?: string;
  yearLevel?: string;
  block?: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profile: StudentProfile = {
    _id: '',
    name: '',
    email: '',
    role: 'student',
    createdAt: '',
    updatedAt: '',
    assessmentsTaken: 0,
    averageScore: 0,
    completionRate: 0
  };

  isLoading = true;
  isEditing = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  activeTab = 'personal';
  isMobile = false;

  //userprofile
  userId: string = '';
  private originalProfile: StudentProfile | null = null;

  recentAssessments: Assessment[] = [
    {
      id: '1',
      title: 'Midterm Exam: Advanced Programming Concepts',
      date: 'Mar 15, 2025',
      score: 92,
      status: 'completed',
    },
    {
      id: '2',
      title: 'Quiz: Database Design Principles',
      date: 'Mar 10, 2025',
      score: 88,
      status: 'completed',
    },
    {
      id: '3',
      title: 'Lab Exercise: Web Development',
      date: 'Mar 5, 2025',
      score: 95,
      status: 'completed',
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

  subjectPerformance: SubjectPerformance[] = [
    { id: '1', name: 'Programming', score: 95, completionRate: 100 },
    { id: '2', name: 'Database Systems', score: 88, completionRate: 95 },
    { id: '3', name: 'Web Development', score: 92, completionRate: 100 },
  ];

  // Password related properties
  passwordData: PasswordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(private api: ApiService, private auth: AuthService) {
  }

  ngOnInit(): void {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());

    this.auth.getCurrentUser().subscribe({
      next: (user) => {
        if (user?.id) {
          this.userId = user.id;
          this.loadProfile();
        } else {
          console.error('No user ID found');
        }
      },
      error: (error) => {
        console.error('Error getting current user:', error);
      }
    });
  }

  loadProfile(): void {
    this.isLoading = true;
    this.auth.getCurrentProfile(this.userId).subscribe({
      next: (resp: any) => {
        if (resp?.data) {
          this.profile = {
            ...this.profile,
            program: resp.data.program || '',
            year: resp.data.yearLevel || '',
            block: resp.data.block || '',
            ...resp.data
          };
          this.originalProfile = { ...this.profile };
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.profile = {
          ...this.profile,
          program: 'BSIT',
          year: '1',
          block: 'A'
        };
        this.isLoading = false;
      }
    });
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

    if (this.profile.program !== this.originalProfile.program) {
        changes.program = this.profile.program;
    }

    if (this.profile.year !== this.originalProfile.year) {
        changes.yearLevel = this.profile.year;
    }

    if (this.profile.block !== this.originalProfile.block) {
        changes.block = this.profile.block;
    }

    if (this.profile.bio !== this.originalProfile.bio) {
        changes.bio = this.profile.bio;
    }

    // Only make API call if there are changes
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
                    timer: 1500
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
        // Reset form
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
          text: error.response?.message || 'Failed to update password'
        });
      }
    });
  }

  logout(): void {
    this.auth.logout();
  }

  toggleSidebar(): void {
    console.log('Toggling sidebar');
  }
}
