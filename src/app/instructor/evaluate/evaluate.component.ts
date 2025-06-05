import { Component, HostListener, ViewChild, OnInit } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-evaluate',
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './evaluate.component.html',
  styleUrl: './evaluate.component.css'
})
export class EvaluateComponent implements OnInit {
  activeTab: string = 'skills';
  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  userId: string = '';
  username: string = '';
  profile: string = '';
  studentId: string = '';
  assessments: any[] = [];
  studentData: any = {};
  skillSet: any[] = [];
  filteredSkillSet: any[] = [];
  selectedSkillFilter: string = 'all';
  isLoadingSkills: boolean = false;
  
  
  constructor(private router: Router, private api: ApiService, private auth: AuthService, private title: Title) {
    this.title.setTitle('PRISM | Evaluate');
    const navigation = this.router.getCurrentNavigation();
    if(navigation?.extras?.state) {
      this.studentId = navigation.extras.state['studentId']
      this.getPastAssessments();
      this.getStudentData(this.studentId);
      this.getStudentSkills(this.studentId);
      console.log('User ID:', this.userId);
    }
  }

  ngOnInit(): void {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile.bind(this));
    this.auth.getCurrentUser().subscribe((user) => {
      this.userId = user.id;
      this.username = user.name || '';
      this.profile = user.profilePicture;
    });
  }

  getPastAssessments() {
    this.api.evaluateAssessmentHistory(this.studentId).subscribe({
      next: (resp: any) => {
        console.log('Past Assessments:', resp);
        this.assessments =  resp.data;
      },
      error: (error) => {
        console.error('Error fetching past assessments:', error);
      }
    })
  }

  getStudentData(id: string) {
    this.api.evaluateStudentData(this.studentId).subscribe({
      next: (resp: any) => {
        this.studentData = resp.data;
        console.log('Student Data:', this.studentData);
      },
      error: (error) => {
        console.error('Error fetching student data:', error);
      }
    })
  }

  getStudentSkills(id: string) {
    this.isLoadingSkills = true;
    this.api.studentSkillSet(this.studentId).subscribe({
      next: (resp: any) => {
        this.skillSet = resp.data?.skillsPerformance || [];
        this.filteredSkillSet = [...this.skillSet];
        this.isLoadingSkills = false;
        console.log('Student Skills:', this.skillSet);
      },
      error: (error) => {
        console.error('Error fetching student skills:', error);
        this.skillSet = [];
        this.filteredSkillSet = [];
        this.isLoadingSkills = false;
      }
    })
  }

  filterSkills(): void {
    switch (this.selectedSkillFilter) {
      case 'excellent':
        this.filteredSkillSet = this.skillSet.filter(skill => 
          (skill.percentage || 0) >= 76 && (skill.percentage || 0) <= 100
        );
        break;
      case 'good':
        this.filteredSkillSet = this.skillSet.filter(skill => 
          (skill.percentage || 0) >= 51 && (skill.percentage || 0) <= 75
        );
        break;
      case 'needs-improvement':
        this.filteredSkillSet = this.skillSet.filter(skill => 
          (skill.percentage || 0) >= 1 && (skill.percentage || 0) <= 50
        );
        break;
      case 'no-data':
        this.filteredSkillSet = this.skillSet.filter(skill => 
          (skill.percentage || 0) === 0
        );
        break;
      case 'all':
      default:
        this.filteredSkillSet = [...this.skillSet];
        break;
    }
  }

  get improvementSkills() {
    return this.skillSet.filter(skill => 
      (skill.percentage || 0) >= 1 && (skill.percentage || 0) <= 75
    ).sort((a, b) => (a.percentage || 0) - (b.percentage || 0)); 
  }

getRelativeTime(dateString: string): string {
  const dateUtc = new Date(dateString); 
  
  const now = new Date();
  const nowPh = new Date(now.getTime() + (8 * 60 * 60 * 1000)); 
  
  // console.log('Now PH:', nowPh.toISOString());
  // console.log('Date UTC:', dateUtc.toISOString());

  const diffInSeconds = Math.floor((nowPh.getTime() - dateUtc.getTime()) / 1000);

  if (diffInSeconds < 0) {
    return 'Just now'; 
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 30) {
    return dateUtc.toUTCString(); 
  } else if (diffInDays > 0) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  } else if (diffInHours > 0) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  } else if (diffInMinutes > 0) {
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
  } else {
    return 'Just now';
  }
}



  getStudentInitials(name: string): string {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  }

  assessmentDetails(i: any){
    console.log("This is the data:", i)
    this.router.navigate(['/instructor/response'], {
      state: {studentId: this.studentId, assessmentId: i._id, show: false}
    }); 
  }

  checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  createNewAssessment() {
    this.router.navigate(['/instructor/generate']);
  }

  addStudent() {
    this.router.navigate(['/instructor/students']);
  }
}
