import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [MatIconModule, RouterLink, CommonModule, ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  userId: string = '';
  isOpen = true;
  username: string = '';


  constructor(private auth: AuthService){
    this.auth.getCurrentUser().subscribe((user) => {
      this.userId = user.id;
      this.username = user.name;
      console.log(this.username);
      console.log(this.userId);
    });
  }


  menuItems = [
    { title: 'Home', icon: 'fas fa-home', route: '/instructor/dashboard' },
    { title: 'Students', icon: 'fas fa-users', route: '/instructor/students' },
    { title: 'Assessment', icon: 'fas fa-chart-bar', route: '/instructor/assessment' },
    { title: 'Generate', icon: 'fas fa-book', route: '/instructor/genererate' },
    { title: 'Profile', icon: 'fas fa-user', route: '/instructor/profile' }
  ];

  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
  }
}