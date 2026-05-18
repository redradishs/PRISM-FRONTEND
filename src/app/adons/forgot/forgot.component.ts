import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';
import { AuthBrandingComponent } from '../../shared/components/auth-branding/auth-branding.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgot',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AuthBrandingComponent],
  templateUrl: './forgot.component.html',
  styleUrl: './forgot.component.css'
})
export class ForgotComponent implements OnInit, OnDestroy {
  forgotForm!: FormGroup;
  verifyForm!: FormGroup;
  resetForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  currentStep = 1;
  resendDisabled = false;
  resendSecondsLeft = 0;
  showResetPassword = false;
  showResetConfirmPassword = false;
  private readonly resendCooldownKey = 'FRC';
  private readonly resendEmailKey = 'FRE';
  private readonly resendCooldownSeconds = 180;
  private resendTimerId: ReturnType<typeof setInterval> | null = null;

  // Store data between steps
  private email = '';
  private userId = '';
  private resetToken = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private seoService: SeoService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const seoData = this.route.snapshot.data['seo'];
    if (seoData) {
      this.seoService.updateSEO({
        ...seoData,
        url: 'https://prismgcccs.live/forgot-password',
        image: 'https://prismgcccs.live/prism_logo.png'
      });
    }

    this.initForms();
    this.restoreResendCooldown();
  }

  ngOnDestroy(): void {
    if (this.resendTimerId) {
      clearInterval(this.resendTimerId);
      this.resendTimerId = null;
    }
  }

  initForms(): void {
    // Step 1: Request password reset
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(/^[^@\s]+$/)]]
    });

    // Step 2: Verify reset code
    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    // Step 3: Reset password
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  private getFullEmail(idOnly: string): string {
    return `${idOnly}@gordoncollege.edu.ph`;
  }

  hasAtSymbol(formType: string) {
    if (formType === 'email') {
      const emailValue = this.forgotForm.get('email')?.value;
      return emailValue.includes('@');
    }
    return false;
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  toggleResetPasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.showResetPassword = !this.showResetPassword;
    } else {
      this.showResetConfirmPassword = !this.showResetConfirmPassword;
    }
  }

  // Step 1: Request password reset
  requestReset(): void {
    if (this.forgotForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const idOnly = this.forgotForm.value.email;
    this.email = this.getFullEmail(idOnly);

    this.authService.requestPasswordReset(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        localStorage.setItem(this.resendEmailKey, this.email);
        this.startResendCooldown();
        Swal.fire({
          title: 'Verification Code Sent',
          text: 'Please check your email for the verification code.',
          icon: 'success',
          showConfirmButton: false,
          toast: true,
          position: 'top-right',
          timer: 1500,
          timerProgressBar: true,
          customClass: { popup: 'swal-compact' }
        });
        // Move to step 2
        this.currentStep = 2;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Password reset request error:', error);
        this.errorMessage = error.error?.message || 'Failed to send verification code. Please try again.';

        Swal.fire({
          title: 'Error',
          text: this.errorMessage,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#6C5CE7',
        });
      }
    });
  }

  // Step 2: Verify reset code
  verifyCode(): void {
    if (this.verifyForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const code = this.verifyForm.value.code;

    const verifyData = {
      email: this.email,
      code: code
    };

    this.authService.verifyResetCode(verifyData).subscribe({
      next: (response) => {
        if (response?.remarks && response.remarks !== 'Success') {
          this.isLoading = false;
          this.errorMessage = response.message || 'Invalid or expired reset code.';

          Swal.fire({
            title: 'Error',
            text: this.errorMessage,
            icon: 'error',
            toast: true,
            position: 'top-right',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            customClass: { popup: 'swal-compact' }
          });
          return;
        }
        this.isLoading = false;
        this.resetToken = response.data.resetToken;
        this.userId = response.data.userId;

        Swal.fire({
          title: 'Code Verified',
          text: 'Please set your new password.',
          icon: 'success',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
        });
        this.currentStep = 3;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Code verification error:', error);
        this.errorMessage = error.error?.message || 'Invalid verification code. Please try again.';

        Swal.fire({
          title: 'Error',
          text: this.errorMessage,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#6C5CE7',
        });
      }
    });
  }

  resetPassword(): void {
    if (this.resetForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const newPassword = this.resetForm.value.password;

    const resetData = {
      userId: this.userId,
      resetToken: this.resetToken,
      newPassword: newPassword
    };

    this.authService.resetPassword(resetData).subscribe({
      next: (response) => {
        this.isLoading = false;
        Swal.fire({
          title: 'Password Reset Successful',
          text: 'Your password has been reset successfully. You can now login with your new password.',
          icon: 'success',
          confirmButtonText: 'Login Now',
          confirmButtonColor: '#6C5CE7',
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/login']);
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Password reset error:', error);
        this.errorMessage = error.error?.message || 'Failed to reset password. Please try again.';

        Swal.fire({
          title: 'Error',
          text: this.errorMessage,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#6C5CE7',
        });
      }
    });
  }

  onSubmit(): void {
    switch (this.currentStep) {
      case 1:
        this.requestReset();
        break;
      case 2:
        this.verifyCode();
        break;
      case 3:
        this.resetPassword();
        break;
    }
  }

  goBack(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    } else {
      this.router.navigate(['/login']);
    }
  }

  resendCode(): void {
    if (this.resendDisabled) {
      return;
    }
    if (!this.email) {
      return;
    }

    this.isLoading = true;
    this.authService.requestPasswordReset(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        localStorage.setItem(this.resendEmailKey, this.email);
        this.startResendCooldown();
        Swal.fire({
          title: 'Code Resent',
          text: 'A new verification code has been sent to your email.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#6C5CE7',
        });
      },
      error: (error) => {
        this.isLoading = false;
        Swal.fire({
          title: 'Error',
          text: error.error?.message || 'Failed to resend code. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#6C5CE7',
        });
      }
    });
  }

  private startResendCooldown(): void {
    const until = Date.now() + this.resendCooldownSeconds * 1000;
    localStorage.setItem(this.resendCooldownKey, String(until));
    this.applyResendCooldown(until);
  }

  private restoreResendCooldown(): void {
    const stored = localStorage.getItem(this.resendCooldownKey);
    if (!stored) {
      return;
    }
    const until = Number(stored);
    if (!Number.isFinite(until) || until <= Date.now()) {
      localStorage.removeItem(this.resendCooldownKey);
      localStorage.removeItem(this.resendEmailKey);
      return;
    }
    const storedEmail = localStorage.getItem(this.resendEmailKey);
    if (storedEmail) {
      this.email = storedEmail;
      this.currentStep = 2;
    }
    this.applyResendCooldown(until);
  }

  private applyResendCooldown(until: number): void {
    this.updateResendCountdown(until);
    if (this.resendTimerId) {
      clearInterval(this.resendTimerId);
    }
    this.resendTimerId = setInterval(() => {
      this.updateResendCountdown(until);
    }, 1000);
  }

  private updateResendCountdown(until: number): void {
    const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
    this.resendSecondsLeft = remaining;
    this.resendDisabled = remaining > 0;
    if (remaining <= 0) {
      if (this.resendTimerId) {
        clearInterval(this.resendTimerId);
        this.resendTimerId = null;
      }
      localStorage.removeItem(this.resendCooldownKey);
      localStorage.removeItem(this.resendEmailKey);
    }
  }
}
