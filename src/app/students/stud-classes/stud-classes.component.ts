import { Component, HostListener, ViewChild, OnInit } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Class {
  id: number;
  code: string;
  name: string;
  instructor: string;
  schedule: string;
  status: string;
  progress: number;
  assessments: number;
  completed: number;
  color: string;
}

interface Application {
  id: number;
  code: string;
  name: string;
  instructor: string;
  dateApplied: string;
  status: string;
  reason?: string;
}

@Component({
  selector: 'app-stud-classes',
  imports: [SidebarComponent, CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './stud-classes.component.html',
  styleUrl: './stud-classes.component.css'
})
export class StudClassesComponent implements OnInit {
  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  activeTab = 'enrolled';
  searchQuery = '';
  classCode = '';
  showSuccessAlert = false;
  showApplicationDialog = false;

  enrolledClasses: Class[] = [
    {
      id: 1,
      code: "CS401",
      name: "Advanced Programming Concepts",
      instructor: "Dr. Parker",
      schedule: "Mon, Wed 10:00 - 11:30 AM",
      status: "approved",
      progress: 75,
      assessments: 4,
      completed: 3,
      color: "blue"
    },
    // ... add other enrolled classes
  ];

  pendingApplications: Application[] = [
    {
      id: 1,
      code: "CS405",
      name: "Software Engineering",
      instructor: "Dr. Thompson",
      dateApplied: "Mar 5, 2025",
      status: "pending"
    },
    // ... add other pending applications
  ];

  get filteredEnrolled() {
    return this.enrolledClasses.filter(cls =>
      cls.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      cls.code.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get filteredPending() {
    return this.pendingApplications.filter(app =>
      app.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      app.code.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  handleApplyByCode() {
    if (this.classCode.trim()) {
      this.showApplicationDialog = true;
    }
  }

  handleSubmitApplication() {
    this.showApplicationDialog = false;
    this.classCode = '';
    this.showSuccessAlert = true;

    setTimeout(() => {
      this.showSuccessAlert = false;
    }, 5000);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  ngOnInit() {
    // Initialize component
  }
}
