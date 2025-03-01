import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-component-testing',
  imports: [CommonModule, FormsModule],
  templateUrl: './component-testing.component.html',
  styleUrl: './component-testing.component.css'
})
export class ComponentTestingComponent {
  activeTab: 'login' | 'signup' = 'login';
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  showPassword: boolean = false;
  formError: string = '';
  loading: boolean = false;
  user: any; // Replace with actual user type
  error: string = '';
  rememberMe: boolean = false;

  constructor(private router: Router) {
    // Check if user is logged in
    if (this.user) {
      this.router.navigate(['/dashboard']);
    }
  }

  handleLoginSubmit(event: Event) {
    event.preventDefault();
    if (!this.email.trim()) {
      this.formError = 'Email is required';
      return;
    }
    if (!this.password) {
      this.formError = 'Password is required';
      return;
    }
    // Call login function here
  }

  handleSignupSubmit(event: Event) {
    event.preventDefault();
    if (!this.name.trim()) {
      this.formError = 'Name is required';
      return;
    }
    if (!this.email.trim()) {
      this.formError = 'Email is required';
      return;
    }
    if (!this.password) {
      this.formError = 'Password is required';
      return;
    }
    if (this.password.length < 8) {
      this.formError = 'Password must be at least 8 characters';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.formError = 'Passwords do not match';
      return;
    }
    // Call signup function here
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}