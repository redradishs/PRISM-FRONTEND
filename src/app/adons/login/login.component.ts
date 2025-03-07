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
  role: string = '';
  

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
        Validators.pattern('\\d{8}@gordoncollege\\.edu\\.ph')
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
    this.title.setTitle('PRISM | Login');
    const storedEmail = localStorage.getItem('rememberedEmail');
    if (storedEmail) {
      this.loginForm.patchValue({ email: storedEmail });
    }
  }

  handleLoginSubmit(): void {
    if (this.loginForm.valid) {
      this.clicked = true;
      this.loading = true;

      const { email, password} = this.loginForm.value;

      const loginData = { email, password };
  
      this.authService.userLogin(loginData).subscribe({
        next: (response: any) => {
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
          this.router.navigate(['/home']);
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

  private validateEmail(email: string): boolean {
    const emailRegex = /^\d{8}@gordoncollege\.edu\.ph$/;
    return emailRegex.test(email);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  validateGordonEmail(email: string): boolean {
    const gordonEmailPattern = /^\d{8}@gordoncollege\.edu\.ph$/;
    return gordonEmailPattern.test(email);
  }

  handleSignupSubmit(event: Event): void {
    event.preventDefault();

    if (!this.validateGordonEmail(this.email)) {
      Swal.fire({
        title: 'Invalid Email',
        text: 'Please use your Gordon College EDU Mail',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#FF5733'
      });
      return;
    }

    if (!this.email || !this.password || !this.confirmPassword || !this.name || !this.role) {
      Swal.fire({
        title: 'Error',
        text: 'Please fill in all required fields',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#FF5733'
      });
      return;
    }

    if (this.password === this.confirmPassword) {
      const data = {
        email: this.email,
        password: this.password,
        name: this.name,
        role: this.role
      }
      this.authService.userSignUp(data).subscribe({
        next: (resp: any) => {

          Swal.fire({
            title: 'Success!',
            text: 'Account created successfully. Please login.',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#4CAF50'
          });

          this.activeTab = 'login';

          this.email = '';
          this.password = '';
          this.confirmPassword = '';
          this.name = '';
          this.role = '';
        }, 
        error: (error) => {
          console.log(error);
          Swal.fire({
            title: 'Error',
            text: 'Failed to create account. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#FF5733'
          });
        }
      });
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Passwords do not match',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#FF5733'
      });
    }
  }
}
