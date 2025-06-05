import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-verify',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.css'
})
export class VerifyComponent implements OnInit {
  verificationForm: FormGroup;
  userId: string | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private seoService: SeoService,
    private route: ActivatedRoute
  ) {
    this.verificationForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  ngOnInit(): void {
    const seoData = this.route.snapshot.data['seo'];
    if (seoData) {
      this.seoService.updateSEO({
        ...seoData,
        url: 'https://prismgcccs.live/verify-email',
        image: 'https://prismgcccs.live/prism_logo.png'
      });
    }

    this.userId = sessionStorage.getItem('pendingVerificationUserId');
    if(!this.userId){
      this.router.navigate(['/login']);
    }
   
  }

  onSubmit() {
    if (this.verificationForm.invalid || !this.userId) {
      return;
    }

    this.isLoading = true;

    this.auth.verifyEmail(this.userId, this.verificationForm.value.code).subscribe({
      next: (resp) => {
        this.isLoading = false;

        sessionStorage.removeItem('pendingVerificationUserId');
        Swal.fire({
          title: 'Success!',
          text: 'Email verified successfully',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50'
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire({
          title: 'Error',
          text: 'Failed to verify email',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#FF5733'
        });
      }
    });
  }

  resendCode() {
    if (!this.userId) {
      return;
    }
    
    this.isLoading = true;
    
    this.auth.resendVerificationCode(this.userId).subscribe({
      next: (resp) => {
        this.isLoading = false;
        Swal.fire({
          title: 'Success!',
          text: 'Verification code resent successfully',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50'
        });
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire({
          title: 'Error',
          text: 'Failed to resend verification code',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#FF5733'
        });
      }
    });
  }
}