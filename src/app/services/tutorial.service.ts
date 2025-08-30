import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

// Simple tutorial step interface
export interface TutorialStep {
    element: string;
    intro: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    navigateTo?: string; // Route to navigate to after this step
}

@Injectable({
    providedIn: 'root'
})
export class TutorialService {
    private platformId = inject(PLATFORM_ID);
    private authService = inject(AuthService);
    private router = inject(Router);

    private introJs: any = null;
    private currentStepIndex = 0;
    private tutorialSteps: TutorialStep[] = [];
    private isRunning = false;
    private isCompleting = false;

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            import('intro.js').then(module => {
                this.introJs = module.default;
            });
        }
    }

    // Check if user has completed tutorial 
    hasCompletedTutorial(): boolean {
        if (!isPlatformBrowser(this.platformId)) return true;
        const userRole = this.authService.getUserRole();
        if (!userRole) return true;
        return localStorage.getItem(`tutorial_completed_${userRole}`) === 'true';
    }

    // Mark tutorial as completed
    markTutorialCompleted(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        const userRole = this.authService.getUserRole();
        if (!userRole) return;
        localStorage.setItem(`tutorial_completed_${userRole}`, 'true');
    }

    // Start tutorial
    async startTutorial(): Promise<void> {
        if (!this.introJs || !isPlatformBrowser(this.platformId) || this.isRunning) return;

        const userRole = this.authService.getUserRole();
        if (!userRole) return;

        this.tutorialSteps = this.getSteps(userRole as 'student' | 'instructor' | 'admin');
        this.currentStepIndex = 0;
        this.isRunning = true;
        this.isCompleting = false;

        await this.showCurrentStep();
    }

    async tutorialInitialize() {
        this.router.navigate(['/']);
        this.startTutorial();
    }

    // Show current step
    private async showCurrentStep(): Promise<void> {
        if (this.currentStepIndex >= this.tutorialSteps.length) {
            this.completeTutorial();
            return;
        }
        this.isCompleting = false;

        const step = this.tutorialSteps[this.currentStepIndex];

        await this.waitForElement(step.element);

        if (document.querySelector('.introjs-overlay')) {
            try {
                this.introJs().exit(true);
            } catch (e) {
            }
        }

        const intro = this.introJs();
        intro.setOptions({
            showStepNumbers: false,
            showBullets: false,
            showProgress: false,
            skipLabel: 'Skip Tutorial',
            doneLabel: this.currentStepIndex === this.tutorialSteps.length - 1 ? 'Finish' : 'Next →',
            exitOnOverlayClick: false,
            exitOnEsc: true,
            steps: [{
                ...step,
                intro: `<div class="tutorial-header">
                          <span class="step-counter">Step ${this.currentStepIndex + 1} of ${this.tutorialSteps.length}</span>
                          <button class="tutorial-skip-btn" onclick="window.skipTutorial()">Skip Tutorial</button>
                        </div>
                        <div class="tutorial-content">${step.intro}</div>`
            }]
        });

        intro.oncomplete(() => {
            this.isCompleting = true;
            const currentStep = this.tutorialSteps[this.currentStepIndex];
            this.currentStepIndex++;

            // Check if we need to navigate after user clicked Next
            if (currentStep.navigateTo && !this.router.url.startsWith(currentStep.navigateTo)) {
                this.router.navigate([currentStep.navigateTo]).then(() => {
                    setTimeout(() => this.showCurrentStep(), 1000);
                });
            } else {
                setTimeout(() => this.showCurrentStep(), 100);
            }
        });

        intro.onexit(() => {
            if (!this.isCompleting) {
                this.showSkipConfirmation();
            }
        });

        // Expose skip function to global scope
        (window as any).skipTutorial = () => {
            intro.exit();
        };

        intro.start();
    }

    // Wait for DOM element
    private async waitForElement(selector: string): Promise<void> {
        for (let i = 0; i < 20; i++) {
            const element = document.querySelector(selector);
            if (element && element.getBoundingClientRect().width > 0) return;
            await new Promise(resolve => setTimeout(resolve, 250));
        }
    }

    // Complete tutorial
    private completeTutorial(): void {
        this.markTutorialCompleted();
        this.isRunning = false;
        this.isCompleting = false;
        this.showCompletionMessage();
    }

    // Show skip confirmation
    private async showSkipConfirmation(): Promise<void> {
        const { default: Swal } = await import('sweetalert2');
        const result = await Swal.fire({
            title: 'Skip Tutorial?',
            text: 'Are you sure you want to skip the tutorial?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Skip',
            cancelButtonText: 'Continue',
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#1976D2'
        });

        if (result.isConfirmed) {
            this.markTutorialCompleted();
            this.isRunning = false;
            this.isCompleting = false;
        } else {
            this.isCompleting = false;
            setTimeout(() => this.showCurrentStep(), 100);
        }
    }

    // Show completion message
    private async showCompletionMessage(): Promise<void> {
        localStorage.setItem('showTutorial', 'false');
        const { default: Swal } = await import('sweetalert2');
        Swal.fire({
            title: 'Tutorial Completed! 🎉',
            text: 'You\'ve completed the PRISM tutorial! You may also replay the tutorial in the Profile Page.',
            icon: 'success',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    private getSteps(role: 'student' | 'instructor' | 'admin'): TutorialStep[] {
        const steps: Record<string, TutorialStep[]> = {
            student: [
                {
                    element: '[data-tour="dashboard-welcome"]',
                    intro: 'Welcome to your PRISM Student Dashboard! This is your central hub for all academic activities.',
                    position: 'bottom' as const
                },
                {
                    element: '[data-tour="quick-actions"]',
                    intro: 'Use these quick action buttons to join classes or take assessments easily.',
                    position: 'bottom' as const
                },
                {
                    element: '[data-tour="recent-assessments"]',
                    intro: 'Your account statistics are displayed here for quick access, you can also click each card.',
                    position: 'top' as const
                },
                {
                    element: '[data-tour="nav-classes"]',
                    intro: 'This is where you navigate to go to your Classes section.',
                    position: 'right' as const,
                    navigateTo: '/student/classes'
                },
                {
                    element: '[data-tour="classes-welcome"]',
                    intro: 'Welcome to your Classes page! Here you can see your enrolled classes. You may click these 2 cards to view them.',
                    position: 'bottom' as const
                },
                {
                    element: '[data-tour="class-search"]',
                    intro: 'Search for your classes here.',
                    position: 'top' as const
                },
                {
                    element: '[data-tour="class-tabs"]',
                    intro: 'Switch between different view modes.',
                    position: 'top' as const
                },
                {
                    element: '[data-tour="class-list"]',
                    intro: 'This shows all your enrolled classes with details.',
                    position: 'top' as const
                },
                {
                    element: '[data-tour="nav-history"]',
                    intro: 'Next, let\'s check your assessment history.',
                    position: 'right' as const,
                    navigateTo: '/student/history'
                },
                {
                    element: '[data-tour="history-welcome"]',
                    intro: 'This is your Assessment History page.',
                    position: 'bottom' as const
                },
                {
                    element: '[data-tour="history-filters"]',
                    intro: 'Use these filters to view different types of assessments.',
                    position: 'top' as const
                },
                {
                    element: '[data-tour="assessment-history"]',
                    intro: 'Here you can see your assessment results and feedback.',
                    position: 'top' as const
                },
                {
                    element: '[data-tour="nav-profile"]',
                    intro: 'Finally, let\'s visit your Profile page.',
                    position: 'right' as const,
                    navigateTo: '/student/profile'
                },
                {
                    element: '[data-tour="profile-welcome"]',
                    intro: 'This is your Profile page for account settings.',
                    position: 'bottom' as const
                },
                {
                    element: '[data-tour="profile-info"]',
                    intro: 'Edit your personal details here.',
                    position: 'top' as const
                },
                {
                    element: '[data-tour="profile-settings"]',
                    intro: 'Manage your account preferences here.',
                    position: 'top' as const
                }
            ],
            instructor: [
                {
                    element: '[data-tour="dashboard-welcome"]',
                    intro: 'Welcome to your PRISM Instructor Dashboard!',
                    position: 'bottom' as const
                }
            ],
            admin: [
                {
                    element: '[data-tour="dashboard-welcome"]',
                    intro: 'Welcome to the PRISM Admin Dashboard!',
                    position: 'bottom' as const
                }
            ]
        };

        return steps[role] || [];
    }

    resetTutorial(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        const userRole = this.authService.getUserRole();
        if (!userRole) return;
        localStorage.removeItem(`tutorial_completed_${userRole}`);
    }

    shouldShowTutorialPrompt(): boolean {
        const shouldShow = localStorage.getItem('showTutorial') === 'true';
        if (!shouldShow) return false;

        return shouldShow
    }

    isTutorialInProgress(): boolean {
        return this.isRunning;
    }

    async continueTutorial(): Promise<void> {
        if (!this.hasCompletedTutorial()) {
            await this.startTutorial();
        }
    }

    // Show tutorial prompt
    async showTutorialPrompt(): Promise<boolean> {
        const { default: Swal } = await import('sweetalert2');
        const result = await Swal.fire({
            title: 'Welcome to PRISM! 👋',
            text: 'Would you like to take a quick tour?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, show me around!',
            cancelButtonText: 'Maybe later',
            confirmButtonColor: '#1976D2',
            cancelButtonColor: '#6c757d'
        });

        if (result.isConfirmed) {
            return true;
        } else {
            this.markTutorialCompleted();
            return false;
        }
    }
}