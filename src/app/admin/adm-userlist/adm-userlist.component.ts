import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-adm-userlist',
  imports: [CommonModule, SidebarComponent, RouterLink],
  templateUrl: './adm-userlist.component.html',
  styleUrl: './adm-userlist.component.css'
})
export class AdmUserlistComponent {
  userId: string = '';
  username: string = '';
  profile: string = '';
  isMobile = window.innerWidth < 768;
  isLoading: boolean = false; //dfg to change
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;


  students = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@student.gc.edu.ph',
      role: 'Student',
      program: 'bsit',
      yearLevel: '3',
      classesJoined: 5,
      classesCreated: 0,
      assessmentsTaken: 12,
      assessmentsCreated: 0,
      averageScore: 85,
      isVerified: true,
      showDropdown: false
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@student.gc.edu.ph',
      role: 'Student',
      program: 'bscs',
      yearLevel: '2',
      classesJoined: 4,
      classesCreated: 0,
      assessmentsTaken: 8,
      assessmentsCreated: 0,
      averageScore: 72,
      isVerified: true,
      showDropdown: false
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@student.gc.edu.ph',
      role: 'Student',
      program: 'bsis',
      yearLevel: '4',
      classesJoined: 6,
      classesCreated: 0,
      assessmentsTaken: 15,
      assessmentsCreated: 0,
      averageScore: 91,
      isVerified: false,
      showDropdown: false
    },
    {
      id: 4,
      name: 'Dr. Sarah Wilson',
      email: 'sarah.wilson@instructor.gc.edu.ph',
      role: 'Instructor',
      program: 'bsit',
      yearLevel: null,
      classesJoined: 0,
      classesCreated: 3,
      assessmentsTaken: 0,
      assessmentsCreated: 25,
      averageScore: 0,
      isVerified: true,
      showDropdown: false
    },
    {
      id: 5,
      name: 'David Brown',
      email: 'david.brown@student.gc.edu.ph',
      role: 'Student',
      program: null,
      yearLevel: null,
      classesJoined: 0,
      classesCreated: 0,
      assessmentsTaken: 0,
      assessmentsCreated: 0,
      averageScore: 0,
      isVerified: false,
      showDropdown: false
    },
    {
      id: 6,
      name: 'Emily Davis',
      email: 'emily.davis@student.gc.edu.ph',
      role: 'Student',
      program: 'bscs',
      yearLevel: '3',
      classesJoined: 5,
      classesCreated: 0,
      assessmentsTaken: 11,
      assessmentsCreated: 0,
      averageScore: 78,
      isVerified: true,
      showDropdown: false
    },
    {
      id: 7,
      name: 'Prof. Chris Martinez',
      email: 'chris.martinez@instructor.gc.edu.ph',
      role: 'Instructor',
      program: 'bsis',
      yearLevel: null,
      classesJoined: 0,
      classesCreated: 2,
      assessmentsTaken: 0,
      assessmentsCreated: 18,
      averageScore: 0,
      isVerified: true,
      showDropdown: false
    },
    {
      id: 8,
      name: 'Lisa Anderson',
      email: 'lisa.anderson@student.gc.edu.ph',
      role: 'Student',
      program: 'bsit',
      yearLevel: '4',
      classesJoined: 7,
      classesCreated: 0,
      assessmentsTaken: 18,
      assessmentsCreated: 0,
      averageScore: 94,
      isVerified: true,
      showDropdown: false
    }
  ];
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {

    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.students.forEach(student => {
        student.showDropdown = false;
      });
    }
  }



  constructor(private auth: AuthService, private api: AdminService) {
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

  trackByStudentId(index: number, student: any): number {
    return student.id;
  }

  toggleDropdown(studentId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    this.students.forEach(student => {
      if (student.id !== studentId) {
        student.showDropdown = false;
      }
    });

    const student = this.students.find(s => s.id === studentId);
    if (student) {
      student.showDropdown = !student.showDropdown;
    }
  }

  onActionClick(action: string, studentId: number, event: Event) {
    event.stopPropagation();

    const student = this.students.find(s => s.id === studentId);
    if (student) {
      student.showDropdown = false;
    }

    console.log(`Action: ${action} for student ID: ${studentId}`);

    switch (action) {
      case 'view-profile':
        break;
      case 'reset-password':
        break;
      case 'view-logs':
        break;
      case 'suspend':
        break;
      case 'delete':
        break;
    }
  }


}
