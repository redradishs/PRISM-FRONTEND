import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgot',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot.component.html',
  styleUrl: './forgot.component.css'
})
export class ForgotComponent implements OnInit {
  forgotForm!: FormGroup;
  verifyForm!: FormGroup;
  resetForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  currentStep = 1;
  
  // Store data between steps
  private email = '';
  private userId = '';
  private resetToken = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForms();
  }

  initForms(): void {
    // Step 1: Request password reset
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
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
  
  // Custom validator to check if passwords match
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  // Step 1: Request password reset
  requestReset(): void {
    if (this.forgotForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.email = this.forgotForm.value.email;

    this.authService.requestPasswordReset(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        Swal.fire({
          title: 'Verification Code Sent',
          text: 'Please check your email for the verification code.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#6C5CE7',
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
        this.isLoading = false;
        // Store the reset token and user ID for the final step
        this.resetToken = response.data.resetToken;
        this.userId = response.data.userId;
        
        Swal.fire({
          title: 'Code Verified',
          text: 'Please set your new password.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#6C5CE7',
        });
        // Move to step 3
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
  
  // Step 3: Reset password
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
  
  // Handle form submission based on current step
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
  
  // Go back to previous step
  goBack(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    } else {
      this.router.navigate(['/login']);
    }
  }
  
  // Resend verification code
  resendCode(): void {
    if (!this.email) {
      return;
    }
    
    this.isLoading = true;
    this.authService.requestPasswordReset(this.email).subscribe({
      next: () => {
        this.isLoading = false;
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
}
