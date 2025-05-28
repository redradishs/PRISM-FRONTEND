import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

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
  alternateEmail?: string; // Added property
  bio?: string; // Added property
  isCoordinator: 'yes' | 'no'; // Update type to match backend
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

// Add this interface for tracking changes
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

@Component({
  selector: 'app-profile-inst',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './profile-inst.component.html',
  styleUrls: ['./profile-inst.component.css']
})
export class ProfileInstComponent implements OnInit {
  // Initialize all properties with default values
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
  
  // Password related properties with defaults
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

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());

    // Chain the API calls
    this.auth.getCurrentUser().subscribe((user) => {
      if (user) {
        this.userId = user.id;
        this.username = user.name;
        this.profilePicture = user.profilePicture;
        this.loadProfileData();
      }
    });
  }

  private loadProfileData(): void {
    // Load profile data first
    this.auth.getCurrentProfile(this.userId).subscribe({
      next: (resp: any) => {
        this.profile = { ...this.profile, ...resp.data }; // Merge with defaults
        this.originalProfile = { ...resp.data };
        
        // Then load teaching summary
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

    // Only make API call if there are changes
    if (Object.keys(changes).length > 0) {
        // Show loading state
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
    this.auth.logout();
  }

  toggleSidebar(): void {
    if(this.sidebar){
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
}
