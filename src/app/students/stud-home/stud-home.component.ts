import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stud-home',
  imports: [SidebarComponent, CommonModule],
  templateUrl: './stud-home.component.html',
  styleUrl: './stud-home.component.css'
})
export class StudHomeComponent {
 isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
    activeTab = 'upcoming';
  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
