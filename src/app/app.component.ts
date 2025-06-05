import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SeoService } from './services/seo.service';
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
    private router: Router
  ) {}

  ngOnInit() {
    this.seoService.setDefaultMeta();
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // console.log('Navigation completed to:', event.url);
    });
  }
}
