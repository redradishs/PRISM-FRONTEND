import { Component } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  isEditing = false;
  activeTab = 'overview';
  COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#FF0000"];

  instructorData = {
    name: "Dr. Sarah Smith",
    email: "sarah.smith@example.com",
    employeeId: "E67890",
    department: "Computer Science",
    position: "Associate Professor",
    officeHours: "Mon, Wed 2-4 PM",
    avatarUrl: "https://i.pravatar.cc/150?img=47",
    courses: [
      { code: "CS301", name: "Data Structures", students: 45 },
      { code: "CS302", name: "Algorithms", students: 40 },
      { code: "CS401", name: "Machine Learning", students: 35 },
    ],
    publications: [
      { title: "Advances in AI-driven Education", year: 2023, journal: "Journal of Educational Technology" },
      { title: "Machine Learning Applications in Assessment", year: 2022, journal: "AI in Education" },
      { title: "Personalized Learning Paths using Neural Networks", year: 2021, journal: "Intelligent Tutoring Systems" },
    ],
    researchInterests: ["Artificial Intelligence", "Educational Technology", "Machine Learning"],
    gradeDistribution: [
      { name: "A", value: 30 },
      { name: "B", value: 40 },
      { name: "C", value: 20 },
      { name: "D", value: 8 },
      { name: "F", value: 2 },
    ],
  };

  constructor() {}

  ngOnInit(): void {}

  handleSave(): void {
    this.isEditing = false;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}