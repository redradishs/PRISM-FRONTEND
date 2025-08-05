import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExportOptions } from '../../services/export.service';

@Component({
    selector: 'app-export-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div *ngIf="isVisible" class="export-modal-overlay">
      <div class="export-modal">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fas fa-file-export mr-2 text-blue-500"></i>
            Export Assessment
          </h3>
          <button (click)="closeModal()" class="close-btn" title="Close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- Export Format Selection -->
          <div class="form-section">
            <label class="section-label">
              <i class="fas fa-file-alt mr-2"></i>
              Export Format
            </label>
            <div class="format-options">
              <label class="format-option">
                <input 
                  type="radio" 
                  name="format" 
                  value="pdf" 
                  [(ngModel)]="exportOptions.format"
                  class="radio-input">
                <div class="format-content">
                  <div class="format-header">
                    <i class="fas fa-file-pdf text-red-500 mr-2"></i>
                    <span class="format-title">PDF Export</span>
                  </div>
                  <span class="format-description">Generate a downloadable PDF file using pdfMake</span>
                </div>
              </label>
              <label class="format-option">
                <input 
                  type="radio" 
                  name="format" 
                  value="print" 
                  [(ngModel)]="exportOptions.format"
                  class="radio-input">
                <div class="format-content">
                  <div class="format-header">
                    <i class="fas fa-print text-green-500 mr-2"></i>
                    <span class="format-title">Print Layout</span>
                  </div>
                  <span class="format-description">Open browser print dialog with perfect column layout</span>
                </div>
              </label>
            </div>
          </div>
          <!-- Student Information -->
          <div class="form-section">
            <label class="section-label">
              <i class="fas fa-user-graduate mr-2"></i>
              Student Information Fields
            </label>
            <p class="info-text">These fields will appear as blank lines in the exported PDF for students to fill in manually.</p>
          </div>

          <!-- General Instructions -->
          <div class="form-section">
            <label class="section-label">
              <i class="fas fa-list-ul mr-2"></i>
              General Instructions
            </label>
            <textarea 
              [(ngModel)]="exportOptions.generalInstructions"
              placeholder="Enter general instructions for the exam (e.g., Read each question carefully, Choose the best answer, etc.)"
              class="form-textarea"
              rows="4"></textarea>
          </div>

          <!-- Export Options -->
          <div class="form-section">
            <label class="section-label">
              <i class="fas fa-cogs mr-2"></i>
              Export Options
            </label>
            <div class="checkbox-group">
              <label class="checkbox-item">
                <div class="checkbox-header">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="exportOptions.segregateByType"
                    class="checkbox-input">
                  <span class="checkbox-label">Group questions by type (Multiple Choice, True/False, etc.)</span>
                </div>
                <span class="checkbox-description">Organizes questions into sections with Roman numerals</span>
              </label>
              <label class="checkbox-item">
                <div class="checkbox-header">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="exportOptions.includeAnswerKey"
                    class="checkbox-input">
                  <span class="checkbox-label">Include answer key on separate page</span>
                </div>
                <span class="checkbox-description">Creates a dedicated answer key page at the end</span>
              </label>
              <label class="checkbox-item">
                <div class="checkbox-header">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="exportOptions.useColumnLayout"
                    class="checkbox-input">
                  <span class="checkbox-label">Use 2-column layout for compact display</span>
                </div>
                <span class="checkbox-description">Fits more questions per page (except for True/False which auto-columns when 6+)</span>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="closeModal()" class="btn btn-secondary">
            <i class="fas fa-times mr-2"></i>
            Cancel
          </button>
          <button (click)="confirmExport()" class="btn btn-primary" [disabled]="isExporting">
            <i class="fas fa-file-pdf mr-2" *ngIf="!isExporting && exportOptions.format === 'pdf'"></i>
            <i class="fas fa-print mr-2" *ngIf="!isExporting && exportOptions.format === 'print'"></i>
            <i class="fas fa-spinner fa-spin mr-2" *ngIf="isExporting"></i>
            <span *ngIf="isExporting">
              {{ exportOptions.format === 'pdf' ? 'Generating PDF...' : 'Opening Print Preview...' }}
            </span>
            <span *ngIf="!isExporting">
              {{ exportOptions.format === 'pdf' ? 'Export to PDF' : 'Open Print Preview' }}
            </span>
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .export-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .export-modal {
      background: white;
      border-radius: 12px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
      width: 100%;
      max-width: 600px;
      max-height: 85vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0;
      display: flex;
      align-items: center;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 16px;
      color: #6b7280;
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #e5e7eb;
      color: #374151;
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .form-section {
      margin-bottom: 24px;
    }

    .section-label {
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
    }

    .section-label i {
      color: #6366f1;
    }

    .text-red-500 {
      color: #ef4444 !important;
    }

    .text-blue-500 {
      color: #3b82f6 !important;
    }

    .text-green-500 {
      color: #10b981 !important;
    }

    .format-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .format-option {
      cursor: pointer;
      padding: 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      transition: all 0.2s;
      background: #fafafa;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .format-option:hover {
      border-color: #d1d5db;
      background: #f9fafb;
    }

    .format-option:has(input:checked) {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .radio-input {
      margin-top: 2px;
      width: 18px;
      height: 18px;
      accent-color: #3b82f6;
      flex-shrink: 0;
    }

    .format-content {
      flex: 1;
    }

    .format-header {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }

    .format-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .format-option:has(input:checked) .format-title {
      color: #3b82f6;
    }

    .format-description {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
    }

    .format-option:has(input:checked) .format-description {
      color: #1e40af;
    }

    .student-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 640px) {
      .student-info-grid {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      font-size: 12px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }

    .form-input, .form-textarea {
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.2s;
      background: white;
    }

    .form-input:focus, .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
      font-family: inherit;
      width: 100%;
      box-sizing: border-box;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .checkbox-item {
      cursor: pointer;
      padding: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      transition: all 0.2s;
      background: #fafafa;
    }

    .checkbox-item:hover {
      border-color: #d1d5db;
      background: #f9fafb;
    }

    .checkbox-header {
      display: flex;
      align-items: center;
      margin-bottom: 6px;
    }

    .checkbox-input {
      margin-right: 12px;
      width: 18px;
      height: 18px;
      accent-color: #3b82f6;
      flex-shrink: 0;
    }

    .checkbox-label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      flex: 1;
    }

    .checkbox-item input:checked + .checkbox-label {
      color: #3b82f6;
      font-weight: 600;
    }

    .checkbox-description {
      font-size: 12px;
      color: #6b7280;
      margin-left: 30px;
      font-style: italic;
      line-height: 1.4;
    }

    /* Modern browsers with :has() support */
    .checkbox-item:has(input:checked) .checkbox-description {
      color: #1e40af;
    }

    /* Fallback for older browsers */
    .checkbox-item input:checked ~ .checkbox-description {
      color: #1e40af;
    }

    .info-text {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
      padding: 12px;
      background: #f0f9ff;
      border: 1px solid #e0f2fe;
      border-radius: 6px;
      border-left: 4px solid #0ea5e9;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 24px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
      display: flex;
      align-items: center;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border-color: #d1d5db;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .mr-2 {
      margin-right: 8px;
    }
  `]
})
export class ExportModalComponent {
    @Input() isVisible = false;
    @Output() export = new EventEmitter<ExportOptions>();
    @Output() close = new EventEmitter<void>();

    isExporting = false;

    exportOptions: ExportOptions = {
        format: 'pdf',
        segregateByType: false,
        includeAnswerKey: false,
        useColumnLayout: false,
        studentInfo: {
            name: '',
            yearCourseBlock: '',
            date: '',
            score: ''
        },
        generalInstructions: 'Read each question carefully and choose the best answer. Write your answers clearly and legibly.'
    };

    closeModal(): void {
        this.close.emit();
    }

    async confirmExport(): Promise<void> {
        this.isExporting = true;
        try {
            this.export.emit({ ...this.exportOptions });
        } finally {
            // Reset after a short delay to show the export feedback
            setTimeout(() => {
                this.isExporting = false;
                this.closeModal();
            }, 1000);
        }
    }
}
