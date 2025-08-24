import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TitleService {
  private defaultTitle = 'PRISM - AI-Powered Assessment Platform | Gordon College CCS';

  constructor(
    private titleService: Title,
    private router: Router
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateTitle();
    });
  }

  private updateTitle() {
    const route = this.router.url;
    let title = this.defaultTitle;

    const titleMap: { [key: string]: string } = {
      '/login': 'Login - PRISM Assessment Platform | Gordon College CCS',
      '/verify-email': 'Verify Email - PRISM Assessment Platform | Gordon College CCS',
      '/forgot-password': 'Reset Password - PRISM Assessment Platform | Gordon College CCS',
      '/instructor': 'Instructor Dashboard - PRISM Assessment Platform | Gordon College CCS',
      '/student': 'Student Dashboard - PRISM Assessment Platform | Gordon College CCS',
      '/admin': 'PRISM | Admin',
      '/join': 'PRISM | Join'
    };

    for (const [routePath, routeTitle] of Object.entries(titleMap)) {
      if (route.startsWith(routePath)) {
        title = routeTitle;
        break;
      }
    }

    this.titleService.setTitle(title);
  }

  setTitle(title: string) {
    this.titleService.setTitle(`${title} | PRISM - Gordon College CCS`);
  }
} 