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
            <i class="fas fa-file-export"></i>
            Export Assessment
          </h3>
          <button (click)="closeModal()" class="close-btn" title="Close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- Export Format Selection -->
          <div class="section">
            <label class="section-title">
              <i class="fas fa-download"></i>
              Export Format
            </label>
            <div class="format-grid">
              <label class="format-card" [class.active]="exportOptions.format === 'print'">
                <input type="radio" name="format" value="print" [(ngModel)]="exportOptions.format">
                <div class="format-icon print"><i class="fas fa-print"></i></div>
                <span>Print</span>
              </label>
              <label class="format-card" [class.active]="exportOptions.format === 'word'">
                <input type="radio" name="format" value="word" [(ngModel)]="exportOptions.format">
                <div class="format-icon word"><i class="fas fa-file-word"></i></div>
                <span>Word</span>
              </label>
            </div>
          </div>
          <!-- Assessment Header Customization -->
          <div class="section" *ngIf="exportOptions.format !== 'word'">
            <div class="toggle-header">
              <label class="section-title">
                <i class="fas fa-heading"></i>
                Assessment Header
              </label>
              <label class="toggle-switch">
                <input type="checkbox" [(ngModel)]="customizeHeader">
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div *ngIf="customizeHeader" class="header-fields">
              <div class="field-row">
                <div class="field-group full">
                  <label>Course Title</label>
                  <input type="text" [(ngModel)]="exportOptions.courseTitle" placeholder="e.g., Information Assurance" class="input-field">
                </div>
              </div>
              
              <div class="field-row">
                <div class="field-group">
                  <label>Assessment Type</label>
                  <select [(ngModel)]="exportOptions.assessmentType" class="input-field">
                    <option value="">Select type...</option>
                    <option value="MIDTERM">MIDTERM</option>
                    <option value="FINAL EXAM">FINAL EXAM</option>
                    <option value="QUIZ">QUIZ</option>
                    <option value="ASSESSMENT">ASSESSMENT</option>
                    <option value="LONG QUIZ">LONG QUIZ</option>
                    <option value="SHORT QUIZ">SHORT QUIZ</option>
                  </select>
                </div>
                <div class="field-group" *ngIf="showAssessmentNumber()">
                  <label>Number</label>
                  <input type="text" [(ngModel)]="exportOptions.assessmentNumber" placeholder="1, 2, I, II" class="input-field">
                </div>
              </div>
              
              <div class="field-row">
                <div class="field-group">
                  <label>Term</label>
                  <select [(ngModel)]="exportOptions.term" class="input-field">
                    <option value="">Select term...</option>
                    <option value="MIDYEAR">MIDYEAR</option>
                    <option value="1ST SEMESTER">1ST SEMESTER</option>
                    <option value="2ND SEMESTER">2ND SEMESTER</option>
                    <option value="SUMMER">SUMMER</option>
                  </select>
                </div>
                <div class="field-group">
                  <label>Academic Year</label>
                  <select [(ngModel)]="exportOptions.academicYear" class="input-field">
                    <option value="S.Y. 2025-2026">S.Y. 2025-2026</option>
                    <option value="S.Y. 2026-2027">S.Y. 2026-2027</option>
                    <option value="S.Y. 2027-2028">S.Y. 2027-2028</option>
                    <option value="S.Y. 2028-2029">S.Y. 2028-2029</option>
                    <option value="S.Y. 2029-2030">S.Y. 2029-2030</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Export Options -->
          <div class="section">
            <label class="section-title">
              <i class="fas fa-cogs"></i>
              Options
            </label>
            <div class="options-grid">
              <label class="option-card">
                <input type="checkbox" [(ngModel)]="exportOptions.segregateByType">
                <div class="option-content">
                  <i class="fas fa-layer-group"></i>
                  <span>Group by Type</span>
                </div>
              </label>
              <label class="option-card">
                <input type="checkbox" [(ngModel)]="exportOptions.includeAnswerKey">
                <div class="option-content">
                  <i class="fas fa-key"></i>
                  <span>Answer Key</span>
                </div>
              </label>
              <label class="option-card" *ngIf="exportOptions.format !== 'word'">
                <input type="checkbox" [(ngModel)]="exportOptions.useColumnLayout">
                <div class="option-content">
                  <i class="fas fa-columns"></i>
                  <span>Two Columns</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Instructions -->
          <div class="section">
            <label class="section-title">
              <i class="fas fa-edit"></i>
              Instructions
            </label>
            <textarea 
              [(ngModel)]="exportOptions.generalInstructions"
              placeholder="Enter exam instructions..."
              class="instructions-field"
              rows="3"></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="closeModal()" class="btn-secondary">
            Cancel
          </button>
          <button (click)="confirmExport()" class="btn-primary" [disabled]="isExporting">
            <i class="fas fa-spinner fa-spin" *ngIf="isExporting"></i>
            <i class="fas fa-download" *ngIf="!isExporting"></i>
            {{ isExporting ? 'Exporting...' : 'Export' }}
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
      border-radius: 16px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
      width: 100%;
      max-width: 700px;
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      font-size: 16px;
      color: white;
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .modal-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }

    /* New Compact Styles */
    .section {
      margin-bottom: 16px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
    }

    .section-title i {
      color: #667eea;
    }

    /* Format Grid */
    .format-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .format-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 18px 12px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      background: #fafafa;
    }

    .format-card input {
      display: none;
    }

    .format-card.active {
      border-color: #667eea;
      background: #f0f4ff;
    }

    .format-icon {
      width: 42px;
      height: 42px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      color: white;
      font-size: 20px;
    }

    .format-icon.print { background: #38a169; }
    .format-icon.word { background: #2b6cb0; }

    .format-card span {
      font-size: 14px;
      font-weight: 600;
      color: #4a5568;
    }

    /* Toggle Header */
    .toggle-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #cbd5e0;
      transition: 0.3s;
      border-radius: 24px;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }

    .toggle-switch input:checked + .toggle-slider {
      background-color: #667eea;
    }

    .toggle-switch input:checked + .toggle-slider:before {
      transform: translateX(20px);
    }

    /* Header Fields */
    .header-fields {
      margin-top: 12px;
    }

    .field-row {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }

    .field-group {
      flex: 1;
    }

    .field-group.full {
      flex: 1 1 100%;
    }

    .field-group label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: #4a5568;
      margin-bottom: 4px;
    }

    .input-field {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    .input-field:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    /* Options Grid */
    .options-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }

    .option-card {
      display: flex;
      align-items: center;
      padding: 12px 10px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      background: #fafafa;
    }

    .option-card input {
      display: none;
    }

    .option-card input:checked + .option-content {
      color: #667eea;
    }

    .option-card:has(input:checked) {
      border-color: #667eea;
      background: #f0f4ff;
    }

    .option-content {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
    }

    .option-content i {
      font-size: 16px;
    }

    /* Instructions Field */
    .instructions-field {
      width: 100%;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      resize: vertical;
      font-family: inherit;
    }

    .instructions-field:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    /* Modal Footer */
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid #e5e7eb;
      background: #fafafa;
    }

    .btn-secondary {
      padding: 10px 20px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      color: #4a5568;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: #f7fafc;
      border-color: #a0aec0;
    }

    .btn-primary {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  `]
})
export class ExportModalComponent {
  @Input() isVisible = false;
  @Output() export = new EventEmitter<ExportOptions>();
  @Output() close = new EventEmitter<void>();

  isExporting = false;
  customizeHeader = false;

  exportOptions: ExportOptions = {
    format: 'print',
    segregateByType: false,
    includeAnswerKey: false,
    useColumnLayout: false,
    courseTitle: '',
    assessmentType: '',
    assessmentNumber: '',
    term: '',
    academicYear: 'S.Y. 2025-2026',
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

  showAssessmentNumber(): boolean {
    const type = this.exportOptions.assessmentType.toLowerCase();
    return type.includes('quiz') || type.includes('assessment');
  }

  async confirmExport(): Promise<void> {
    this.isExporting = true;
    try {
      this.export.emit({ ...this.exportOptions });
    } finally {
      setTimeout(() => {
        this.isExporting = false;
        this.closeModal();
      }, 1000);
    }
  }
}
