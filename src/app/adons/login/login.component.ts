import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  formError: string = '';
  loading: boolean = false;
  clicked = false;
  rememberMe: boolean = false;
  showPassword = false;
  confirmPassword: string = '';
  email: string = '';
  password: string = '';
  name: string = '';
  

  activeTab: string = 'login';

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

  handleLoginSubmit(): void {
    if (this.loginForm.valid) {
      this.clicked = true;
      this.loading = true;
  
      // Create a data object to pass to the service
      const { email, password} = this.loginForm.value;
  
      // Pass the data object to the authService
      const loginData = { email, password };
  
      this.authService.userLogin(loginData).subscribe({
        next: (response: any) => {
          // Login success: store the JWT token and navigate to home
          this.authService.setToken(response.jwt);

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

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  handleSignupSubmit(event: Event): void {
    event.preventDefault();
    // Add your signup logic here
    if (this.password === this.confirmPassword) {
      // Handle signup
      console.log('Signup:', { name: this.name, email: this.email, password: this.password });
    } else {
      this.formError = 'Passwords do not match';
    }
  }
}
