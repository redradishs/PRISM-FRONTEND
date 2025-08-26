import { Injectable, ComponentRef, ViewContainerRef, ApplicationRef } from '@angular/core';
import { PrintLayoutComponent, PrintAssessmentData, PrintOptions } from './print-layout.component';

@Injectable({
  providedIn: 'root'
})
export class PrintService {

  constructor(private appRef: ApplicationRef) { }

  async openPrintPreview(data: PrintAssessmentData, options: PrintOptions): Promise<void> {
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      throw new Error('Unable to open print window. Please check popup blocker settings.');
    }

    const htmlContent = this.generatePrintHTML(data, options);

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }

  async printDirectly(data: PrintAssessmentData, options: PrintOptions): Promise<void> {
    const printDiv = document.createElement('div');
    printDiv.innerHTML = this.generatePrintContent(data, options);
    printDiv.style.display = 'none';

    // create a body
    document.body.appendChild(printDiv);

    // content
    const originalContent = document.body.innerHTML;

    // content
    document.body.innerHTML = printDiv.innerHTML;

    window.print();

    document.body.innerHTML = originalContent;

    if (printDiv.parentNode) {
      printDiv.parentNode.removeChild(printDiv);
    }
  }

  private generatePrintHTML(data: PrintAssessmentData, options: PrintOptions): string {
    const printContent = this.generatePrintContent(data, options);
    const cssContent = this.getSharedCSS();

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
    const sortedTypes = this.getSortedQuestionTypes(questionsByType);

    let html = `<div class="print-container ${options.useColumnLayout ? 'column-layout' : ''}">`;

    // Header Section
    html += `
      <div class="header">
        <div class="left-image">
          <img src="/ccslogo.webp" class="imgl" alt="ccslogo">
        </div>

        <div class="centerdata">
          ${options.courseTitle ? `<p>${options.courseTitle}</p>` : ''}
          <p>${data.title}</p>
          ${options.assessmentType ? `<p>${options.assessmentType} ${options.assessmentNumber || ''}</p>` : ''}
          ${(options.term || options.academicYear) ? `
            <p>
              ${options.term || ''}${options.term && options.academicYear ? ' - ' : ''}${options.academicYear || ''}
            </p>
          ` : ''}
        </div>

        <div class="right-image">
          <img src="/gclogo.webp" class="imgl" alt="gclogo">
        </div>
      </div>
      
      <div class="header-spacer"></div>
        
        <div class="student-info">
          <div class="info-columns">
            <div class="info-column">
              <div class="info-field">
                <span class="label">Name:</span>
                <span class="line"></span>
              </div>
              <div class="info-field">
                <span class="label">Year, Course & Block:</span>
                <span class="line"></span>
              </div>
            </div>
            <div class="info-column">
              <div class="info-field">
                <span class="label">Date:</span>
                <span class="line"></span>
              </div>
              <div class="info-field">
                <span class="label">Score:</span>
                <span class="line"></span>
              </div>
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

    html += `</div>`;

    // Questions 
    html += `<div class="questions-container ${options.useColumnLayout ? 'columns' : ''}">`;

    if (options.segregateByType) {
      sortedTypes.forEach((type, typeIndex) => {
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

    html += `</div>`;

    // answer key if included
    if (options.includeAnswerKey) {
      html += `
        <div class="answer-key">
          <div class="page-break"></div>
          <h2 class="answer-key-title">Answer Key: ${data.title}</h2>
      `;

      if (options.segregateByType) {
        sortedTypes.forEach((type, typeIndex) => {
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

    html += `</div>`;

    return html;
  }

  private getSortedQuestionTypes(questionsByType: { [key: string]: PrintAssessmentData['questions'] }): string[] {
    const typeOrder = ['multiple-choice', 'true-false', 'enumeration', 'short-answer'];
    return typeOrder.filter(type => questionsByType[type] && questionsByType[type].length > 0);
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
    // mc with grid layout 
    if (question.type === 'multiple-choice' && question.options) {
      html += `<div class="options-grid">`;

      const maxRows = Math.ceil(question.options.length / 2);

      for (let row = 0; row < maxRows; row++) {
        html += `<div class="option-row">`;

        // left side half
        const leftIndex = row < 2 ? row : row + 2;
        if (leftIndex < question.options.length) {
          const leftLetter = String.fromCharCode(65 + leftIndex);
          html += `<div class="option-left">${leftLetter}. ${question.options[leftIndex]}</div>`;
        } else {
          html += `<div class="option-left"></div>`;
        }

        // right side other half
        const rightIndex = row < 2 ? row + 2 : row + 4;
        if (rightIndex < question.options.length) {
          const rightLetter = String.fromCharCode(65 + rightIndex);
          html += `<div class="option-right">${rightLetter}. ${question.options[rightIndex]}</div>`;
        } else {
          html += `<div class="option-right"></div>`;
        }

        html += `</div>`;
      }

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

    // Short Answer
    if (question.type === 'short-answer') {
      html += `<div class="short-answer-space">`;
      html += `<div class="answer-line">Answer: ________________________________________</div>`;
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  private getSharedCSS(): string {
    return `
.print-container {
  font-family: 'Times New Roman', serif;
  max-width: 8.5in;
  margin: 0 auto;
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
    box-shadow: none;
    background: none;
  }

  /* Column layout for questions - only when explicitly using columns */
  .questions-container.columns {
    column-count: 2;
    column-gap: 0.3in;
    column-fill: auto;
  }

  .questions-container.columns .options-grid {
    display: block;
  }

  .questions-container.columns .option-row {
    display: block;
  }

  .questions-container.columns .option-left,
  .questions-container.columns .option-right {
    display: block;
    width: 100%;
    margin-bottom: 0.02in;
  }

  .question-item {
    break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 0.15in;
  }

  .question-text,
  .options-grid,
  .enumeration-answers {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .question-type-section {
    margin-bottom: 0.2in;
  }

  .type-header {
    break-after: avoid;
    page-break-after: avoid;
  }

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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-image, .right-image {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
}

.imgl {
  width: 120px;
  height: 120px;
}

.centerdata {
  text-align: center;
  flex: 1;
}

.centerdata p:first-child {
  font-weight: bold;
  font-size: 1.1rem;
  color: rgb(0, 0, 0);
}

.centerdata p:nth-child(2) {
  font-weight: bold;
  font-size: 1.2rem;
  color: rgb(0, 0, 0);
}

.centerdata p:nth-child(3),
.centerdata p:nth-child(4) {
  font-size: 1rem;
  color: black;
}

.title {
  text-align: center;
  font-size: 16pt;
  font-weight: bold;
  color: #2c3e50;
  margin: 0 0 0.2in 0;
}

/* THIS IS THE MARGIN QUESTIONS (TOP RIGHT BOTTOM LEFT) */
.student-info {
  margin: 0 0.1in 0.2in 0.1in;
}

.instructions {
  margin: 0.1in 0.1in 0.2in 0.1in;
}

.questions-container {
  margin: 0 0.1in 0.2in 0.1in;
}

.info-columns {
  display: flex;
  justify-content: space-between;
  gap: 0.3in;
}

.info-column {
  flex: 1;
}

.info-field {
  margin-bottom: 0.1in;
  display: flex;
  align-items: baseline;
}

.info-field:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: bold;
  margin-right: 0.1in;
}

.line {
  border-bottom: 1px solid #000;
  flex: 1;
  margin-left: 0.1in;
  padding-bottom: 2px;
  min-height: 1em;
}

.instructions {
  font-size: 14pt;
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
  font-size: 11pt;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.15in;
  line-height: 1.3;
}

.questions-list {
  margin-left: 0;
}

.question-item {
  margin-bottom: 0.2in;
  width: 100%; /* Full width for non-column mode */
}

.question-text {
  font-weight: bold;
  font-size: 10pt;
  margin-bottom: 0.08in;
  line-height: 1.3;
  width: 100%;
}

.answer-space {
  margin-right: 0.05in;
}

/* mc grid layout */
.options-grid {
  margin-left: 0.15in;
  margin-top: 0.08in;
  width: 100%;
}

.option-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.05in;
  width: 100%;
}

.option-left, .option-right {
  font-size: 9pt;
  line-height: 1.2;
  width: 48%; /* Nearly half width with gap */
  flex-shrink: 0;
}

.option-left {
  text-align: left;
}

.option-right {
  text-align: left;
}

/* OLD: Keep for backward compatibility or column mode */
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

.short-answer-space {
  margin-left: 0.15in;
  margin-top: 0.05in;
}

/* enum and short answer */
.answer-line {
  font-size: 9pt;
  margin-bottom: 0.20in;
  margin-top: 0.10in;
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

@media screen {
  .print-container {
    min-height: 11in;
  }
  
  .print-container.column-layout .questions-container.columns {
    column-count: 2;
    column-gap: 0.3in;
    column-fill: balance;
  }
  
  /* screen view */
  .options-grid {
    margin-left: 0.15in;
    margin-top: 0.08in;
    width: 100%;
  }
  
  .option-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.05in;
    width: 100%;
  }
  
  .option-left, .option-right {
    width: 48%;
  }
  
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

@media print {
  h1, h2, h3, .type-header {
    orphans: 3;
    widows: 3;
  }
  
  .question-item {
    orphans: 2;
    widows: 2;
  }
  
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
