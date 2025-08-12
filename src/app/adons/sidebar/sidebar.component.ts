import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLinkActive, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  isExpanded = false;
  selectedTab = 'home';
  isMobile = false;
  private resizeListener: () => void = () => { };
  username: string = '';
  currentRoute: string = '';
  role: string = '';
  isCoordinator: boolean = false;
  navItems: any[] = [];

  constructor(private auth: AuthService, private router: Router) {
    this.auth.getCurrentUser().subscribe((user) => {
      this.role = user?.role || '';
      this.username = user?.name || '';
      this.isCoordinator = user?.isCoordinator === 'yes';
      this.navItemSet();
    })

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
      if (this.isMobile) {
        this.isExpanded = false;
      }
    });
  }

  instructorNav = [
    { icon: 'fas fa-home', label: 'Home', id: 'home', route: '/instructor/dashboard' },
    { icon: 'fas fa-users', label: 'Students', id: 'students', route: '/instructor/students' },
    { icon: 'fas fa-layer-group', label: 'Manage', id: 'manage', route: '/instructor/manage' },
    { icon: 'fas fa-square-check', label: 'Assign', id: 'assessment', route: '/instructor/assign' },
    // { icon: 'fas fa-tasks', label: 'Assessment', id: 'assessment', route: '/instructor/assessment' }, this is the assessment route
    // { icon: 'fas fa-star', label: 'Generate', id: 'Generate', route: '/instructor/generate' }, this is the original generate
    // { icon: 'fas fa-star', label: 'Create', id: 'Create', route: '/instructor/create' }, this is the new Nebius with AI,
    { icon: 'fas fa-star', label: 'Create', id: 'Create', route: '/instructor/createAssessment' },
    { icon: 'fas fa-user-group', label: 'Coordinator', id: 'coordinator', route: '/instructor/coordinator', coordinatorOnly: true },
    { icon: 'fas fa-user', label: 'Profile', id: 'profile', route: '/instructor/profile' },
  ];

  userNav = [
    { icon: 'fas fa-home', label: 'Home', id: 'home', route: '/student/dashboard' },
    { icon: 'fas fa-book', label: 'Class', id: 'classes', route: '/student/classes' },
    { icon: 'fas fa-history', label: 'History', id: 'history', route: '/student/history' },
    { icon: 'fas fa-user', label: 'Profile', id: 'profile', route: '/student/profile' },

  ];

  adminNav = [
    { icon: 'fas fa-home', label: 'Home', id: 'home', route: '/admin/dashboard' },
    { icon: 'fas fa-users', label: 'Users', id: 'users', route: '/admin/users' },
    { icon: 'fas fa-user', label: 'Profile', id: 'profile', route: '/admin/profile' },
    { icon: 'fas fa-gear', label: 'Settings', id: 'settings', route: '/admin/settings' },
  ]

  private navItemSet(): void {
    switch (this.role.toLowerCase()) {
      case 'instructor':
        this.navItems = this.instructorNav.filter(item =>
          !item.coordinatorOnly || (item.coordinatorOnly && this.isCoordinator)
        );
        break;
      case 'student':
        this.navItems = this.userNav;
        break;
      case 'admin':
        this.navItems = this.adminNav;
        break;
      default:
        this.navItems = [];
        break;
    }
  }

  isRouteActive(route: string): boolean {
    return this.currentRoute.startsWith(route);
  }

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
    if (this.isMobile) {
      this.toggleSidebar();
    }
  }

  checkMobile() {
    this.isMobile = window.innerWidth < 768;
    this.isExpanded = false;

  }

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
  }

  getInitials(): string {
    if (!this.username) return 'PR';
    return this.username
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  setSelectedTab(tabId: string) {
    this.selectedTab = tabId;
  }

  getSidebarClasses(): string {
    return `fixed left-0 top-0 h-screen bg-gray-900 text-gray-100 transition-all duration-300 ease-in-out z-30 
            ${this.isExpanded ? 'w-64' : 'w-20'} 
            ${this.isMobile && !this.isExpanded ? '-translate-x-full' : ''}`;
  }

  getNavItemClasses(itemRoute: string): string {
    return `w-full flex items-center p-3 my-1 rounded-lg transition-colors relative group
            ${this.currentRoute.startsWith(itemRoute) ? 'bg-violet-800 text-white' : 'hover:bg-violet-800'} 
            ${!this.isExpanded ? 'justify-center' : ''}`;
  }

  getLogoutButtonClasses(): string {
    return `w-full flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors 
            ${!this.isExpanded ? 'justify-center' : ''}`;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}