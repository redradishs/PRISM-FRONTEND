import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from '../services/seo.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="not-found-container">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for doesn't exist or has been moved.</p>
      <p>You will be redirected to the appropriate page...</p>
    </div>
  `,
  styles: [`
    .not-found-container {
      text-align: center;
      padding: 100px 20px;
      font-family: Arial, sans-serif;
    }
    h1 {
      color: #6C5CE7;
      font-size: 2rem;
      margin-bottom: 20px;
    }
    p {
      color: #666;
      margin-bottom: 10px;
    }
  `]
})
export class NotFoundComponent implements OnInit {
  constructor(
    private seoService: SeoService,
    private route: ActivatedRoute,
    private auth: AuthService
  ) { }

  ngOnInit() {
    const seoData = this.route.snapshot.data['seo'];
    if (seoData) {
      this.seoService.updateSEO({
        ...seoData,
        image: this.auth.domainCaller('/prism_logo.png')
      });
    }
  }
}