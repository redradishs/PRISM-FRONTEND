import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-component-testing',
  templateUrl: './component-testing.component.html',
  styleUrls: ['./component-testing.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ComponentTestingComponent {
}