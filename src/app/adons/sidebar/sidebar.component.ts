import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  isExpanded = false;
  selectedTab = 'home';
  isMobile = false;
  private resizeListener: () => void = () => {};
  username: string = '';

  constructor(private auth: AuthService, private router: Router){
    this.auth.getCurrentUser().subscribe((user) => {
      this.username = user.name;
    })
  }

  navItems = [
    { icon: 'fas fa-home', label: 'Home', id: 'home', route: '/instructor/dashboard' },
    { icon: 'fas fa-users', label: 'Students', id: 'students', route: '/instructor/students' },
    { icon: 'fas fa-tasks', label: 'Assessment', id: 'assessment', route: '/instructor/assessment' },
    { icon: 'fas fa-book', label: 'Resources', id: 'resources', route: '/instructor/resources' },
    { icon: 'fas fa-user', label: 'Profile', id: 'profile', route: '/instructor/profile' }
  ];

  ngOnInit() {
    this.checkMobile();
    this.resizeListener = () => this.checkMobile();
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener);
  }

  navigateTo(route: string, id: string) {
    this.selectedTab = id;
    this.router.navigate([route]);
    this.isExpanded = false;
    if(this.isMobile) {
      this.toggleSidebar();
    }
  }

  checkMobile() {
    this.isMobile = window.innerWidth < 768;
  }

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
  }

  setSelectedTab(tabId: string) {
    this.selectedTab = tabId;
  }

  getSidebarClasses(): string {
    return `fixed left-0 top-0 h-screen bg-gray-900 text-gray-100 transition-all duration-300 ease-in-out z-30 
            ${this.isExpanded ? 'w-64' : 'w-20'} 
            ${this.isMobile && !this.isExpanded ? '-translate-x-full' : ''}`;
  }

  getNavItemClasses(itemId: string): string {
    return `w-full flex items-center p-3 my-1 rounded-lg transition-colors relative group
            ${this.selectedTab === itemId ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'} 
            ${!this.isExpanded ? 'justify-center' : ''}`;
  }

  getLogoutButtonClasses(): string {
    return `w-full flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors 
            ${!this.isExpanded ? 'justify-center' : ''}`;
  }
}