import { CommonModule } from '@angular/common';
import { Component, HostListener, ViewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StudentService } from '../../services/student.service';
export interface Assessment {
  id: string;
  title: string;
  subject: string;
  status: 'completed' | 'pending';
  score?: number;
  category: string;
  passingScore?: number;
  dateCompleted?: Date;
  dateAssigned?: Date;
  dueDate?: Date;
  timeLimit?: string;
  timeSpent?: string;
  questions?: number;
  rank?: number;
  totalStudents?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

@Component({
  selector: 'app-stud-classdetails',
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './stud-classdetails.component.html',
  styleUrls: ['./stud-classdetails.component.css']
})
export class StudClassDetailsComponent implements OnInit {
  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  activeTab: 'all' | 'completed' | 'pending' = 'all';
  searchQuery: string = '';
  assessments: Assessment[] = [];
  filteredAssessments: Assessment[] = [];
  username: string = '';
  profile: string = '';
  userId: string = '';
  classCode: string = '';
  instructorId: string = '';
  completedAssessments: any[] = [];
  upcomingAssessments: any[] = [];
  studentStats: any = {};
  filteredCompletedAssessments: any[] = [];
  filteredUpcomingAssessments: any[] = [];
  imageLoadFailed = false;
  loaded = false;


  constructor(private router: Router, private auth: AuthService, private api: StudentService) {
    const navigation = this.router.getCurrentNavigation();
    if(navigation?.extras?.state) {
      this.instructorId = navigation.extras.state['instructorId']
      this.classCode = navigation.extras.state['classCode']
      console.log('Instructor ID:', this.instructorId);
      console.log('Class Code:', this.classCode);
      
      // if (!this.studentId || !this.classCode) {
      //   this.router.navigate(['/instructor/students']);
      // }
    } else {
      // this.router.navigate(['/students/classes']);
    }
  }

  ngOnInit() {
    this.auth.getCurrentUser().subscribe(user => {
      this.userId = user.id;
      this.username = user.name;
      this.profile = user.profilePicture;
      console.log('User ID:', this.userId);
      this.studentData();
      this.completedList();
      this.upcomingList();  
    })
  }

  loadAssessments() {
    this.assessments = [
      ...(this.completedAssessments || []).map(i => ({
        ...i,
        status: 'completed'
      })),
      ...(this.upcomingAssessments || []).map(i => ({
        ...i,
        status: i.status
      }))
    ]
    console.log('Assessments:', this.assessments);
    this.filterAssessments();
  }

  goToAssessment(assessment: any) {
    window.scrollTo({top: 0, behavior: 'smooth'});
    this.router.navigate(['/student/confirmation'], {
      state: { assessmentId: assessment._id }
    });
  }

  filterAssessments() {
    // Create a combined filtered list
    const filtered = this.assessments.filter(assessment => {
      const matchesSearch = !this.searchQuery || 
        assessment.title?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        assessment.category?.toLowerCase().includes(this.searchQuery.toLowerCase());
  
      const matchesTab = this.activeTab === 'all' || 
        (this.activeTab === 'completed' && assessment.status === 'completed') ||
        (this.activeTab === 'pending' && assessment.status !== 'completed');
  
      return matchesSearch && matchesTab;
    });
    
    // Update the separate lists for display
    this.filteredCompletedAssessments = filtered.filter(a => a.status === 'completed');
    this.filteredUpcomingAssessments = filtered.filter(a => a.status !== 'completed');
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  studentData() {
    this.api.historyAll(this.instructorId, this.classCode, this.userId).subscribe({
      next: (resp: any) => {
        this.studentStats = resp.data;
        console.log('Student Stats:', this.studentStats);
      }, error: (error: any) => {
        console.error('Error retrieving student data:', error);
      }
    })
  }

  completedList() {
    this.api.historyCompleted(this.instructorId, this.classCode, this.userId).subscribe({
      next: (resp: any) => {
        this.completedAssessments = resp.data.completedAssessments;
        this.loadAssessments();
        this.loaded = true;
        console.log('Completed assessments:', this.completedAssessments);
      }, error: (error: any) => {
        console.error('Error retrieving completed assessments:', error);
      }
    })
  }

  upcomingList() {
    this.api.historyUpcoming(this.instructorId, this.classCode, this.userId).subscribe({
      next: (resp: any) => {
        this.upcomingAssessments = resp.data;
        this.loadAssessments();  
        console.log('Upcoming assessments:', this.upcomingAssessments);
      }, error: (error: any) => {
        console.error('Error retrieving completed assessments:', error);
      }
    })
  }

  getNameInitials(fullName: string | undefined): string {
    if (!fullName) return '';
    const nameParts = fullName.split(' ');
    const firstInitial = nameParts[0].charAt(0);
    const lastInitial = nameParts.length > 1 ? 
      nameParts[nameParts.length - 1].charAt(0) : '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  formatTimeSpent(seconds: number): string {
    if (!seconds) return '0 minutes';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds} seconds`;
    } else if (remainingSeconds === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} min${minutes !== 1 ? 's' : ''} ${remainingSeconds} sec${remainingSeconds !== 1 ? 's' : ''}`;
    }
  }

  setActiveTab(tab: 'all' | 'completed' | 'pending') {
    this.activeTab = tab;
    this.filterAssessments();
  }

  viewResponse(id: string) {
    this.router.navigate(['/student/assessment/result'], {
      state: { assessmentId: id}
    });

  }

  getAssessmentTypeColor(assessment: any): string {
    switch (assessment.type) {
      case 'Mastery':
        return 'amber';
      case 'Public Assessment':
        return 'blue';
      default:
        return 'indigo';
    }
  }

  getAssessmentTypeIcon(assessment: any): string {
    switch (assessment.type) {
      case 'Mastery':
        return 'fa-trophy';
      case 'Public Assessment':
        return 'fa-globe';
      default:
        return 'fa-clipboard-check';
    }
  }

  round(value: number): number {
    return Math.round(value);
  }
}
