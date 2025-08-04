import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { Auth } from '@angular/fire/auth';
import { SeoService } from '../../services/seo.service';


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
  coordinatedProgram: string = '';

  activeTab: string = 'login';

  //platfrom settings
  allowSignup: boolean = true;
  platformSettings: any = null;
  isMaintenanceMode: boolean = false;
  maintenanceMessage: string = '';
  platformMessage: any = null;
  enableUserRegistration: boolean = false;
  enableInstructorRegistration: boolean = false;
  requireEmailVerification: boolean = true;
  defaultUserRole: string = 'student';

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private title: Title,
    private auth: Auth,
    private seoService: SeoService,
    private route: ActivatedRoute

  ) {
    this.loginForm = this.formBuilder.group({
      email: [
        '',
        [
          Validators.required,
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
        ],
      ],
      password: ['', [Validators.required, Validators.minLength(5)]],
      confirmPassword: ['', Validators.required],
      name: ['', Validators.required],
      role: ['', Validators.required],
    });
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      this.router.navigate(['/home']);
    }
  }

  ngOnInit(): void {
    const seoData = this.route.snapshot.data['seo'];
    if (seoData) {
      this.seoService.updateSEO({
        ...seoData,
        url: 'https://prismgcccs.live/login',
        image: 'https://prismgcccs.live/prism_logo.png'
      });
    }
    this.title.setTitle('PRISM | Login');
    this.getPlatformSettings();
    const storedEmail = localStorage.getItem('rememberedEmail');
    if (storedEmail) {
      this.loginForm.patchValue({ email: this.stripDomainFromEmail(storedEmail) });
    }
    this.signupForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      role: ['', Validators.required],
      isCoordinator: ['no'],
      coordinatedProgram: ['bsit']
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

  getPlatformSettings() {
    this.authService.platformWideSettings().subscribe({
      next: (resp: any) => {
        console.log('Platform Wide Settings:', resp);
        this.platformSettings = resp.data;
        this.isMaintenanceMode = resp.data.maintenanceMode?.enabled || false;
        this.maintenanceMessage = resp.data.maintenanceMode?.message || '';

        this.platformMessage = resp.data.platformMessage || null;

        this.allowSignup = resp.data.enableSignup ?? true;
        this.enableUserRegistration = resp.data.enableUserRegistration ?? true;
        this.enableInstructorRegistration = resp.data.enableInstructorRegistration ?? true;
        this.requireEmailVerification = resp.data.requireEmailVerification ?? true;

        if (this.defaultUserRole) {
          this.signupForm.patchValue({ role: this.defaultUserRole });
        }

        // if (this.isMaintenanceMode) {
        //   this.showMaintenanceAlert();
        // }

      }, error: (error: any) => {
        console.error(error);
        this.errorMessage = 'Failed to fetch platform wide settings';
      }
    })
  }

  showMaintenanceAlert() {
    Swal.fire({
      html: `
      <div style="text-align: center; padding: 30px 20px;">
        <!-- Icon Section -->
        <div style="margin-bottom: 25px;">
          <div style="width: 80px; height: 80px; margin: 0 auto; 
                      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                      border-radius: 50%; display: flex; align-items: center; 
                      justify-content: center; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3);">
            <i class="fas fa-tools" style="font-size: 32px; color: white;"></i>
          </div>
        </div>

        <!-- Title -->
        <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 28px; font-weight: 700;">
          System Maintenance
        </h2>

        <!-- Main Message Card -->
        <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); 
                    border-radius: 16px; padding: 25px; margin-bottom: 20px;
                    border: 1px solid #fde68a; position: relative; overflow: hidden;">
          
          <!-- Decorative elements -->
          <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px;
                      background: rgba(245, 158, 11, 0.1); border-radius: 50%;"></div>
          <div style="position: absolute; bottom: -10px; left: -10px; width: 40px; height: 40px;
                      background: rgba(245, 158, 11, 0.1); border-radius: 50%;"></div>
          
          <div style="position: relative; z-index: 1;">
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
              <div style="width: 4px; height: 30px; background: #f59e0b; border-radius: 2px; margin-right: 12px;"></div>
              <h3 style="color: #92400e; margin: 0; font-size: 18px; font-weight: 600;">
                Scheduled Maintenance in Progress
              </h3>
            </div>
            <p style="color: #78350f; margin: 0; font-size: 15px; line-height: 1.5;">
              ${this.maintenanceMessage}
            </p>
          </div>
        </div>

        <!-- Contact Info -->
        <p style="color: #9ca3af; font-size: 13px; margin: 0;">
          Need immediate assistance? Contact us at 
          <a href="mailto:administrator@prismgcccs.live" style="color: #f59e0b; text-decoration: none; font-weight: 500;">
            administrator@prismgcccs.live
          </a>
        </p>
      </div>
    `,
      showConfirmButton: true,
      confirmButtonText: '<i class="fas fa-check" style="margin-right: 8px;"></i> I Understand',
      confirmButtonColor: '#f59e0b',
      allowOutsideClick: true,
      allowEscapeKey: true,
      width: '480px',
      backdrop: true,
      customClass: {
        popup: 'maintenance-alert-popup',
        confirmButton: 'maintenance-confirm-btn'
      }
    }).then((result) => {
      console.log('Maintenance modal result:', result);
    });
  }

  handleLoginSubmit(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
      });
      const emailControl = this.loginForm.get('email');
      if (emailControl?.errors) {
        if (emailControl.errors['required']) {
          this.formError = 'Email is required';
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

        if (response.data.maintenanceMode) {
          this.loading = false;
          this.clicked = false;
          this.showMaintenanceAlert();
        }
        if (response.data.isBanned) {
          this.loading = false;
          this.clicked = false;

          Swal.fire({
            html: `
              <div style="text-align: center; padding: 20px;">
                <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); 
                            border-radius: 12px; padding: 20px; margin-bottom: 20px;
                            border-left: 4px solid #dc2626;">
                  <h3 style="color: #dc2626; margin: 0 0 10px 0; font-weight: 600;">
                    ${response.data.message}
                  </h3>
                  <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
                    <strong>Reason:</strong> ${response.data.reason}
                  </p>
                </div>
                
                <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                  <p style="color: #374151; margin: 0; font-size: 14px;">
                    <strong>🕒 Status:</strong><br>
                    <span style="color: #059669; font-weight: 600; font-size: 16px;">
                      ${response.data.unbannedAt}
                    </span>
                  </p>
                </div>
                
                <p style="color: #6b7280; font-size: 13px; margin: 0;">
                  If you believe this is a mistake, please contact support.
                  <br>
                  administrator@prismgcccs.live
                </p>
              </div>
            `,
            icon: 'error',
            confirmButtonText: 'I Understand',
            confirmButtonColor: '#dc2626',
            allowOutsideClick: false,
            allowEscapeKey: false,
            width: '450px',
            customClass: {
              popup: 'ban-alert-popup'
            }
          });
          return;
        }

        this.authService.setToken(response.data.jwt);
        localStorage.removeItem('assessment_integrity_data');
        sessionStorage.removeItem('assessment_integrity_data');
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

        if (response.data.newUser) {
          console.log('New user detected');
          this.router.navigate(['/complete-profile']);
          return;
        }

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

  hasAtSymbol(formType: string) {
    if (formType === 'email') {
      const emailValue = this.loginForm.get('email')?.value;
      return emailValue.includes('@')
    } else if (formType === 'signup-email') {
      const emailValue = this.signupForm.get('email')?.value;
      return emailValue.includes('@')
    }
  }

  //used to validate only gc domain
  validateGordonEmail(email: string): boolean {
    return email.trim().length > 0;
  }

  handleSignupSubmit(event: Event): void {
    event.preventDefault();
    console.log(this.signupForm.value);

    if (this.signupForm.invalid) {
      Swal.fire({
        title: 'Error',
        text: 'Please fill out all required fields correctly.',
        icon: 'error',
        toast: true,
        timer: 3000,
        position: 'top-end',
        showConfirmButton: false,
        timerProgressBar: true
      });
      return;
    }


    const formValues = this.signupForm.value;
    this.email = formValues.email;
    this.password = formValues.password;
    this.confirmPassword = formValues.confirmPassword;
    this.name = formValues.name;
    this.role = formValues.role;
    this.isCoordinator = formValues.isCoordinator;
    this.coordinatedProgram = formValues.coordinatedProgram;

    if (this.password === this.confirmPassword) {

      const data: any = {
        email: this.getFullEmail(this.email),
        password: this.password,
        name: this.name,
        role: this.role,
        isCoordinator: formValues.isCoordinator
      };
      if (formValues.isCoordinator === 'yes') {
        data.coordinatedProgram = formValues.coordinatedProgram;
      }

      console.log('Signup payload:', data);

      this.loading = true;
      this.authService.userSignUp(data).subscribe({
        next: (resp: any) => {
          this.loading = false;
          console.log('Signup response:', resp);

          if (resp.remarks === 'Success') {
            if (resp.data && resp.data.userId) {
              sessionStorage.setItem('pendingVerificationUserId', resp.data.userId);
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
      this.signupForm.get('coordinatedProgram')?.enable();
    } else {
      this.signupForm.get('isCoordinator')?.disable();
      this.signupForm.get('isCoordinator')?.setValue('no');
      this.signupForm.get('coordinatedProgram')?.disable();
      this.signupForm.get('coordinatedProgram')?.setValue('');
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
          if (response.data.maintenanceMode) {
            this.loading = false;
            this.clicked = false;
            this.showMaintenanceAlert();
          }
          if (response.data.isBanned) {
            this.googleLoading = false;

            Swal.fire({
              html: `
                <div style="text-align: center; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); 
                              border-radius: 12px; padding: 20px; margin-bottom: 20px;
                              border-left: 4px solid #dc2626;">
                    <h3 style="color: #dc2626; margin: 0 0 10px 0; font-weight: 600;">
                      ${response.data.message}
                    </h3>
                    <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
                      <strong>Reason:</strong> ${response.data.reason}
                    </p>
                  </div>
                  
                  <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                    <p style="color: #374151; margin: 0; font-size: 14px;">
                      <strong>🕒 Status:</strong><br>
                      <span style="color: #059669; font-weight: 600; font-size: 16px;">
                        ${response.data.unbannedAt}
                      </span>
                    </p>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 13px; margin: 0;">
                    If you believe this is a mistake, please contact support.
                    <br>
                    administrator@prismgcccs.live
                  </p>
                </div>
              `,
              icon: 'error',
              confirmButtonText: 'I Understand',
              confirmButtonColor: '#dc2626',
              allowOutsideClick: false,
              allowEscapeKey: false,
              width: '450px',
              customClass: {
                popup: 'ban-alert-popup'
              }
            });
            return;
          }

          this.authService.setToken(response.data.jwt);
          localStorage.removeItem('assessment_integrity_data');
          sessionStorage.removeItem('assessment_integrity_data');
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

          if (response.data.newUser) {
            console.log('New user detected');
            this.router.navigate(['/complete-profile']);
            return;
          }

          const redirectUrl = sessionStorage.getItem('redirectUrl');
          if (redirectUrl) {
            sessionStorage.removeItem('redirectUrl');
            this.router.navigateByUrl(redirectUrl);
          } else {
            switch (userRole) {
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
