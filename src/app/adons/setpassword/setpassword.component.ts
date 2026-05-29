import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

interface Program {
  id: string;
  name: string;
  short: string;
}

interface Block {
  id: string;
  name: string;
}

@Component({
  selector: 'app-setpassword',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './setpassword.component.html',
  styleUrl: './setpassword.component.css'
})
export class SetpasswordComponent {
  isSubmitting = false;
  profileForm: FormGroup;
  showPassword = false;

  userName = "Juan Dela Cruz";
  userId: string = '';
  newUser = false;
  method: string = '';
  hasSetPassword: boolean = false;
  needsPasswordSetup: boolean = false;

  constructor(
    private fb: FormBuilder, private router: Router, private auth: AuthService,
    private seoService: SeoService,
    private route: ActivatedRoute,

  ) {
    this.profileForm = this.fb.group({
      password: ['']
    });
  }

  ngOnInit() {
    const seoData = this.route.snapshot.data['seo'];
    if (seoData) {
      this.seoService.updateSEO({
        ...seoData,
        url: this.auth.domainCaller('/complete-profile'),
        image: this.auth.domainCaller('/prism_logo.png')
      });
    }

    this.auth.getCurrentUser().subscribe((user: any) => {
      this.userName = user.name;
      this.userId = user.id;
      this.newUser = user.newUser;
      this.method = user.authProvider;
      this.hasSetPassword = user.hasSetPassword;
      this.needsPasswordSetup = this.method === 'google' && !this.hasSetPassword;
      if (!this.needsPasswordSetup) {
        this.router.navigate(['/dashboard']);
      } else {
        // this.detectRole();
      }
    })

    this.profileForm.patchValue({
      fullName: this.userName,
      isCoordinator: false
    });
  }



  clearAllValidators() {
    const controls = ['course', 'block', 'yearLevel', 'coordinatedProgram']
    controls.forEach(controlName => {
      const control = this.profileForm.get(controlName);
      control?.clearValidators();
      control?.updateValueAndValidity();
    });
  }


  goBack() {
    this.finishNavigation();
  }




  private finishNavigation() {
    // Small delay to ensure auth state is fully updated
    setTimeout(() => {
      this.auth.getCurrentUser().subscribe((user: any) => {
        if (user && user.role) {
          localStorage.setItem("showTutorial", 'true');
          if (user.role === "student") {
            this.router.navigate(['/student/dashboard']);
          } else {
            this.router.navigate(['/instructor/dashboard']);
          }
        }
      })
    }, 150);
  }

  onSubmitPassword() {
    if (this.isSubmitting) return;

    this.profileForm.get('password')?.markAsTouched();

    const password = this.profileForm.get('password')?.value;

    if (!this.isPasswordValid) {
      let errorMessage = 'Password must meet all requirements:\n';
      if (!this.hasMinLength) errorMessage += '• At least 8 characters\n';
      if (!this.hasUppercase) errorMessage += '• At least one uppercase letter\n';
      if (!this.hasLowercase) errorMessage += '• At least one lowercase letter\n';
      if (!this.hasSpecialChar) errorMessage += '• At least one special character\n';

      Swal.fire({
        icon: 'error',
        title: 'Invalid Password',
        text: errorMessage,
        confirmButtonText: 'OK'
      });
      return;
    }

    const data = {
      userId: this.userId,
      newPassword: password
    }

    this.isSubmitting = true;
    this.auth.authSetPassword(data).subscribe({
      next: () => {
        this.hasSetPassword = true;
        this.needsPasswordSetup = false;
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Your password has been set successfully.',
          confirmButtonText: 'OK'
        }).then(() => {
          this.finishNavigation();
        });
      },
      error: (err: any) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: err.error.message,
          confirmButtonText: 'OK'
        })
      }
    })
  }



  enterPlatform() {
    // Implement navigation to dashboard
    this.router.navigate(['/dashboard']);
  }

  // Helper method to check if screen is mobile
  isMobileScreen(): boolean {
    return window.innerWidth < 640;
  }

  // Helper method to get program display name
  getProgramDisplayName(program: Program): string {
    return this.isMobileScreen() ? program.short : program.name;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  get password(): string {
    return this.profileForm.get('password')?.value || '';
  }

  get hasMinLength(): boolean {
    return this.password.length >= 8;
  }

  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.password);
  }

  get hasLowercase(): boolean {
    return /[a-z]/.test(this.password);
  }

  get hasSpecialChar(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.password);
  }

  get isPasswordValid(): boolean {
    return this.hasMinLength && this.hasUppercase && this.hasLowercase && this.hasSpecialChar;
  }
}
