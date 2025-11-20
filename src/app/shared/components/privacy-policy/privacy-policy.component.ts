import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-privacy-policy',
    imports: [CommonModule],
    templateUrl: './privacy-policy.component.html',
    styleUrl: './privacy-policy.component.scss',
})
export class PrivacyPolicyComponent {
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

