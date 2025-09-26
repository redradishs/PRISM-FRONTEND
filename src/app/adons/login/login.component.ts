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
import { PwaService } from '../../services/pwa.service';


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
  showPasswword = false;
  pendingVerificationUserId: string = '';
  showConfirmPassword = false;


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


  canInstallPwa: boolean = false;
  pwaInstallLoading: boolean = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private title: Title,
    private auth: Auth,
    private seoService: SeoService,
    private route: ActivatedRoute,
    private pwaService: PwaService

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
      agreeToTerms: [false, Validators.requiredTrue],
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
    this.initializePwaInstall();
    const storedEmail = localStorage.getItem('rememberedEmail');
    if (storedEmail) {
      this.loginForm.patchValue({ email: this.stripDomainFromEmail(storedEmail) });
    }
    this.signupForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      agreeToTerms: [false, Validators.requiredTrue]
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
        // console.log('Platform Wide Settings:', resp.message);
        this.platformSettings = resp.data;
        this.isMaintenanceMode = resp.data.maintenanceMode?.enabled || false;
        this.maintenanceMessage = resp.data.maintenanceMode?.message || '';

        this.platformMessage = resp.data.platformMessage || null;

        this.allowSignup = resp.data.enableSignup ?? true;
        this.enableUserRegistration = resp.data.enableUserRegistration ?? true;
        this.enableInstructorRegistration = resp.data.enableInstructorRegistration ?? true;
        this.requireEmailVerification = resp.data.requireEmailVerification ?? true;



        // if (this.isMaintenanceMode) {
        //   this.showMaintenanceAlert();
        // }

      }, error: (error: any) => {
        console.error(error);
        this.errorMessage = 'PRISM server is experiencing technical issues. Please try again later.';
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
      // console.log('Maintenance modal result:', result);
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
          this.resetFormState();
          this.loading = false;
          this.clicked = false;
          this.showMaintenanceAlert();
          return;
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

        if (err.error && err.error.message && err.error.message.includes('Too many authentication attempts')) {
          this.loading = false;
          this.clicked = false;
          Swal.fire({
            title: 'Too Many Attempts',
            text: 'You have tried to login too many times. Please wait 3 minutes before trying again.',
            icon: 'error',
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            width: '400px',
            customClass: {
              popup: 'attempts-alert-popup'
            },
            timer: 2000,
            timerProgressBar: true,
          });

          this.clicked = true;
          setTimeout(() => {
            this.clicked = false;
          }, 180000); // 3 minutes

          return;
        }

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
    this.loginForm.patchValue({ email: '' });
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
    // console.log(this.signupForm.value);

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

    if (this.password === this.confirmPassword) {

      const data: any = {
        email: this.getFullEmail(this.email),
        password: this.password,
        name: this.name
      };

      // console.log('Signup payload:', data);

      this.loading = true;
      this.authService.userSignUp(data).subscribe({
        next: (resp: any) => {
          this.loading = false;
          // console.log('Signup response:', resp);

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
            return;
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

  initializePwaInstall(): void {
    this.pwaService.isInstallable.subscribe(canInstall => {
      this.canInstallPwa = canInstall && !this.pwaService.isStandaloneMode();
    });
  }

  async installPwa(): Promise<void> {
    try {
      this.pwaInstallLoading = true;
      const installed = await this.pwaService.promptInstall();

      if (installed) {
        Swal.fire({
          title: 'App Installed!',
          text: 'PRISM has been successfully installed on your device.',
          icon: 'success',
          confirmButtonText: 'Great!',
          confirmButtonColor: '#1976D2',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      }
    } catch (error) {
      console.error('PWA install error:', error);
      Swal.fire({
        title: 'Installation Failed',
        text: 'Unable to install the app. Please try again later.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#1976D2',
      });
    } finally {
      this.pwaInstallLoading = false;
    }
  }

  openTerms(): void {
    Swal.fire({
      title: 'Terms & Conditions',
      html: `
        <div style="text-align:left; max-height:60vh; overflow:auto; padding-right:8px; line-height:1.5; font-size:14px">
          <p><strong>Acceptance:</strong> By using PRISM, you agree to these Terms & Conditions and all applicable institutional policies.</p>

          <h3 style="margin:12px 0 6px; font-size:16px;">1. Eligibility</h3>
          <ul style="margin:0 0 8px 18px;">
            <li>You must be enrolled or affiliated in Gordon College to use PRISM.</li>
            <li>Provide truthful information during registration.</li>
            <li>Use the correct role (Student, Instructor, Admin).</li>
          </ul>

          <h3 style="margin:12px 0 6px; font-size:16px;">2. Account & Security</h3>
          <ul style="margin:0 0 8px 18px;">
            <li>Keep your credentials confidential and do not share accounts.</li>
            <li>Do not share information with others.</li>
            <li>Notify administrators immediately of any unauthorized access or suspected compromise.</li>
          </ul>

          <h3 style="margin:12px 0 6px; font-size:16px;">3. Acceptable Use</h3>
          <ul style="margin:0 0 8px 18px;">
            <li>Students must only use the platform for academic purposes and must not cheat, plagiarize, or manipulate the system.</li>
            <li>Instructors are responsible for ensuring accuray of assessment content and fair evaluation of students.</li>
            <li>No user shall exploit bugs, reverse-engineer, or disrupt the system.</li>
          </ul>

          <h3 style="margin:12px 0 6px; font-size:16px;">4. AI Generated Content</h3>
          <ul style="margin:0 0 8px 18px;">
            <li>AI Generated Assessment or Materials are for educational purposes only.</li>
            <li>The plaform is not responsible for any inaccuracies or errors in AI generated contents. Instructors should review all AI Generated Materials before assigning them.</li>
          </ul>

          <h3 style="margin:12px 0 6px; font-size:16px;">5. Prohibited Activities</h3>
          <ul style="margin:0 0 8px 18px;">
            <li>Impersonation, sharing answers, or facilitating cheating.</li>
            <li>Uploading malicious content or attempting to gain unauthorized access.</li>
            <li>Harassment, abuse, or any activity violating law or policy.</li>
          </ul>

          <h3 style="margin:12px 0 6px; font-size:16px;">7. Data & Privacy</h3>
          <ul style="margin:0 0 8px 18px;">
            <li>All Platform code, design, and non user content are owned by PRISM.</li>
            <li>You may not copy, modify, or redistribute any part of PRISM without permission.</li>
            <li>You retain rights over the contents you upload but grant PRISM a license to display it for educational purposes.</li>
          </ul>

          <h3 style="margin:12px 0 6px; font-size:16px;">8. Modifiation to Terms</h3>
          <ul style="margin:0 0 8px 18px;">
            <li>PRISM administrator may update these Terms at any time. Continued to use the platform after changes means you accept the updated terms.</li>
          </ul>

          <h3 style="margin:12px 0 6px; font-size:16px;">9. Availability & Maintenance</h3>
          <ul style="margin:0 0 8px 18px;">
            <li>Service may be unavailable during maintenance or due to technical issues. Reasonable efforts will be made to restore access.</li>
          </ul>

          <h3 style="margin:12px 0 6px; font-size:16px;">13. Contact</h3>
          <p style="margin:0 0 8px;">For questions and clarifications, contact <a href="mailto:administrator@prismgcccs.live">administrator@prismgcccs.live</a>.</p>

          <h3 style="margin:12px 0 6px; font-size:16px; text-align:right;">Effective Date</h3>
          <p style="margin:0; text-align:right;"><strong>August 1, 2025</strong></p>
        </div>
      `,
      confirmButtonText: 'Close',
      confirmButtonColor: '#1976D2',
      width: '600px'
    });
  }

  openPrivacy(): void {
    Swal.fire({
      title: 'Privacy Policy',
      html: `
        <div style="text-align:left; max-height:60vh; overflow:auto; padding-right:8px; line-height:1.5; font-size:14px">
          <p><strong>Overview:</strong> This Privacy Policy explains what data PRISM collects, how it is used, and your choices.</p>

          <h3 style="margin:12px 0 6px; font-size:16px;">1. Data We Collect</h3>
          <ul style="margin:0 0 8px 18px;">
            <li>Account Information: name, school email, role (Student, Instructor, Admin).</li>
            <li>Institutional Affiliation: program/department, coordinator status (if applicable).</li>
            <li>Authentication Data: login timestamps, verification status, tokens (e.g., from Google sign-in).</li>
            <li>Device & Technical Data: browser type/version, OS, device identifiers, IP address, error logs.</li>
          </ul>

          <h3 style="margin:12px 0 6px; font-size:16px;">2. How We Use Your Data</h3>
          <ul style="margin:0 0 8px 18px;">
            <li>Provide and operate PRISM services, including assessments and analytics.</li>
            <li>Authenticate users and secure accounts; detect, prevent, and investigate misuse.</li>
            <li>Personalize experience (e.g., role-based features) and improve platform performance.</li>
            <li>Provide support, respond to requests, and send important service notices.</li>
            <li>Comply with institutional policies and applicable laws.</li>
          </ul>

          <h3 style="margin:12px 0 6px; font-size:16px;">3. Legal Basis</h3>
          <ul style="margin:0 0 8px 18px;">
            <li>Institutional necessity to deliver academic services.</li>
            <li>Consent (e.g., Google sign-in) where required.</li>
            <li>Legitimate interests, such as platform security and service improvement.</li>
          </ul>

          <h3 style="margin:12px 0 6px; font-size:16px;">4. Third-Party Services</h3>
          <ul style="margin:0 0 8px 18px;">
            <li>Authentication providers (e.g., Google) to facilitate secure sign-in.</li>
            <li>AI (Meta Llama 3.1-8B-Instruct) for Assisted Generation and Recommendation of Resources.</li>
            <li>Hosting and infrastructure providers to deliver the service.</li>
            <li>These providers process data on our behalf under appropriate safeguards.</li>
          </ul>

          <h3 style="margin:12px 0 6px; font-size:16px;">5. Data Retention</h3>
          <ul style="margin:0 0 8px 18px;">
            <li>We retain data for as long as necessary to provide services and meet legal/academic obligations.</li>
            <li>Backups and logs may persist for a limited period after account changes or deletion.</li>
          </ul>

          <h3 style="margin:12px 0 6px; font-size:16px;">6. Data Security</h3>
          <ul style="margin:0 0 8px 18px;">
            <li>We implement administrative, technical, and organizational measures to protect your data.</li>
            <li>No method of transmission or storage is 100% secure. We continuously improve our safeguards.</li>
          </ul>

          <h3 style="margin:12px 0 6px; font-size:16px;">7. Your Rights & Choices</h3>
          <ul style="margin:0 0 8px 18px;">
            <li>Access, correction, deletion, restriction, and portability, where applicable.</li>
            <li>You may request account or data changes by contacting the administrator.</li>
          </ul>

          <h3 style="margin:12px 0 6px; font-size:16px;">8. International Transfers</h3>
          <p style="margin:0 0 8px;">Data may be processed on servers outside your region. We use appropriate safeguards consistent with institutional requirements.</p>

          <h3 style="margin:12px 0 6px; font-size:16px;">11. Changes to this Policy</h3>
          <p style="margin:0 0 8px;">We may update this Privacy Policy from time to time. Continued use of PRISM constitutes acceptance of the updated policy.</p>

          <h3 style="margin:12px 0 6px; font-size:16px;">12. Contact</h3>
          <p style="margin:0 0 8px;">For data requests or concerns, contact <a href="mailto:administrator@prismgcccs.live">administrator@prismgcccs.live</a>.</p>

          <h3 style="margin:12px 0 6px; font-size:16px; text-align:right;">Effective Date</h3>
          <p style="margin:0; text-align:right;"><strong>August 1, 2025</strong></p>
        </div>
      `,
      confirmButtonText: 'Close',
      confirmButtonColor: '#1976D2',
      width: '600px'
    });
  }
}
