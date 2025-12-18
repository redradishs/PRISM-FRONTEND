import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';
import Swal from 'sweetalert2';

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
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './complete-profile.component.html',
  styleUrl: './complete-profile.component.css'
})
export class CompleteProfileComponent implements OnInit {
  currentStep = 1;
  selectedRole: 'student' | 'instructor' | null = null;
  isCoordinator = "no";
  isSubmitting = false;
  profileForm: FormGroup;

  userName = "Juan Dela Cruz";
  userEmail = "juan.delacruz@gordoncollege.edu.ph";
  userId: string = '';
  newUser = false;

  method: string = '';
  hasSetPassword: boolean = false;
  needsPasswordSetup: boolean = false;


  // Program data
  programs: Program[] = [
    { id: "bsit", name: "BS Information Technology", short: "BS IT" },
    { id: "bscs", name: "BS Computer Science", short: "BS CS" },
    { id: "bsemc", name: "BS Entertainment and Multimedia Computing", short: "BS EMC" },
    { id: "ait", name: "Associate in Information Technology", short: "AIT" },
  ];

  blocks: Block[] = ["A", "B", "C", "D", "E", "F"].map(b => ({
    id: b.toLowerCase(),
    name: `Block ${b}`
  }));

  constructor(
    private fb: FormBuilder, private router: Router, private auth: AuthService,
    private seoService: SeoService,
    private route: ActivatedRoute
  ) {
    this.profileForm = this.fb.group({
      fullName: [this.userName, Validators.required],
      course: [''],
      block: [''],
      yearLevel: [''],
      isCoordinator: [false],
      coordinatedProgram: ['']
    });
  }

  ngOnInit() {
    const seoData = this.route.snapshot.data['seo'];
    if (seoData) {
      this.seoService.updateSEO({
        ...seoData,
        url: 'https://prismgcccs.live/complete-profile',
        image: 'https://prismgcccs.live/prism_logo.png'
      });
    }

    this.auth.getCurrentUser().subscribe((user: any) => {
      // console.log(user);
      this.userName = user.name;
      this.userId = user.id;
      this.newUser = user.newUser;
      this.method = user.authProvider;
      this.hasSetPassword = user.hasSetPassword;
      this.needsPasswordSetup = this.method === 'google' && !this.hasSetPassword;
      if (!this.newUser) {
        this.router.navigate(['/dashboard']);
      } else {
        // this.detectRole();
      }
    })

    this.profileForm.patchValue({
      fullName: this.userName,
      isCoordinator: false
    });

    this.profileForm.get('isCoordinator')?.valueChanges.subscribe(isCoordinator => {
      this.isCoordinator = isCoordinator ? 'yes' : 'no';
      const coordinatedProgramControl = this.profileForm.get('coordinatedProgram');

      if (isCoordinator) {
        coordinatedProgramControl?.setValidators([Validators.required]);
      } else {
        coordinatedProgramControl?.clearValidators();
        coordinatedProgramControl?.setValue('');
      }
      coordinatedProgramControl?.updateValueAndValidity();
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

  updateUIForStep() {
    if (this.currentStep === 2) {
      if (this.selectedRole === 'student') {
        this.profileForm.get('course')?.setValidators([Validators.required]);
        this.profileForm.get('block')?.setValidators([Validators.required]);
        this.profileForm.get('yearLevel')?.setValidators([Validators.required]);
        this.profileForm.get('coordinatedProgram')?.clearValidators();
      } else if (this.selectedRole === 'instructor') {
        this.profileForm.get('course')?.clearValidators();
        this.profileForm.get('block')?.clearValidators();
        this.profileForm.get('yearLevel')?.clearValidators();

        const isCoordinatorChecked = this.profileForm.get('isCoordinator')?.value;
        if (isCoordinatorChecked) {
          this.profileForm.get('coordinatedProgram')?.setValidators([Validators.required]);
        } else {
          this.profileForm.get('coordinatedProgram')?.clearValidators();
        }
      }
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.updateValueAndValidity();
      });
    }
  }

  goBack() {
    this.currentStep = 1;
    this.selectedRole = null;
  }
  async detectRole() {
    const userRole = this.auth.getUserRole();
    if (userRole === 'student' || userRole === 'instructor') {
      this.selectedRole = userRole;
      this.currentStep = 2;
      this.updateUIForStep();
    }
  }

  onCoordinatorChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.isCoordinator = checkbox.checked ? 'yes' : 'no';

    const coordinatedProgramControl = this.profileForm.get('coordinatedProgram');

    if (checkbox.checked) {
      coordinatedProgramControl?.setValidators([Validators.required]);
    } else {
      coordinatedProgramControl?.clearValidators();
      coordinatedProgramControl?.setValue('');
    }
    coordinatedProgramControl?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.isSubmitting) return;
    this.markRelevantFieldsAsTouched();

    if (this.profileForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill out all required fields.',
        confirmButtonText: 'OK'
      });
      return;
    }

    this.isSubmitting = true;
    // console.log("Submitting Form Data:", this.profileForm.value);

    const data = {
      userId: this.userId,
      program: this.profileForm.get('course')?.value,
      block: this.profileForm.get('block')?.value,
      yearLevel: this.profileForm.get('yearLevel')?.value,
      isCoordinator: this.isCoordinator,
      coordinatedProgram: this.isCoordinator === 'yes' ? this.profileForm.get('coordinatedProgram')?.value : null
    }

    this.auth.completeProfile(data).subscribe({
      next: (resp: any) => {
        // console.log(resp);
        this.auth.setToken(resp.data.jwt);
        if (this.needsPasswordSetup) {
          this.router.navigate(['complete-profile/password']);
        } else {
          this.auth.getCurrentUser().subscribe((user: any) => {
            localStorage.setItem("showTutorial", 'true');
            if (user.role === "student") {
              this.router.navigate(['/student/dashboard']);
            } else {
              this.router.navigate(['/instructor/dashboard']);
            }
          })
        }
      },
      error: (err: any) => {
        console.error('Profile completion error:', err);
        // console.log(err)
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: err.error.message,
          confirmButtonText: 'OK'
        })
      }
    });
  }

  markRelevantFieldsAsTouched() {
    this.profileForm.get('fullName')?.markAsTouched();

    if (this.selectedRole === 'student') {
      ['course', 'block', 'yearLevel'].forEach(field => {
        this.profileForm.get(field)?.markAsTouched();
      });
    } else if (this.selectedRole === 'instructor') {
      if (this.profileForm.get('isCoordinator')?.value) {
        this.profileForm.get('coordinatedProgram')?.markAsTouched();
      }
    }
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
}
