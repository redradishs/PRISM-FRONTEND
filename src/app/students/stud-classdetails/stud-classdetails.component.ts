import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';

interface ClassData {
  id: number;
  code: string;
  name: string;
  instructor: string;
  schedule: string;
  location: string;
  status: string;
  progress: number;
  description: string;
  color: string;
  syllabus: string;
  announcements: Announcement[];
  resources: Resource[];
  assessments: Assessment[];
}

interface Announcement {
  id: number;
  date: string;
  title: string;
  content: string;
}

interface Resource {
  id: number;
  type: string;
  title: string;
  date: string;
  file?: string;
  url?: string;
}

interface Assessment {
  id: number;
  title: string;
  dueDate: string;
  status: string;
  score?: string;
  progress?: number;
}

@Component({
  selector: 'app-stud-classdetails',
  imports: [SidebarComponent, CommonModule],
  templateUrl: './stud-classdetails.component.html',
  styleUrls: ['./stud-classdetails.component.css']
})
export class StudClassDetailsComponent implements OnInit {
  activeTab = 'announcements';
  classData!: ClassData;
  isMobile = window.innerWidth <= 768;
  showSidebar = false;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.showSidebar = false;
    }
  }

  constructor(private route: ActivatedRoute, private titleService: Title) {
    this.titleService.setTitle('PRISM | Classes');
    this.classData = {
      id: 1,
      code: "CS401",
      name: "Advanced Programming Concepts",
      instructor: "Dr. Parker",
      schedule: "Mon, Wed 10:00 - 11:30 AM",
      location: "Science Building, Room 305",
      status: "active",
      progress: 75,
      description: "This course covers advanced programming concepts including design patterns, concurrent programming, and modern software development practices.",
      color: "blue",
      syllabus: "syllabus.pdf",
      announcements: [
        {
          id: 1,
          date: "Mar 5, 2025",
          title: "Midterm Project Guidelines",
          content: "The midterm project guidelines have been posted. Please review them carefully and start planning your project. Office hours will be extended next week to help with any questions."
        },
        {
          id: 2,
          date: "Mar 2, 2025",
          title: "Week 8 Materials Posted",
          content: "The lecture slides and code examples for Week 8 are now available in the Materials section. Make sure to review them before Wednesday's class."
        },
        {
          id: 3,
          date: "Feb 25, 2025",
          title: "Assignment 1 Grades",
          content: "Assignment 1 grades have been posted. The class average was 85%. If you have any questions about your grade, please come to office hours or send me an email."
        }
      ],
      resources: [
        {
          id: 1,
          type: "lecture",
          title: "Design Patterns Introduction",
          date: "Feb 28, 2025",
          file: "design-patterns.pdf"
        },
        {
          id: 2,
          type: "code",
          title: "Factory Pattern Examples",
          date: "Feb 28, 2025",
          file: "factory-examples.zip"
        }
      ],
      assessments: [
        {
          id: 1,
          title: "Quiz 1: OOP Principles",
          dueDate: "Feb 15, 2025",
          status: "completed",
          score: "92%"
        },
        {
          id: 2,
          title: "Assignment 1: Design Patterns",
          dueDate: "Feb 25, 2025",
          status: "completed",
          score: "88%"
        },
        {
          id: 3,
          title: "Midterm Project",
          dueDate: "Mar 20, 2025",
          status: "in-progress",
          progress: 40
        }
      ]
    };
  }

  ngOnInit() {
    // Get class ID from route and fetch data
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700';
      case 'in-progress': return 'bg-blue-50 text-blue-700';
      default: return 'bg-amber-50 text-amber-700';
    }
  }

  getResourceTypeClass(type: string): string {
    switch (type) {
      case 'lecture': return 'bg-blue-50 text-blue-700';
      case 'code': return 'bg-green-50 text-green-700';
      case 'video': return 'bg-purple-50 text-purple-700';
      case 'link': return 'bg-amber-50 text-amber-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  }

  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }
}
