import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorialService } from '../../../services/tutorial.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-tutorial-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="shouldShowPrompt" 
      class="tutorial-prompt-overlay"
      (click)="onOverlayClick()"
    >
      <div class="tutorial-prompt-modal" (click)="$event.stopPropagation()">
        <!-- Header with gradient background -->
        <div class="tutorial-prompt-header">
          <div class="header-content">
            <div class="welcome-icon">
              <i class="fas fa-graduation-cap"></i>
            </div>
            <div class="header-text">
              <h3>Welcome to PRISM!</h3>
              <div class="role-badge">{{ userRole | titlecase }} Dashboard</div>
            </div>
          </div>
          <button 
            class="close-btn" 
            (click)="dismissPrompt()"
            aria-label="Close"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="tutorial-prompt-content">
          <p class="intro-text">
            Ready to explore? Take a quick interactive tour to discover 
            all the features available in your dashboard.
          </p>
          
          <div class="feature-highlights">
            <div class="feature-item" *ngFor="let feature of getFeatureHighlights()">
              <div class="feature-icon">
                <i [class]="feature.icon"></i>
              </div>
              <span class="feature-text">{{ feature.text }}</span>
            </div>
          </div>
          
          <div class="tour-info">
            <i class="fas fa-info-circle"></i>
            <span>Interactive tour takes about 2-3 minutes</span>
          </div>
        </div>
        
        <div class="tutorial-prompt-actions">
          <button 
            class="btn btn-secondary" 
            (click)="dismissPrompt()"
          >
            <i class="fas fa-clock"></i>
            Maybe Later
          </button>
          <button 
            class="btn btn-primary" 
            (click)="startTutorial()"
          >
            <i class="fas fa-play"></i>
            Start Tour
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tutorial-prompt-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(1px);
      padding: 16px;
    }

    .tutorial-prompt-modal {
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15);
      max-width: 520px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-30px) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .tutorial-prompt-header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
      overflow: hidden;
    }

    .tutorial-prompt-header::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 100px;
      height: 100px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      transform: translate(30px, -30px);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 1;
    }

    .welcome-icon {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
      backdrop-filter: blur(10px);
    }

    .header-text h3 {
      margin: 0 0 4px 0;
      color: white;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .role-badge {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      backdrop-filter: blur(10px);
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      z-index: 1;
      backdrop-filter: blur(10px);
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }

    .tutorial-prompt-content {
      padding: 32px 24px 24px;
    }

    .intro-text {
      color: #4b5563;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 24px 0;
      text-align: center;
    }

    .feature-highlights {
      display: grid;
      gap: 16px;
      margin-bottom: 24px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      transition: all 0.2s;
    }

    .feature-item:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      transform: translateY(-1px);
    }

    .feature-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      flex-shrink: 0;
    }

    .feature-text {
      color: #374151;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
    }

    .tour-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      color: #6366f1;
      font-size: 13px;
      font-weight: 500;
    }

    .tour-info i {
      font-size: 14px;
    }

    .tutorial-prompt-actions {
      padding: 0 24px 24px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      border: none;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-width: 120px;
    }

    .btn-secondary {
      background: #f8fafc;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #475569;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.35);
    }

    .btn-primary:active {
      transform: translateY(0);
    }

    /* Responsive Design */
    @media (max-width: 640px) {
      .tutorial-prompt-overlay {
        padding: 12px;
      }
      
      .tutorial-prompt-modal {
        max-width: 100%;
        border-radius: 12px;
      }
      
      .tutorial-prompt-header {
        padding: 20px;
      }
      
      .welcome-icon {
        width: 40px;
        height: 40px;
        font-size: 18px;
      }
      
      .header-text h3 {
        font-size: 20px;
      }
      
      .tutorial-prompt-content {
        padding: 24px 20px 20px;
      }
      
      .intro-text {
        font-size: 15px;
      }
      
      .feature-item {
        padding: 12px;
      }
      
      .feature-icon {
        width: 36px;
        height: 36px;
        font-size: 14px;
      }
      
      .feature-text {
        font-size: 13px;
      }
      
      .tutorial-prompt-actions {
        padding: 0 20px 20px;
        flex-direction: column-reverse;
        gap: 8px;
      }
      
      .btn {
        width: 100%;
        min-width: auto;
      }
    }

    @media (max-width: 480px) {
      .header-content {
        gap: 12px;
      }
      
      .feature-highlights {
        gap: 12px;
      }
      
      .feature-item {
        padding: 10px;
      }
    }
  `]
})
export class TutorialPromptComponent implements OnInit {
  private tutorialService = inject(TutorialService);
  private authService = inject(AuthService);

  shouldShowPrompt = false;
  userRole: string | null = null;

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    setTimeout(() => {
      this.shouldShowPrompt = this.tutorialService.shouldShowTutorialPrompt();
    }, 1000);
  }

  async startTutorial(): Promise<void> {
    this.shouldShowPrompt = false;
    setTimeout(() => {
      this.tutorialService.startTutorial();
    }, 300);
  }

  dismissPrompt(): void {
    this.shouldShowPrompt = false;
    this.tutorialService.markTutorialCompleted();
    localStorage.setItem('showTutorial', 'false');
  }

  onOverlayClick(): void {
    this.dismissPrompt();
  }

  getFeatureHighlights(): { icon: string; text: string }[] {
    switch (this.userRole) {
      case 'student':
        return [
          { icon: 'fas fa-book', text: 'Access your classes and assignments' },
          { icon: 'fas fa-chart-line', text: 'Track your assessment progress' },
          { icon: 'fas fa-history', text: 'Review your academic history' }
        ];
      case 'instructor':
        return [
          { icon: 'fas fa-users', text: 'Manage students and classes' },
          { icon: 'fas fa-plus-circle', text: 'Create AI-powered assessments' },
          { icon: 'fas fa-award', text: 'Assign your Assessments' }
        ];
      case 'admin':
        return [
          { icon: 'fas fa-cog', text: 'Configure system settings' },
          { icon: 'fas fa-users-cog', text: 'Manage all platform users' },
          { icon: 'fas fa-chart-bar', text: 'Monitor platform analytics' }
        ];
      default:
        return [];
    }
  }
}
