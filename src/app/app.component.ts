import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SeoService } from './services/seo.service';
import { PwaService } from './services/pwa.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'PRISM - AI-Powered Assessment Platform | Gordon College CCS';

  constructor(
    private seoService: SeoService,
    private router: Router,
    private pwaService: PwaService
  ) { }

  ngOnInit() {
    this.seoService.setDefaultMeta();

    // Initialize PWA monitoring
    this.initializePWAMonitoring();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // console.log('Navigation completed to:', event.url);
    });
  }

  private async initializePWAMonitoring(): Promise<void> {
    try {
      // Get comprehensive debug info
      const debugInfo = await this.pwaService.getDebugInfo();

      console.group('🚀 PRISM PWA Status');
      console.log('📱 PWA Installed:', debugInfo.pwa.isInstalled);
      console.log('⚙️ Service Worker Active:', debugInfo.serviceWorker.active);
      console.log('🖥️ Display Mode:', debugInfo.pwa.displayMode);
      console.log('🔧 Service Worker Details:', debugInfo.serviceWorker);
      console.groupEnd();

      // Monitor PWA installation status
      this.pwaService.isInstalled.subscribe(isInstalled => {
        if (isInstalled) {
          console.log('✅ App is now running as PWA - Service Worker should be active');
        } else {
          console.log('🌐 App is running in browser mode - Service Worker is disabled');
        }
      });

      // Monitor installation availability
      this.pwaService.isInstallable.subscribe(isInstallable => {
        if (isInstallable) {
          console.log('💾 App can be installed as PWA');
        }
      });

    } catch (error) {
      console.error('Error initializing PWA monitoring:', error);
    }
  }
}
