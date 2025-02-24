import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;
  clicked = false;
  rememberMe: boolean = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private title: Title
  ) {
    this.loginForm = this.formBuilder.group({
      email: new FormControl('', [
        Validators.required,
        Validators.email,
        Validators.maxLength(50)
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(50)
      ]),
      rememberMe: new FormControl(false)
    });
  }

  ngOnInit(): void {
    this.title.setTitle('Login - PasaBuy');
    const storedEmail = localStorage.getItem('rememberedEmail');
    if (storedEmail) {
      this.loginForm.patchValue({ email: storedEmail });
    }
  }

  userLogin(): void {
    if (this.loginForm.valid) {
      this.clicked = true;
      this.loading = true;
  
      // Create a data object to pass to the service
      const { email, password, rememberMe } = this.loginForm.value;
  
      // Pass the data object to the authService
      const loginData = { email, password, rememberMe };
  
      this.authService.userLogin(loginData).subscribe({
        next: (response: any) => {
          // Login success: store the JWT token and navigate to home
          this.authService.setToken(response.jwt);
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
          }

          const userRole = this.authService.getUserRole();

          Swal.fire({
            title: 'Login Successful',
            text: 'You have successfully logged in!',
            icon: 'success',
            confirmButtonText: 'OK',
             confirmButtonColor: '#4CAF50'
          });
    if (userRole === 'admin') {
          this.router.navigate(['/admin-dashboard']);
        } else if (userRole === 'instructor') {
          this.router.navigate(['instructor/dashboard']);
        } else if (userRole === 'student') {
          this.router.navigate(['/student-dashboard']);
        } else {
          this.router.navigate(['/home']); // Fallback route
        }
        },
        error: (err) => {
          this.errorMessage = 'Invalid Email or Password';
          Swal.fire({
            title: 'Error',
            text: this.errorMessage,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#FF5733'
          });
          this.resetFormState();
        },
        complete: () => {
          this.loading = false;

          this.clicked = false;
        }
      });
    } else {
      this.errorMessage = 'Please fill in all fields';
      Swal.fire({
        title: 'Error',
        text: this.errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#FF5733' 
      });
    }
  }
  

  private resetFormState(): void {
    this.loginForm.patchValue({ password: '' });
    this.loading = false;
    this.clicked = false;
  }
}
