import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { PrintService } from '../shared/print-layout/print.service';
import { PrintAssessmentData, PrintOptions } from '../shared/print-layout/print-layout.component';

// Type declarations
declare var pdfMake: any;

export interface ExportOptions {
    format: 'pdf' | 'print';
    segregateByType: boolean;
    includeAnswerKey: boolean;
    useColumnLayout: boolean;
    studentInfo: {
        name: string;
        yearCourseBlock: string;
        date: string;
        score: string;
    };
    generalInstructions: string;
}

export interface Question {
    _id?: string;
    type: string;
    questionText: string;
    options?: string[];
    correctAnswer: string | string[];
    points: number;
}

export interface AssessmentData {
    title: string;
    questions: Question[];
    totalPoints: number;
    category: string;
}

@Injectable({
    providedIn: 'root'
})
export class ExportService {

    constructor(private printService: PrintService) { }

    async exportExam(data: AssessmentData, options: ExportOptions): Promise<void> {
        if (options.format === 'print') {
            await this.exportToPrint(data, options);
        } else {
            await this.exportToPDF(data, options);
        }
    }

    private async exportToPrint(data: AssessmentData, options: ExportOptions): Promise<void> {
        // Convert AssessmentData to PrintAssessmentData
        const printData: PrintAssessmentData = {
            title: data.title,
            questions: data.questions.map(q => ({
                _id: q._id,
                type: q.type,
                questionText: q.questionText,
                options: q.options,
                correctAnswer: q.correctAnswer,
                points: q.points
            })),
            totalPoints: data.totalPoints,
            category: data.category
        };

        // Convert ExportOptions to PrintOptions
        const printOptions: PrintOptions = {
            segregateByType: options.segregateByType,
            includeAnswerKey: options.includeAnswerKey,
            useColumnLayout: options.useColumnLayout,
            studentInfo: options.studentInfo,
            generalInstructions: options.generalInstructions
        };

        try {
            await this.printService.openPrintPreview(printData, printOptions);
        } catch (error) {
            console.error('Error opening print preview:', error);
            throw new Error('Failed to open print preview');
        }
    }

    private async exportToPDF(data: AssessmentData, options: ExportOptions): Promise<void> {
        const docDefinition = this.createPDFDefinition(data, options);

        try {
            await this.loadPdfMake();
            const pdfDoc = pdfMake.createPdf(docDefinition);
            pdfDoc.download(`${data.title}_Assessment.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw new Error('Failed to generate PDF');
        }
    }

    private async loadPdfMake(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof pdfMake !== 'undefined') {
                resolve();
                return;
            }

            const pdfMakeScript = document.createElement('script');
            pdfMakeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js';
            pdfMakeScript.onload = () => {
                const vfsScript = document.createElement('script');
                vfsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js';
                vfsScript.onload = () => resolve();
                vfsScript.onerror = reject;
                document.head.appendChild(vfsScript);
            };
            pdfMakeScript.onerror = reject;
            document.head.appendChild(pdfMakeScript);
        });
    }

    private createPDFDefinition(data: AssessmentData, options: ExportOptions): any {
        const content: any[] = [];

        // Header Section
        content.push({
            text: data.title,
            style: 'title',
            alignment: 'center',
            margin: [0, 0, 0, 15]
        });

        // Student Information Fields
        content.push({
            columns: [
                {
                    width: '50%',
                    stack: [
                        { text: [{ text: 'Name: ', bold: true }, { text: '________________________________' }], margin: [0, 5] },
                        { text: [{ text: 'Year, Course & Block: ', bold: true }, { text: '____________________' }], margin: [0, 10, 0, 5] }
                    ]
                },
                {
                    width: '50%',
                    stack: [
                        { text: [{ text: 'Date: ', bold: true }, { text: '________________________________' }], margin: [0, 5] },
                        { text: [{ text: 'Score: ', bold: true }, { text: '________________________________' }], margin: [0, 10, 0, 5] }
                    ]
                }
            ],
            margin: [0, 0, 0, 15]
        });

        // General Instructions
        if (options.generalInstructions) {
            content.push({
                text: [{ text: 'General Instructions: ', bold: true }, { text: options.generalInstructions }],
                style: 'instructions',
                margin: [0, 5, 0, 8]
            });
        }

        // Questions Section
        if (options.segregateByType) {
            this.addQuestionsByType(content, data.questions, options, data.title);
        } else {
            this.addQuestionsSequentially(content, data.questions, options, data.title);
        }

        return {
            content: content,
            styles: {
                title: { fontSize: 16, bold: true, color: '#2c3e50' },
                sectionHeader: { fontSize: 13, bold: true, color: '#34495e', margin: [0, 8, 0, 4] },
                sectionHeaderWithInstructions: { fontSize: 12, bold: true, color: '#2c3e50', margin: [0, 8, 0, 8] },
                instructions: { fontSize: 11, margin: [0, 0, 0, 8] },
                question: { fontSize: 11, bold: true, margin: [0, 4, 0, 3] },
                option: { fontSize: 11, margin: [20, 2, 0, 2] },
                correctAnswer: { fontSize: 10, bold: true, color: '#27ae60', margin: [0, 4, 0, 8] },
                questionColumn: { fontSize: 10, bold: true, margin: [0, 2, 0, 2] },
                optionColumn: { fontSize: 9, margin: [10, 1, 0, 1] }
            },
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 60],
            defaultStyle: { fontSize: 11, lineHeight: 1.2 }
        };
    }

    private addQuestionsByType(content: any[], questions: Question[], options: ExportOptions, assessmentTitle: string): void {
        const questionsByType = this.groupQuestionsByType(questions);

        Object.keys(questionsByType).forEach((type, typeIndex) => {
            const typeQuestions = questionsByType[type];
            const friendlyTypeName = this.getFriendlyTypeName(type); // This was the line causing the error
            const instructions = this.getTypeInstructions(type);
            const headerText = `${this.getRomanNumeral(typeIndex + 1)}. ${friendlyTypeName.toUpperCase()}. ${instructions} NO ERASURES, NO SUPERIMPOSITIONS, and NO BLANK ANSWERS.`;

            content.push({ text: headerText, style: 'sectionHeaderWithInstructions' });

            if (options.useColumnLayout && type === 'true-false' && typeQuestions.length > 5) {
                this.addTrueFalseInFlowingColumns(content, typeQuestions, 1, options);
            } else if (options.useColumnLayout && type !== 'true-false') {
                this.addQuestionsInFlowingColumns(content, typeQuestions, 1, options);
            } else {
                typeQuestions.forEach((question, index) => {
                    this.addQuestionToPDF(content, question, index + 1, options);
                });
            }
        });

        if (options.includeAnswerKey) {
            this.addAnswerKeyPage(content, questions, options, assessmentTitle);
        }
    }

    private addQuestionsSequentially(content: any[], questions: Question[], options: ExportOptions, assessmentTitle: string): void {
        if (options.useColumnLayout) {
            this.addQuestionsInFlowingColumns(content, questions, 1, options);
        } else {
            questions.forEach((question, index) => {
                this.addQuestionToPDF(content, question, index + 1, options);
            });
        }

        if (options.includeAnswerKey) {
            this.addAnswerKeyPage(content, questions, options, assessmentTitle);
        }
    }

    private addQuestionsInFlowingColumns(content: any[], questions: Question[], startingNumber: number, options: ExportOptions): void {
        const tableBody: any[] = [];
        for (let i = 0; i < questions.length; i += 2) {
            const leftCellContent = {
                stack: this.createQuestionColumn(questions[i], startingNumber + i, options),
                margin: [0, 0, 10, 15]
            };
            let rightCellContent: any = { text: '' };
            if (i + 1 < questions.length) {
                rightCellContent = {
                    stack: this.createQuestionColumn(questions[i + 1], startingNumber + i + 1, options),
                    margin: [10, 0, 0, 15]
                };
            }
            tableBody.push([leftCellContent, rightCellContent]);
        }
        content.push({ table: { widths: ['*', '*'], body: tableBody }, layout: 'noBorders' });
    }

    private addTrueFalseInFlowingColumns(content: any[], questions: Question[], startingNumber: number, options: ExportOptions): void {
        const tableBody: any[] = [];
        for (let i = 0; i < questions.length; i += 2) {
            const leftCellContent = {
                stack: this.createTrueFalseQuestionColumn(questions[i], startingNumber + i, options),
                margin: [0, 0, 10, 10]
            };
            let rightCellContent: any = { text: '' };
            if (i + 1 < questions.length) {
                rightCellContent = {
                    stack: this.createTrueFalseQuestionColumn(questions[i + 1], startingNumber + i + 1, options),
                    margin: [10, 0, 0, 10]
                };
            }
            tableBody.push([leftCellContent, rightCellContent]);
        }
        content.push({ table: { widths: ['*', '*'], body: tableBody }, layout: 'noBorders' });
    }

    private createQuestionColumn(question: Question, questionNumber: number, options: ExportOptions): any[] {
        const columnContent: any[] = [];
        const questionText = question.type === 'enumeration'
            ? `${questionNumber}. ${this.cleanQuestionText(question)}`
            : `_____${questionNumber}. ${this.cleanQuestionText(question)}`;
        columnContent.push({ text: questionText, style: 'questionColumn' });
        if (question.type === 'multiple-choice' && question.options) {
            question.options.forEach((option, index) => {
                columnContent.push({ text: `${String.fromCharCode(65 + index)}. ${option}`, style: 'optionColumn' });
            });
        } else if (question.type === 'enumeration') {
            const answerCount = Array.isArray(question.correctAnswer) ? question.correctAnswer.length : 3;
            for (let i = 1; i <= answerCount; i++) {
                columnContent.push({ text: `${i}. ________________________`, style: 'optionColumn' });
            }
        }
        return columnContent;
    }

    private createTrueFalseQuestionColumn(question: Question, questionNumber: number, options: ExportOptions): any[] {
        return [{ text: `_____${questionNumber}. ${this.cleanQuestionText(question)}`, style: 'questionColumn' }];
    }

    private addQuestionToPDF(content: any[], question: Question, questionNumber: number, options: ExportOptions): void {
        const questionText = question.type === 'enumeration'
            ? `${questionNumber}. ${this.cleanQuestionText(question)}`
            : `____________________${questionNumber}. ${this.cleanQuestionText(question)}`;
        content.push({ text: questionText, style: 'question' });
        if (question.type === 'multiple-choice' && question.options) {
            question.options.forEach((option, index) => {
                content.push({ text: `${String.fromCharCode(65 + index)}. ${option}`, style: 'option' });
            });
        } else if (question.type === 'enumeration') {
            const answerCount = Array.isArray(question.correctAnswer) ? question.correctAnswer.length : 3;
            for (let i = 1; i <= answerCount; i++) {
                content.push({ text: `${i}. ________________________________________________`, style: 'option' });
            }
        }
        content.push({ text: '', margin: [0, 0, 0, 10] });
    }

    private addAnswerKeyPage(content: any[], questions: Question[], options: ExportOptions, assessmentTitle?: string): void {
        content.push({ text: '', pageBreak: 'before' });
        content.push({ text: `Answer Key: ${assessmentTitle || 'Assessment'}`, style: 'title', alignment: 'center', margin: [0, 0, 0, 20] });
        if (options.segregateByType) {
            this.addAnswerKeyByType(content, questions);
        } else {
            this.addAnswerKeySequentially(content, questions);
        }
    }

    private addAnswerKeyByType(content: any[], questions: Question[]): void {
        const questionsByType = this.groupQuestionsByType(questions);
        Object.keys(questionsByType).forEach((type, typeIndex) => {
            const typeQuestions = questionsByType[type];
            content.push({ text: `${this.getRomanNumeral(typeIndex + 1)}. ${this.getFriendlyTypeName(type).toUpperCase()}`, style: 'sectionHeader', margin: [0, 15, 0, 10] });
            typeQuestions.forEach((question, index) => {
                const answerText = Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer;
                content.push({ text: `${index + 1}. ${answerText}`, style: 'correctAnswer', margin: [20, 2, 0, 2] });
            });
        });
    }

    private addAnswerKeySequentially(content: any[], questions: Question[]): void {
        questions.forEach((question, index) => {
            const answerText = Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer;
            content.push({ text: `${index + 1}. ${answerText}`, style: 'correctAnswer', margin: [20, 2, 0, 2] });
        });
    }

    private groupQuestionsByType(questions: Question[]): { [key: string]: Question[] } {
        return questions.reduce((groups, question) => {
            const type = question.type;
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(question);
            return groups;
        }, {} as { [key: string]: Question[] });
    }

    // --- THIS METHOD WAS MISSING ---
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

    private cleanQuestionText(question: Question): string {
        let questionText = question.questionText;
        if (question.type === 'true-false') {
            questionText = questionText.replace(/^(True\s+or\s+False\s*:\s*)/i, '');
        }
        return questionText;
    }

    private getTypeInstructions(type: string): string {
        switch (type.toLowerCase()) {
            case 'multiple-choice': return 'Choose the letter of the correct answer. Write your answer on the space provided.';
            case 'true-false': return 'Write T for True or F for False for each statement. Write your answer on the space provided.';
            case 'enumeration': return 'List all possible answers for each question. Write your answers on the spaces provided.';
            case 'identification': return 'Identify what is being asked in each question. Write your answer on the space provided.';
            case 'essay': return 'Answer each question in complete sentences and paragraphs. Write your answers on the spaces provided.';
            default: return 'Answer each question according to the instructions provided. Write your answers on the spaces provided.';
        }
    }
} 