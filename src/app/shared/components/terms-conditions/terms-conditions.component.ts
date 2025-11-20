import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-terms-conditions',
    imports: [CommonModule],
    templateUrl: './terms-conditions.component.html',
    styleUrl: './terms-conditions.component.scss',
})
export class TermsConditionsComponent {
    @Output() closeModal = new EventEmitter<void>();

    isVisible = signal(false);

    open(): void {
        this.isVisible.set(true);
        document.body.style.overflow = 'hidden';
    }

    close(): void {
        this.isVisible.set(false);
        document.body.style.overflow = 'auto';
        this.closeModal.emit();
    }

    onBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.close();
        }
    }
}

