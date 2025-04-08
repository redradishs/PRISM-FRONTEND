import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';


interface StudentProfile {
  id: string;
  name: string;
  email: string;
  role: 'student';
  avatarUrl?: string;
  phone?: string; // Added property
  alternateEmail?: string; // Added property
  dateJoined: string;
  lastActive: string;
  studentId: string;
  program: string;
  year: number;
  block: string;
  assessmentsTaken: number;
  averageScore: number;
  completionRate: number;
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

interface SubjectPerformance {
  id: string;
  name: string;
  score: number;
  completionRate: number;
}




@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  profile: StudentProfile;
  isEditing = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  activeTab = 'personal';
  isMobile = false;

  // Mock data
  private studentProfile: StudentProfile = {
    id: 'user-123',
    name: 'Frederick Anicas',
    email: '123456789@gordoncollege.edu.ph',
    role: 'student',
    avatarUrl: '/placeholder.svg?text=FA',
    phone: '+63 912 345 6789',
    dateJoined: 'September 1, 2023',
    lastActive: 'Today at 10:45 AM',
    studentId: '202210004',
    program: 'Bachelor of Science in Information Technology',
    year: 3,
    block: 'A',
    assessmentsTaken: 12,
    averageScore: 92,
    completionRate: 100,
    bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec gravida, sapien sed consectetur placerat, nisi neque faucibus velit, id cursus nisi neque vel neque. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Sed faucibus, diam in consectetur lobortis, lectus purus ullamcorper velit, at semper sapien est vel velit.',
  };

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

  constructor() {
    this.profile = this.studentProfile;
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
