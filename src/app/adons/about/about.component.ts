import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-about',
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit {
  keywords = [
    'Artificial Intelligence in Education',
    'Online Assessment System',
    'Technostress',
    'Technology Acceptance Model (TAM)',
    'Online Proctoring',
    'Educational Technology',
  ];

  private structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PRISM - Platform for Real-Time Intelligent Student Measurement System',
    description: 'AI-integrated real-time online assessment and performance monitoring system for educational institutions using Retrieval-Augmented Generation and real-time proctoring',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web-based (Windows, macOS, Linux)',
    author: {
      '@type': 'Person',
      name: 'Frederick S. Ancias',
      affiliation: {
        '@type': 'Organization',
        name: 'Gordon College - College of Computer Studies'
      }
    },
    creator: [
      {
        '@type': 'Person',
        name: 'Frederick S. Ancias',
        email: '202210761@gordoncollege.edu.ph'
      },
      {
        '@type': 'Person',
        name: 'Menard Manlapaz',
        email: 'menardmanlapaz1@gmail.com'
      },
      {
        '@type': 'Person',
        name: 'Denise Lou Punzalan',
        email: 'punzalan.deniselou@gordoncollege.edu.ph'
      }
    ],
    keywords: 'Artificial Intelligence in Education, Online Assessment System, Technostress, Technology Acceptance Model, Online Proctoring, Educational Technology, MEAN Stack, RAG, Real-Time Proctoring, Academic Integrity',
    datePublished: '2025',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '3.28',
      ratingCount: '317',
      bestRating: '4',
      worstRating: '1'
    }
  };

  constructor(
    private route: ActivatedRoute,
    private seoService: SeoService,
    private router: Router
  ) { }

  ngOnInit() {
    const seoData = this.route.snapshot.data['seo'];
    if (seoData) {
      this.seoService.updateSEO(seoData);
    }
    this.addStructuredData();
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  private addStructuredData(): void {
    const existing = document.querySelector('script[type="application/ld+json"]');
    if (existing) {
      existing.remove();
    }
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(this.structuredData);
    document.head.appendChild(script);
  }
}
