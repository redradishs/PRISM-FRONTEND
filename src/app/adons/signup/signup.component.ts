
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-signup',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  signupForm: FormGroup; 
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = ''; 
  errorMessage: string = ''; 
  loading: boolean = false; 
  clicked = false;


  constructor(private authService: AuthService, 
              private router: Router,
              private fb: FormBuilder,
              private cdr: ChangeDetectorRef){

    this.signupForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    contactNumber: ['', [Validators.required, Validators.pattern('^\\+63\\d{9}$')]],
    password: ['', Validators.required], // Password required
    confirmPassword: ['', Validators.required]
  });
}
ngAfterViewChecked() {
  this.cdr.detectChanges();
}

onSignup() {
  if (this.signupForm.invalid) {
    // Check if form is invalid
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Please fill in all required fields correctly',
    });
    return;
  }

  // Get the form values
  const { name, email, password, confirmPassword } = this.signupForm.value;

  // Check if passwords match
  if (password !== confirmPassword) {
    Swal.fire({
      icon: 'error',
      title: 'Password mismatch',
      text: 'Passwords do not match',
    });
    return;
  }

  // Proceed with signup logic
  const data = { name, email, password };

  this.clicked = true;
  setTimeout(() => {
    console.log('User signed up successfully:', data);
    Swal.fire({
      icon: 'success',
      title: 'Sign up successful!',
      text: 'You can now log in.',
    });
    this.router.navigate(['/login']);
  }, 1000);

  setTimeout(() => {
    this.clicked = false;
  }, 2000);
}
}