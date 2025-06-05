import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  constructor(
    private meta: Meta,
    private title: Title,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  updateSEO(data: {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: string;
    author?: string;
    publishedDate?: string;
  }): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Update title
    if (data.title) {
      this.title.setTitle(`${data.title} | PRISM Assessment Platform`);
      this.meta.updateTag({ property: 'og:title', content: data.title });
      this.meta.updateTag({ name: 'twitter:title', content: data.title });
    }

    // Update description
    if (data.description) {
      this.meta.updateTag({ name: 'description', content: data.description });
      this.meta.updateTag({ property: 'og:description', content: data.description });
      this.meta.updateTag({ name: 'twitter:description', content: data.description });
    }

    // Update keywords
    if (data.keywords) {
      this.meta.updateTag({ name: 'keywords', content: data.keywords });
    }

    // Update image with proper dimensions
    if (data.image) {
      this.meta.updateTag({ property: 'og:image', content: data.image });
      this.meta.updateTag({ property: 'og:image:width', content: '1200' });
      this.meta.updateTag({ property: 'og:image:height', content: '630' });
      this.meta.updateTag({ name: 'twitter:image', content: data.image });
      this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    }

    // Update URL and canonical
    const currentUrl = data.url || (typeof window !== 'undefined' ? window.location.href : '');
    if (currentUrl) {
      this.meta.updateTag({ property: 'og:url', content: currentUrl });
      this.meta.updateTag({ rel: 'canonical', href: currentUrl });
    }

    // Enhanced Open Graph tags
    this.meta.updateTag({ property: 'og:site_name', content: 'PRISM Assessment Platform' });
    this.meta.updateTag({ property: 'og:type', content: data.type || 'website' });
    this.meta.updateTag({ property: 'og:locale', content: 'en_US' });

    // Twitter Card enhancements
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:site', content: '@PrismAssessment' });

    // SEO enhancements
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({ name: 'author', content: data.author || 'PRISM Assessment Platform' });
    
    if (data.publishedDate) {
      this.meta.updateTag({ name: 'article:published_time', content: data.publishedDate });
    }

    // Add structured data
    this.addStructuredData(data);
  }

  private addStructuredData(data: any): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const currentUrl = data.url || (typeof window !== 'undefined' ? window.location.href : '');
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "PRISM | Gordon College",
      "description": data.description || "Advanced assessment and evaluation platform for educational institutions",
      "url": currentUrl,
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "Web Browser",
      "author": {
        "@type": "Organization",
        "name": "PRISM Assessment Platform"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "150"
      },
      "potentialAction": {
        "@type": "UseAction",
        "target": currentUrl
      }
    };

    // Remove existing structured data
    const existing = document.querySelector('script[type="application/ld+json"]');
    if (existing) {
      existing.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }

  // Add method to set default meta tags
  setDefaultMeta(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.meta.addTag({ name: 'viewport', content: 'width=device-width, initial-scale=1' });
    this.meta.addTag({ charset: 'utf-8' });
    this.meta.addTag({ name: 'theme-color', content: '#1976d2' });
    this.meta.addTag({ name: 'msapplication-TileColor', content: '#1976d2' });
  }
}
