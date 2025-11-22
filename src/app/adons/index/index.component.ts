import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PrivacyPolicyComponent, TermsConditionsComponent } from '../../shared/components';
import { RollingNumberComponent } from '../../shared/components/rolling-number/rolling-number.component';

@Component({
  selector: 'app-index',
  imports: [CommonModule, PrivacyPolicyComponent, TermsConditionsComponent, RollingNumberComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css'
})
export class IndexComponent implements OnInit {
  visitCount = signal(0);
  animatedCount = signal(0);

  totalVisitCount: number = 0;

  features = [
    {
      icon: '🤖',
      title: 'AI Powered System',
      description: 'PRISM uses AI to generate assessments, give insights, and check non object based questions.'
    },
    {
      icon: '⚡',
      title: 'Real Time Result',
      description: 'Create and deploy assessments instantly with live monitoring and immediate feedback for students.'
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Track progress with detailed reports, performance metrics, and data visualization tools.'
    },
    {
      icon: '🔒',
      title: 'Secure Platform',
      description: 'PRISM uses strong encryption and secure authentication to protect your data and privacy.'
    },
    {
      icon: '👥',
      title: 'Collaborative Assessment',
      description: 'Create your own assessments and share them with your students or even other Instructors.'
    },
    {
      icon: '📱',
      title: 'Mobile Responsive',
      description: 'PWA enabled,Access PRISM anywhere, anytime with our fully responsive design that works on any devices that has browser and internet connection.'
    }
  ];

  stats = [
    { label: 'Active Users', value: '500+', icon: '👤' },
    { label: 'Assessments Created', value: '1,200+', icon: '📝' },
    { label: 'Hours Saved', value: '5,000+', icon: '⏱️' },
    { label: 'Success Rate', value: '98%', icon: '✨' }
  ];

  constructor(private router: Router, private api: AuthService) { }
  @ViewChild(PrivacyPolicyComponent) privacyPolicyModal!: PrivacyPolicyComponent;
  @ViewChild(TermsConditionsComponent) termsConditionsModal!: TermsConditionsComponent;

  ngOnInit(): void {
    this.addVisitCount();
    this.animateCounter();
  }

  addVisitCount(): void {
    this.api.addVisitCount().subscribe({
      next: (resp: any) => {
        // console.log(resp);
        this.getVisitCounts();
      }, error: (err: any) => {
        console.error(err);
      }
    })
  }


  getVisitCounts() {
    this.api.getVisitCounts().subscribe({
      next: (resp: any) => {
        this.totalVisitCount = resp.data.total;
      }, error: (err: any) => {
        console.error(err);
      }
    })
  }

  animateCounter(): void {
    const target = this.visitCount();
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        this.animatedCount.set(target);
        clearInterval(interval);
      } else {
        this.animatedCount.set(Math.floor(current));
      }
    }, duration / steps);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  scrollToFeatures(): void {
    const element = document.getElementById('features');
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  openPrivacyPolicy(): void {
    this.privacyPolicyModal?.open();
  }

  openTermsConditions(): void {
    this.termsConditionsModal?.open();
  }
}
