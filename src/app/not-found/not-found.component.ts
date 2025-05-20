import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
export class NotFoundComponent {

} 