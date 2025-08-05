import { Injectable, ComponentRef, ViewContainerRef, ApplicationRef } from '@angular/core';
import { PrintLayoutComponent, PrintAssessmentData, PrintOptions } from './print-layout.component';

@Injectable({
    providedIn: 'root'
})
export class PrintService {

    constructor(private appRef: ApplicationRef) { }

    async openPrintPreview(data: PrintAssessmentData, options: PrintOptions): Promise<void> {
        // Create a new window for the print preview
        const printWindow = window.open('', '_blank', 'width=800,height=600');

        if (!printWindow) {
            throw new Error('Unable to open print window. Please check popup blocker settings.');
        }

        // Create the HTML content for the print window
        const htmlContent = this.generatePrintHTML(data, options);

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for content to load, then focus and print
        printWindow.onload = () => {
            printWindow.focus();
            // Automatically trigger print dialog after a short delay
            setTimeout(() => {
                printWindow.print();
            }, 500);
        };
    }

    async printDirectly(data: PrintAssessmentData, options: PrintOptions): Promise<void> {
        // Create a temporary div to hold the print content
        const printDiv = document.createElement('div');
        printDiv.innerHTML = this.generatePrintContent(data, options);
        printDiv.style.display = 'none';

        // Add to body
        document.body.appendChild(printDiv);

        // Store original content
        const originalContent = document.body.innerHTML;

        // Replace body content with print content
        document.body.innerHTML = printDiv.innerHTML;

        // Trigger print
        window.print();

        // Restore original content
        document.body.innerHTML = originalContent;

        // Clean up
        if (printDiv.parentNode) {
            printDiv.parentNode.removeChild(printDiv);
        }
    }

    private generatePrintHTML(data: PrintAssessmentData, options: PrintOptions): string {
        const printContent = this.generatePrintContent(data, options);
        const cssContent = this.getPrintCSS();

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${data.title} - Assessment</title>
        <style>
          ${cssContent}
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `;
    }

    private generatePrintContent(data: PrintAssessmentData, options: PrintOptions): string {
        const questionsByType = this.groupQuestionsByType(data.questions);

        let html = `<div class="print-container ${options.useColumnLayout ? 'column-layout' : ''}">`;

        // Header Section
        html += `
      <div class="header">
        <h1 class="title">${data.title}</h1>
        
        <div class="student-info">
          <div class="info-row">
            <div class="info-field">
              <span class="label">Name:</span>
              <span class="line">________________________________</span>
            </div>
            <div class="info-field">
              <span class="label">Date:</span>
              <span class="line">________________________________</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-field">
              <span class="label">Year, Course & Block:</span>
              <span class="line">________________________________</span>
            </div>
            <div class="info-field">
              <span class="label">Score:</span>
              <span class="line">________________________________</span>
            </div>
          </div>
        </div>
    `;

        if (options.generalInstructions) {
            html += `
        <div class="instructions">
          <span class="instructions-label">General Instructions:</span>
          ${options.generalInstructions}
        </div>
      `;
        }

        html += `</div>`; // Close header

        // Questions Section
        html += `<div class="questions-container ${options.useColumnLayout ? 'columns' : ''}">`;

        if (options.segregateByType) {
            Object.keys(questionsByType).forEach((type, typeIndex) => {
                const typeQuestions = questionsByType[type];
                const friendlyTypeName = this.getFriendlyTypeName(type);
                const instructions = this.getTypeInstructions(type);
                const headerText = `${this.getRomanNumeral(typeIndex + 1)}. ${friendlyTypeName.toUpperCase()}. ${instructions} NO ERASURES, NO SUPERIMPOSITIONS, and NO BLANK ANSWERS.`;

                html += `
          <div class="question-type-section">
            <div class="type-header">${headerText}</div>
            <div class="questions-list">
        `;

                typeQuestions.forEach((question, qIndex) => {
                    html += this.generateQuestionHTML(question, qIndex + 1);
                });

                html += `
            </div>
          </div>
        `;
            });
        } else {
            html += `<div class="questions-list">`;
            data.questions.forEach((question, qIndex) => {
                html += this.generateQuestionHTML(question, qIndex + 1);
            });
            html += `</div>`;
        }

        html += `</div>`; // Close questions-container

        // Answer Key Section
        if (options.includeAnswerKey) {
            html += `
        <div class="answer-key">
          <div class="page-break"></div>
          <h2 class="answer-key-title">Answer Key: ${data.title}</h2>
      `;

            if (options.segregateByType) {
                Object.keys(questionsByType).forEach((type, typeIndex) => {
                    const typeQuestions = questionsByType[type];
                    html += `
            <div class="answer-type-section">
              <h3 class="answer-type-header">
                ${this.getRomanNumeral(typeIndex + 1)}. ${this.getFriendlyTypeName(type).toUpperCase()}
              </h3>
          `;

                    typeQuestions.forEach((question, qIndex) => {
                        const answerText = Array.isArray(question.correctAnswer)
                            ? question.correctAnswer.join(', ')
                            : question.correctAnswer;
                        html += `<div class="answer-item">${qIndex + 1}. ${answerText}</div>`;
                    });

                    html += `</div>`;
                });
            } else {
                data.questions.forEach((question, qIndex) => {
                    const answerText = Array.isArray(question.correctAnswer)
                        ? question.correctAnswer.join(', ')
                        : question.correctAnswer;
                    html += `<div class="answer-item">${qIndex + 1}. ${answerText}</div>`;
                });
            }

            html += `</div>`;
        }

        html += `</div>`; // Close print-container

        return html;
    }

    private generateQuestionHTML(question: PrintAssessmentData['questions'][0], questionNumber: number): string {
        const cleanText = this.cleanQuestionText(question);
        const answerSpace = question.type !== 'enumeration' ? '_____' : '';

        let html = `
      <div class="question-item">
        <div class="question-text">
          <span class="answer-space">${answerSpace}</span>${questionNumber}. ${cleanText}
        </div>
    `;

        // Multiple Choice Options
        if (question.type === 'multiple-choice' && question.options) {
            html += `<div class="options">`;
            question.options.forEach((option, optIndex) => {
                const letter = String.fromCharCode(65 + optIndex);
                html += `<div class="option">${letter}. ${option}</div>`;
            });
            html += `</div>`;
        }

        // Enumeration Answer Lines
        if (question.type === 'enumeration') {
            const answerCount = Array.isArray(question.correctAnswer) ? question.correctAnswer.length : 3;
            html += `<div class="enumeration-answers">`;
            for (let i = 1; i <= answerCount; i++) {
                html += `<div class="answer-line">${i}. ________________________</div>`;
            }
            html += `</div>`;
        }

        html += `</div>`;
        return html;
    }

    private getPrintCSS(): string {
        return `
      /* Screen styles - hidden during print */
      .print-container {
        font-family: 'Times New Roman', serif;
        max-width: 8.5in;
        margin: 0 auto;
        padding: 0.5in;
        background: white;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      }

      /* Print styles */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        body {
          margin: 0;
          padding: 0;
          font-family: 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.2;
        }

        .print-container {
          max-width: none;
          margin: 0;
          padding: 0.5in;
          box-shadow: none;
          background: none;
        }

        /* Column layout for questions */
        .questions-container.columns {
          column-count: 2;
          column-gap: 0.3in;
          column-fill: auto;
        }

        .question-item {
          break-inside: avoid;
          page-break-inside: avoid;
          margin-bottom: 0.15in;
        }

        /* Prevent breaking of question elements */
        .question-text,
        .options,
        .enumeration-answers {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Type sections should stay together when possible */
        .question-type-section {
          break-inside: avoid-page;
          margin-bottom: 0.2in;
        }

        .type-header {
          break-after: avoid;
          page-break-after: avoid;
        }

        /* Answer key on new page */
        .answer-key {
          break-before: page;
          page-break-before: always;
          column-count: 1;
        }

        .page-break {
          display: none;
        }
      }

      /* Header styles */
      .header {
        margin-bottom: 0.3in;
      }

      .title {
        text-align: center;
        font-size: 16pt;
        font-weight: bold;
        color: #2c3e50;
        margin: 0 0 0.2in 0;
      }

      .student-info {
        margin-bottom: 0.2in;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.1in;
      }

      .info-field {
        flex: 1;
        margin-right: 0.2in;
      }

      .info-field:last-child {
        margin-right: 0;
      }

      .label {
        font-weight: bold;
        margin-right: 0.1in;
      }

      .line {
        border-bottom: 1px solid #000;
        display: inline-block;
        min-width: 2.5in;
        padding-bottom: 2px;
      }

      .instructions {
        font-size: 11pt;
        margin-bottom: 0.15in;
      }

      .instructions-label {
        font-weight: bold;
        margin-right: 0.1in;
      }

      /* Question styles */
      .questions-container {
        margin-top: 0.2in;
      }

      .question-type-section {
        margin-bottom: 0.25in;
      }

      .type-header {
        font-size: 12pt;
        font-weight: bold;
        color: #2c3e50;
        margin-bottom: 0.15in;
        line-height: 1.3;
      }

      .questions-list {
        margin-left: 0;
      }

      .question-item {
        margin-bottom: 0.15in;
      }

      .question-text {
        font-weight: bold;
        font-size: 10pt;
        margin-bottom: 0.05in;
        line-height: 1.3;
      }

      .answer-space {
        margin-right: 0.05in;
      }

      .options {
        margin-left: 0.15in;
        margin-top: 0.05in;
      }

      .option {
        font-size: 9pt;
        margin-bottom: 0.02in;
        line-height: 1.2;
      }

      .enumeration-answers {
        margin-left: 0.15in;
        margin-top: 0.05in;
      }

      .answer-line {
        font-size: 9pt;
        margin-bottom: 0.02in;
      }

      /* Answer key styles */
      .answer-key {
        margin-top: 0.5in;
      }

      .answer-key-title {
        text-align: center;
        font-size: 16pt;
        font-weight: bold;
        color: #2c3e50;
        margin: 0 0 0.3in 0;
      }

      .answer-type-section {
        margin-bottom: 0.25in;
      }

      .answer-type-header {
        font-size: 13pt;
        font-weight: bold;
        color: #34495e;
        margin: 0.2in 0 0.1in 0;
      }

      .answer-item {
        font-size: 10pt;
        font-weight: bold;
        color: #27ae60;
        margin: 0.05in 0 0.05in 0.3in;
      }

      /* Screen-only styles for preview */
      @media screen {
        .print-container {
          min-height: 11in;
        }
        
        .print-container.column-layout .questions-container.columns {
          column-count: 2;
          column-gap: 0.3in;
          column-fill: balance;
        }
        
        /* Show page breaks on screen */
        .page-break {
          height: 1px;
          background: #ccc;
          margin: 0.5in 0;
          position: relative;
        }
        
        .page-break::after {
          content: "Page Break";
          position: absolute;
          left: 50%;
          top: -0.5em;
          transform: translateX(-50%);
          background: white;
          padding: 0 10px;
          font-size: 10px;
          color: #666;
        }
      }

      /* Ensure proper spacing and avoid orphans/widows */
      @media print {
        h1, h2, h3, .type-header {
          orphans: 3;
          widows: 3;
        }
        
        .question-item {
          orphans: 2;
          widows: 2;
        }
        
        /* Force answer key to start on new page */
        .answer-key {
          page-break-before: always;
        }
      }
    `;
    }

    // Helper methods
    private groupQuestionsByType(questions: PrintAssessmentData['questions']): { [key: string]: PrintAssessmentData['questions'] } {
        return questions.reduce((groups, question) => {
            const type = question.type;
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(question);
            return groups;
        }, {} as { [key: string]: PrintAssessmentData['questions'] });
    }

    private getFriendlyTypeName(type: string): string {
        return type.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    private getRomanNumeral(num: number): string {
        const romanNumerals = [
            { value: 1000, symbol: 'M' }, { value: 900, symbol: 'CM' }, { value: 500, symbol: 'D' },
            { value: 400, symbol: 'CD' }, { value: 100, symbol: 'C' }, { value: 90, symbol: 'XC' },
            { value: 50, symbol: 'L' }, { value: 40, symbol: 'XL' }, { value: 10, symbol: 'X' },
            { value: 9, symbol: 'IX' }, { value: 5, symbol: 'V' }, { value: 4, symbol: 'IV' },
            { value: 1, symbol: 'I' }
        ];
        let result = '';
        for (const { value, symbol } of romanNumerals) {
            while (num >= value) {
                result += symbol;
                num -= value;
            }
        }
        return result;
    }

    private getTypeInstructions(type: string): string {
        switch (type.toLowerCase()) {
            case 'multiple-choice':
                return 'Choose the letter of the correct answer. Write your answer on the space provided.';
            case 'true-false':
                return 'Write T for True or F for False for each statement. Write your answer on the space provided.';
            case 'enumeration':
                return 'List all possible answers for each question. Write your answers on the spaces provided.';
            case 'identification':
                return 'Identify what is being asked in each question. Write your answer on the space provided.';
            case 'essay':
                return 'Answer each question in complete sentences and paragraphs. Write your answers on the spaces provided.';
            default:
                return 'Answer each question according to the instructions provided. Write your answers on the spaces provided.';
        }
    }

    private cleanQuestionText(question: PrintAssessmentData['questions'][0]): string {
        let questionText = question.questionText;
        if (question.type === 'true-false') {
            questionText = questionText.replace(/^(True\s+or\s+False\s*:\s*)/i, '');
        }
        return questionText;
    }
}
