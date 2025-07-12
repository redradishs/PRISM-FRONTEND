import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TitleService } from '../../services/title.service';

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
  isLoading: boolean = false; //dfg to change
  selectedTab: string = 'Registration';
  sessionTimeout: number = 60;
  maxLoginAttempts: number = 5;

  studentRegistrationEnabled: boolean = true;
  instructorRegistrationEnabled: boolean = false;
  defaultUserRole: string = 'Student';

  messageTitle: string = '';
  messageContent: string = '';
  selectedRecipients: string = 'All';

  maxAiUsagePerDay: number = 10;

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
        this.profile = user.profilePicture
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

  onToggleChange(type: string, event: any) {
    const isEnabled = event.target.checked;
    console.log(`${type} registration ${isEnabled ? 'enabled' : 'disabled'}`);

    if (type === 'student') {
      this.studentRegistrationEnabled = isEnabled;
    } else if (type === 'instructor') {
      this.instructorRegistrationEnabled = isEnabled;
    }

  }

  onRoleChange(event: any) {
    const selectedRole = event.target.value;
    this.defaultUserRole = selectedRole;
    console.log(`Default user role changed to: ${selectedRole}`);

  }

  onRecipientsChange(event: any) {
    const selectedRecipients = event.target.value;
    this.selectedRecipients = selectedRecipients;
    console.log(`Recipients changed to: ${selectedRecipients}`);
  }

  sendMessage() {
    if (!this.messageTitle.trim() || !this.messageContent.trim()) {
      alert('Please fill in both message title and content');
      return;
    }

    console.log('Sending message:', {
      title: this.messageTitle,
      content: this.messageContent,
      recipients: this.selectedRecipients
    });

    this.messageTitle = '';
    this.messageContent = '';
    this.selectedRecipients = 'All';

    alert('Message sent successfully!');
  }


}
