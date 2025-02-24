import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-test',
  imports: [CommonModule, FormsModule],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class TestComponent {
  cheatingCount = 0;
  cheatMessage: string = '';

  constructor() { 
    this.loadCheatingCount();
  }

  @HostListener('document:visibilitychange', ['$event'])
  handleVisibilityChange(event: Event) {
    if (document.hidden) {
      this.registerCheating('Switched tabs');
    }
  }

  @HostListener('window:blur', ['$event'])
  onWindowBlur(event: Event) {
    this.registerCheating('Lost focus (possibly using another app or split screen)');
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event) {
    if (window.innerWidth < 800 || window.innerHeight < 600) { // Adjust size as needed
      this.registerCheating('Possible split-screen usage detected');
    }
  }

  registerCheating(reason: string) {
    this.cheatingCount++;
    this.cheatMessage = `Cheating Detected! ${reason}. You have attempted to cheat ${this.cheatingCount} times.`;
    localStorage.setItem('cheatingCount', this.cheatingCount.toString()); // Save to localStorage

    console.warn(this.cheatMessage);

    if (this.cheatingCount > 5) {
      // alert('Cheating Detected! You have attempted to cheat more than 5 times.');
      // You can also send this data to your backend
    }
  }

  loadCheatingCount() {
    const savedCount = localStorage.getItem('cheatingCount');
    if (savedCount) {
      this.cheatingCount = parseInt(savedCount, 10);
    }
  }
}
