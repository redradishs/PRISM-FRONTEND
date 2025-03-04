import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as mammoth from 'mammoth';

// Declare the global pdfjsLib variable
declare const pdfjsLib: any;

@Component({
  selector: 'app-component-testing',
  templateUrl: './component-testing.component.html',
  styleUrls: ['./component-testing.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ComponentTestingComponent {
  extractedText: string = '';
  error: string = '';

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.error = '';
    this.extractedText = '';

    try {
      if (file.type === 'application/pdf') {
        await this.extractPdfText(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        await this.extractDocxText(file);
      } else {
        this.error = 'Please select a PDF or DOCX file.';
      }
    } catch (error: any) {
      console.error('Error extracting text:', error);
      this.error = error.message || 'Error extracting text from file. Please try again.';
    }
  }

  private async extractPdfText(file: File): Promise<void> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);
      
      // Load the PDF document
      const pdfDoc = await pdfjsLib.getDocument({ data: typedArray }).promise;
      let text = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        text += `Page ${i}:\n${pageText}\n\n`;
      }
      
      if (!text.trim()) {
        throw new Error('No text could be extracted from the PDF. The file might be scanned or protected.');
      }
      
      this.extractedText = text;
    } catch (error: any) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF. Please make sure the file is not corrupted or password protected.');
    }
  }

  private async extractDocxText(file: File) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      if (!result.value.trim()) {
        throw new Error('No text could be extracted from the DOCX file.');
      }
      
      this.extractedText = result.value;
    } catch (error: any) {
      console.error('DOCX extraction error:', error);
      throw new Error('Failed to extract text from DOCX file. Please make sure the file is not corrupted.');
    }
  }
}
