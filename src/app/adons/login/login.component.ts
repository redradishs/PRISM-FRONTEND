import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormControl,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  signupForm: FormGroup;
  errorMessage: string = '';
  formError: string = '';
  loading: boolean = false;
  googleLoading: boolean = false;
  clicked = false;
  rememberMe: boolean = false;
  showPassword = false;
  confirmPassword: string = '';
  email: string = '';
  password: string = '';
  name: string = '';
  role: string = '';
  showPasswword = false;
  pendingVerificationUserId: string = '';
  showConfirmPassword = false;
  isCoordinator: string = '';

  activeTab: string = 'login';

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private title: Title,
    private auth: Auth
  ) {
    this.loginForm = this.formBuilder.group({
      email: [
        '',
        [
          Validators.required,
          Validators.pattern('^\\d+$'),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(50),
        ],
      ],
    });

    this.signupForm = this.formBuilder.group({
      email: [
        '',
        [
          Validators.required,
          Validators.pattern('^\\d+$'),
        ],
      ],
      password: ['', [Validators.required, Validators.minLength(5)]],
      confirmPassword: ['', Validators.required],
      name: ['', Validators.required],
      role: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.title.setTitle('PRISM | Login');

    // Check remembered email - now just store the ID part
    const storedEmail = localStorage.getItem('rememberedEmail');
    if (storedEmail) {
      this.loginForm.patchValue({ email: this.stripDomainFromEmail(storedEmail) });
    }

    this.signupForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.pattern('^\\d+$')]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      role: ['', Validators.required],
      isCoordinator: ['no'] // default value is 'no'
    });
  }

  // Helper to add the domain to the ID
  private getFullEmail(idOnly: string): string {
    return `${idOnly}@gordoncollege.edu.ph`;
  }
  
  // Helper to strip domain from full email
  private stripDomainFromEmail(email: string): string {
    if (email.includes('@gordoncollege.edu.ph')) {
      return email.split('@')[0];
    }
    return email;
  }

  handleLoginSubmit(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
      });

      // Check specific validation errors
      const emailControl = this.loginForm.get('email');
      if (emailControl?.errors) {
        if (emailControl.errors['required']) {
          this.formError = 'Email is required';
        } else if (emailControl.errors['pattern']) {
          this.formError = 'Please enter a valid Gordon College ID (numbers only)';
        }
        return;
      }

      if (this.loginForm.get('password')?.errors) {
        this.formError = 'Password is required';
        return;
      }

      return;
    }

    this.clicked = true;
    this.loading = true;
    this.formError = '';

    // Construct full email with domain
    const idOnly = this.loginForm.value.email;
    const fullEmail = this.getFullEmail(idOnly);
    const { password } = this.loginForm.value;
    const loginData = { email: fullEmail, password };
    

    this.authService.userLogin(loginData).subscribe({
      next: (response: any) => {

        if (response.data?.needsVerification) {
          this.loading = false;
          this.clicked = false;

          this.pendingVerificationUserId = response.data.userId;
          sessionStorage.setItem('pendingVerificationUserId', response.data.userId);
        
          console.log('Stored User ID:', sessionStorage.getItem('pendingVerificationUserId'));
      
          Swal.fire({
            title: 'Verification Required',
            text: response.message || 'Please verify your email before logging in.',
            icon: 'info',
            confirmButtonText: 'Verify Now',
            confirmButtonColor: '#1976D2',
          }).then((result) => {
            if (result.isConfirmed) {
              console.log('Navigating to verify-email page');
              this.router.navigate(['/verify-email']);
            }
          });
        
          return;
        }
        
        this.authService.setToken(response.data.jwt);
        const userRole = this.authService.getUserRole();

        Swal.fire({
          title: 'Login Successful',
          text: 'You have successfully logged in!',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#1976D2',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });

        const redirectUrl = sessionStorage.getItem('redirectUrl');
        
        if (redirectUrl) {
          sessionStorage.removeItem('redirectUrl');
          this.router.navigateByUrl(redirectUrl);
        } else {
          if (userRole === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else if (userRole === 'instructor') {
            this.router.navigate(['instructor/dashboard']);
          } else if (userRole === 'student') {
            this.router.navigate(['/student/dashboard']);
          } else {
            this.router.navigate(['/home']);
          }
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        
        if (err.status === 403 && err.error && err.error.data && err.error.data.needsVerification) {
          this.loading = false;
          this.clicked = false;
          
          this.pendingVerificationUserId = err.error.data.userId;
          sessionStorage.setItem('pendingVerificationUserId', err.error.data.userId);
          
          console.log('Stored User ID from error:', sessionStorage.getItem('pendingVerificationUserId'));
          Swal.fire({
            title: 'Verification Required',
            text: err.error.message || 'Please verify your email before logging in.',
            icon: 'info',
            confirmButtonText: 'Verify Now',
            confirmButtonColor: '#1976D2',
          }).then((result) => {
            if (result.isConfirmed) {
              console.log('Navigating to verify-email page');
              this.router.navigate(['/verify-email']);
            }
          });
          
          return;
        }
        
        this.formError = 'Invalid Email or Password';
        this.loading = false;
        this.clicked = false;
      },
      complete: () => {
        console.log('Login request completed! Welcome to PRISM!');
      }
    });
  }

  private resetFormState(): void {
    this.loginForm.patchValue({ password: '' });
    this.loading = false;
    this.clicked = false;
  }

  togglePasswordVisibility(field: 'password' | 'confirm' = 'password'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else if (field === 'confirm') {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  validateGordonEmail(email: string): boolean {
    // Now we check if it's just digits since we handle the domain separately
    const gordonIDPattern = /^\d+$/;
    return gordonIDPattern.test(email);
  }

  handleSignupSubmit(event: Event): void {
    event.preventDefault();
    console.log(this.signupForm.value);

    const formValues = this.signupForm.value;
    this.email = formValues.email;
    this.password = formValues.password;
    this.confirmPassword = formValues.confirmPassword;
    this.name = formValues.name;
    this.role = formValues.role;
    this.isCoordinator = formValues.isCoordinator; 

    if (this.password === this.confirmPassword) {

      const data = {
        // Add the domain to the email for the API call
        email: this.getFullEmail(this.email),
        password: this.password,
        name: this.name,
        role: this.role,
        isCoordinator: formValues.isCoordinator 
      };

      console.log('Signup payload:', data); 

      this.loading = true;
      this.authService.userSignUp(data).subscribe({
        next: (resp: any) => {
          this.loading = false;
          console.log('Signup response:', resp);

          if(resp.remarks === 'Success') {
            if (resp.data && resp.data.userId) {
              sessionStorage.setItem('pendingVerificationUserId', resp.data.userId);
              console.log('Stored User ID from signup:', sessionStorage.getItem('pendingVerificationUserId'));
            }

            Swal.fire({
              title: "Success!",
              text: resp.message || "Account created successfully. Please verify your email.",
              icon: 'success',
              confirmButtonText: 'Verify Now',
              confirmButtonColor: '#1976D2',
            }).then((result) => {
              if (result.isConfirmed) {
                console.log('Navigating to verify-email page');
                this.router.navigate(['/verify-email']);
              }
            });
          } else {
            Swal.fire({
              title: 'Success!',
              text: 'Account created successfully. Please login.',
              icon: 'success',
              confirmButtonText: 'OK',
              confirmButtonColor: '#1976D2',
            });
            this.activeTab = 'login';
          }
        
          this.email = '';
          this.password = '';
          this.confirmPassword = '';
          this.name = '';
          this.role = '';
          this.signupForm.reset();
        },
        error: (error) => {
          this.loading = false;
          console.error('Signup error:', error);
          Swal.fire({
            title: 'Error',
            text: error.error?.message || 'Failed to create account. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#FF5733',
          });
        },
      });
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Passwords do not match',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#FF5733',
      });
    }
  }

  onRoleChange(event: any) {
    const role = event.target.value;
    if (role === 'instructor') {
      this.signupForm.get('isCoordinator')?.enable();
    } else {
      this.signupForm.get('isCoordinator')?.disable();
      this.signupForm.get('isCoordinator')?.setValue('no');
    }
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async loginWithGoogle() {
    try {
      this.googleLoading = true;
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      
      if (!result.user.email?.endsWith('@gordoncollege.edu.ph')) {
        throw new Error('INVALID_EMAIL');
      }

      const idToken = await result.user.getIdToken();
      
      this.authService.googleSignIn({ idToken }).subscribe({
        next: (response: any) => {
          this.authService.setToken(response.data.jwt);
          const userRole = this.authService.getUserRole();
          
          Swal.fire({
              title: 'Login Successful',
              text: 'You have successfully logged in with Google!',
              icon: 'success',
              confirmButtonText: 'OK',
              confirmButtonColor: '#1976D2',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true,
          });

          if(response.data.newUser) {
            console.log('New user detected');
            this.router.navigate(['/complete-profile']);
            return;
          }

          const redirectUrl = sessionStorage.getItem('redirectUrl');
          if (redirectUrl) {
            sessionStorage.removeItem('redirectUrl');
            this.router.navigateByUrl(redirectUrl);
          } else {
            switch(userRole) {
              case 'admin':
                this.router.navigate(['/admin/dashboard']);
                break;
              case 'instructor':
                this.router.navigate(['instructor/dashboard']);
                break;
              case 'student':
                this.router.navigate(['/student/dashboard']);
                break;
              default:
                this.router.navigate(['/home']);
            }
          }
        },
        error: (error) => {
          console.error('Google sign-in error:', error);
          Swal.fire({
            title: 'Error',
            text: error.error?.message || 'Failed to sign in with Google. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#1976D2',
          });
        },
        complete: () => {
          this.googleLoading = false;
        }
      });
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      this.googleLoading = false;
      
      let errorMessage = 'Failed to sign in with Google. Please try again.';
      if (error.message === 'INVALID_EMAIL') {
        errorMessage = 'Please use your Gordon College email address.';
      }
      
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#1976D2',
      });
    }
  }
}
