import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';

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

@Component({
  selector: 'app-profile-inst',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './profile-inst.component.html',
  styleUrls: ['./profile-inst.component.css']
})
export class ProfileInstComponent {
  profile: InstructorProfile;
  isEditing = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  activeTab = 'personal';
  isMobile = false;

  // Mock data
  private instructorProfile: InstructorProfile = {
    id: 'user-456',
    name: 'Prof. Asher James',
    email: 'asher.james@gordoncollege.edu.ph',
    role: 'instructor',
    avatarUrl: '/placeholder.svg?text=AJ',
    phone: '+63 912 345 6789',
    dateJoined: 'January 15, 2020',
    lastActive: 'Today at 11:30 AM',
    employeeId: 'EMP-2020-0123',
    department: 'College of Computer Studies',
    position: 'Assistant Professor',
    classesManaged: 3,
    assessmentsCreated: 15,
    totalStudents: 120,
    alternateEmail: '', // Initialize with empty string
    bio: '', // Initialize with empty string
  };

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

  constructor() {
    this.profile = this.instructorProfile;
  }

  ngOnInit(): void {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());
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
    // Handle saving personal info
    console.log('Saving personal info');
    this.isEditing = false;
  }

  updatePassword(): void {
    // Handle password update
    console.log('Updating password');
  }

  logout(): void {
    // Handle logout
    console.log('Logging out...');
  }

  toggleSidebar(): void {
    // Handle sidebar toggle
    console.log('Toggling sidebar');
  }
}
