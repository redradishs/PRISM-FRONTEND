import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TitleService } from '../../services/title.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-adm-systemsettings',
  imports: [CommonModule, SidebarComponent, FormsModule],
  templateUrl: './adm-systemsettings.component.html',
  styleUrl: './adm-systemsettings.component.css'
})
export class AdmSystemsettingsComponent {
  userId: string = '';
  username: string = '';
  profile: string = '';
  isMobile = window.innerWidth < 768;
  isLoading: boolean = false;
  selectedTab: string = 'Registration';

  // Security Settings
  sessionTimeout: number = 60;
  maxLoginAttempts: number = 5;
  lockoutDuration: number = 15;

  // Registration Settings
  studentRegistrationEnabled: boolean = true;
  instructorRegistrationEnabled: boolean = false;
  requireEmailVerification: boolean = true;
  defaultUserRole: string = 'student';
  enableSignup: boolean = true;

  // Maintenance Settings
  maintenanceModeEnabled: boolean = false;
  maintenanceMessage: string = '';

  // Platform Mess Settings
  platformMessageEnabled: boolean = false;
  platformMessage: string = '';
  platformMessageType: string = 'info';

  // AI Settings
  enableQuestionGeneration: boolean = true;
  enableStudentFeedback: boolean = true;
  maxAiUsagePerDay: number = 100;

  // Message System Settings
  messageTitle: string = '';
  messageContent: string = '';
  messageType: string = 'info';
  selectedRecipients: string = 'all';

  settingsId: string = '';

  // Additional properties 
  allowSharingAssessments: boolean = true;
  enableAnnouncements: boolean = true;
  autoArchiveAfter: string = '6months';

  platformMessageRecipients: string = 'all';

  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }



  constructor(private auth: AuthService, private api: AdminService, private title: TitleService) {
    this.title.setTitle('PRISM | System Settings');
  }


  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe(user => {
      this.userId = user.id,
        this.username = user.name,
        this.profile = user.profilePicture,
        this.retrieveSettings();
    })


  }
  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  selectTab(tabName: string) {
    this.selectedTab = tabName;
  }

  retrieveSettings() {
    this.isLoading = true;
    this.api.getSystemSettings().subscribe({
      next: (resp: any) => {
        console.log('Retrieved settings:', resp.data);
        const settings = resp.data;

        this.settingsId = settings._id;

        // Registration Settings
        this.studentRegistrationEnabled = settings.enableUserRegistration ?? true;
        this.instructorRegistrationEnabled = settings.enableInstructorRegistration ?? false;
        this.requireEmailVerification = settings.requireEmailVerification ?? true;
        this.defaultUserRole = settings.defaultUserRole || 'student';
        this.enableSignup = settings.enableSignup ?? true;

        // Security Settings
        this.sessionTimeout = settings.security?.sessionTimeoutMinutes ?? 60;
        this.maxLoginAttempts = settings.security?.maxLoginAttempts ?? 5;
        this.lockoutDuration = settings.security?.lockoutDurationMinutes ?? 15;

        // Maintenance Mode
        this.maintenanceModeEnabled = settings.maintenanceMode?.enabled ?? false;
        this.maintenanceMessage = settings.maintenanceMode?.message || '';

        // Platform Message
        this.platformMessageEnabled = settings.platformMessage?.enabled ?? false;
        this.platformMessage = settings.platformMessage?.message || '';
        this.platformMessageType = settings.platformMessage?.type || 'info';
        this.platformMessageRecipients = settings.platformMessage?.recipients || 'all';

        // AI Features
        this.enableQuestionGeneration = settings.aiFeatures?.enableQuestionGeneration ?? true;
        this.enableStudentFeedback = settings.aiFeatures?.enableStudentFeedback ?? true;
        this.maxAiUsagePerDay = settings.aiFeatures?.maxAiUsagePerUserPerDay ?? 100;

        // Additional settings (you may need to add these to your backend data)
        this.allowSharingAssessments = settings.allowSharingAssessments ?? true;
        this.enableAnnouncements = settings.enableAnnouncements ?? true;
        this.autoArchiveAfter = settings.autoArchiveAfter || '6months';

        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error retrieving settings:', error);
        this.isLoading = false;
        Swal.fire('Error!', 'Failed to retrieve settings. Please try again.', 'error');
      }
    });
  }

  resetSettings() {
    Swal.fire({
      title: 'Reset Settings?',
      text: 'Are you sure you want to reset all settings to their default values?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, reset!'
    }).then(confirm => {
      if (confirm.isConfirmed) {
        this.api.resetSettings().subscribe({
          next: (resp: any) => {
            Swal.fire('Settings reset!', 'All settings have been reset to their default values.', 'success');
          },
          error: (error: any) => {
            console.error('Error resetting settings:', error);
            Swal.fire('Error!', 'Failed to reset settings. Please try again.', 'error');
          }
        });
      }
    });
  }

  onToggleChange(type: string, event: any) {
    const isEnabled = event.target.checked;
    console.log(`${type} ${isEnabled ? 'enabled' : 'disabled'}`);

    switch (type) {
      case 'student':
        this.studentRegistrationEnabled = isEnabled;
        break;
      case 'instructor':
        this.instructorRegistrationEnabled = isEnabled;
        break;
      case 'emailVerification':
        this.requireEmailVerification = isEnabled;
        break;
      case 'signup':
        this.enableSignup = isEnabled;
        break;
      case 'maintenance':
        this.maintenanceModeEnabled = isEnabled;
        break;
      case 'platformMessage':
        this.platformMessageEnabled = isEnabled;
        break;
      case 'questionGeneration':
        this.enableQuestionGeneration = isEnabled;
        break;
      case 'studentFeedback':
        this.enableStudentFeedback = isEnabled;
        break;
      case 'shareAssessments':
        this.allowSharingAssessments = isEnabled;
        break;
      case 'announcements':
        this.enableAnnouncements = isEnabled;
        break;
    }
  }

  onRoleChange(event: any) {
    const selectedRole = event.target.value;
    this.defaultUserRole = selectedRole;
    console.log(`Default user role changed to: ${selectedRole}`);
  }

  onMessageTypeChange(event: any) {
    const selectedType = event.target.value;
    this.platformMessageType = selectedType;
    console.log(`Platform message type changed to: ${selectedType}`);
  }


  saveSettings() {
    this.isLoading = true;

    const settingsData = {
      enableUserRegistration: this.studentRegistrationEnabled,
      enableInstructorRegistration: this.instructorRegistrationEnabled,
      requireEmailVerification: this.requireEmailVerification,
      defaultUserRole: this.defaultUserRole,
      enableSignup: this.enableSignup,
      maintenanceMode: {
        enabled: this.maintenanceModeEnabled,
        message: this.maintenanceMessage
      },
      platformMessage: {
        enabled: this.platformMessageEnabled,
        message: this.platformMessage,
        type: this.platformMessageType,
        recipients: this.platformMessageRecipients
      },
      security: {
        sessionTimeoutMinutes: this.sessionTimeout,
        maxLoginAttempts: this.maxLoginAttempts,
        lockoutDurationMinutes: this.lockoutDuration
      },
      aiFeatures: {
        enableQuestionGeneration: this.enableQuestionGeneration,
        enableStudentFeedback: this.enableStudentFeedback,
        maxAiUsagePerUserPerDay: this.maxAiUsagePerDay
      }
    };

    this.api.updateSystemSettings(settingsData).subscribe({
      next: (resp: any) => {
        this.isLoading = false;
        Swal.fire({
          title: 'Settings saved!',
          text: 'System settings have been updated successfully.',
          icon: 'success',
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
          timer: 2000,
          timerProgressBar: true

        })
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error updating settings:', error);
        Swal.fire('Error!', 'Failed to update settings. Please try again.', 'error');
      }
    });
  }

  onRecipientsChange(event: any) {
    const selectedRecipients = event.target.value;
    this.selectedRecipients = selectedRecipients;
    console.log(`Recipients changed to: ${selectedRecipients}`);
  }

  sendMessage() {
    if (!this.messageTitle.trim() || !this.messageContent.trim()) {
      Swal.fire('Error', 'Please fill in both message title and content', 'error');
      return;
    }

    this.platformMessageEnabled = true;
    this.platformMessage = this.messageContent;
    this.platformMessageType = this.messageType;
    this.platformMessageRecipients = this.selectedRecipients;

    this.saveSettings();

    this.messageTitle = '';
    this.messageContent = '';
    this.messageType = 'info';
    this.selectedRecipients = 'all';
  }




}
