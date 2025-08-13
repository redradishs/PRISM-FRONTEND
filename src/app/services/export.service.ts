import { Injectable } from '@angular/core';
import { PrintService } from '../shared/print-layout/print.service';
import { PrintAssessmentData, PrintOptions } from '../shared/print-layout/print-layout.component';

export interface ExportOptions {
    format: 'print' | 'word';
    segregateByType: boolean;
    includeAnswerKey: boolean;
    useColumnLayout: boolean;
    courseTitle: string;
    assessmentType: string;
    assessmentNumber: string;
    term: string;
    academicYear: string;
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
        } else if (options.format === 'word') {
            await this.exportToWord(data, options);
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
            courseTitle: options.courseTitle,
            assessmentType: options.assessmentType,
            assessmentNumber: options.assessmentNumber,
            term: options.term,
            academicYear: options.academicYear,
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

    private async exportToWord(data: AssessmentData, options: ExportOptions): Promise<void> {
        try {
            // Create HTML content similar to print layout
            const htmlContent = this.createWordHTML(data, options);

            // Create a blob with the HTML content
            const blob = new Blob([htmlContent], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${data.title}_Assessment.doc`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating Word document:', error);
            throw new Error('Failed to generate Word document');
        }
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

    private createWordHTML(data: AssessmentData, options: ExportOptions): string {
        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${data.title}</title>
            <style>
                @page {
                    margin: 0.5in;
                    size: 8.5in 11in;
                }
                
                body { 
                    font-family: 'Times New Roman', serif; 
                    font-size: 12pt; 
                    line-height: 1.15;
                }
                
                .header { 
                    text-align: center; 
                    margin-bottom: 25px; 
                }
                
                .header h1 { 
                    font-size: 14pt; 
                    font-weight: bold; 
                    margin: 0 0 8px 0; 
                    text-transform: uppercase;
                }
                
                .header .academic-year { 
                    font-size: 12pt; 
                    margin: 0; 
                }
                

                
                .instructions { 
                    margin: 20px 0; 
                    font-size: 12pt; 
                    line-height: 1.3;
                }
                
                .instructions strong { 
                    font-weight: bold; 
                }
                
                .question-item { 
                    margin-bottom: 15px; 
                    text-align: justify;
                    line-height: 1.3;
                }
                
                .question-text { 
                    margin-bottom: 8px; 
                    text-indent: 25px;
                }
                
                .answer-space {
                    margin-right: 3px;
                    display: inline-block;
                    width: 40px;
                    border-bottom: 1px solid black;
                    height: 1px;
                }
                
                .options { 
                    margin-left: 15px; 
                    margin-top: 3px; 
                }
                
                .option { 
                    margin-bottom: 2px; 
                    text-indent: 0px;
                    line-height: 1.2;
                }
                
                .enumeration-answers {
                    margin-left: 60px;
                    margin-top: 8px;
                }
                
                .answer-line {
                    margin-bottom: 8px;
                    line-height: 1.3;
                }
                
                .true-false-text {
                    text-indent: 25px;
                    margin-bottom: 8px;
                    line-height: 1.3;
                }
                
                .question-item {
                    margin-bottom: 15px; 
                    text-align: justify;
                    line-height: 1.3;
                }
                
                .type-header {
                    font-weight: bold; 
                    margin: 15px 0 10px 0; 
                    font-size: 12pt;
                }
            </style>
        </head>
        <body>
            ${options.generalInstructions ? `<div class="instructions"><strong>General Instructions:</strong> ${options.generalInstructions}</div>` : ''}
            
            <div class="questions">`;

        if (options.segregateByType) {
            html += this.createWordQuestionsByType(data.questions, options);
        } else {
            html += this.createWordQuestionsSequential(data.questions, options);
        }

        html += `
            </div>
        </body>
        </html>`;

        return html;
    }

    private createWordQuestionsByType(questions: Question[], options: ExportOptions): string {
        const questionsByType = this.groupQuestionsByType(questions);
        let html = '';
        let typeIndex = 0;

        Object.keys(questionsByType).forEach(type => {
            const typeQuestions = questionsByType[type];
            const friendlyTypeName = this.getFriendlyTypeName(type);
            const instructions = this.getTypeInstructions(type);
            const headerText = `${this.getRomanNumeral(typeIndex + 1)}. ${friendlyTypeName.toUpperCase()}. ${instructions} NO ERASURES, NO SUPERIMPOSITIONS, and NO BLANK ANSWERS.`;

            html += `<div class="type-header">${headerText}</div>`;

            typeQuestions.forEach((question, index) => {
                html += this.createWordQuestionItem(question, index + 1, options);
            });

            typeIndex++;
        });

        return html;
    }

    private createWordQuestionsSequential(questions: Question[], options: ExportOptions): string {
        let html = '';

        questions.forEach((question, index) => {
            html += this.createWordQuestionItem(question, index + 1, options);
        });

        return html;
    }

    private createWordQuestionItem(question: Question, questionNumber: number, options: ExportOptions): string {
        let html = `<div class="question-item">`;

        // Clean question text for true-false questions
        let questionText = question.questionText;
        if (question.type === 'true-false') {
            questionText = questionText.replace(/^(True\s+or\s+False\s*:\s*)/i, '');
        }

        if (question.type === 'true-false') {
            html += `<div class="true-false-text">___${questionNumber}. True or False: ${questionText}</div>`;
        } else if (question.type !== 'enumeration') {
            html += `<div class="question-text">___${questionNumber}. ${questionText}</div>`;
        } else {
            html += `<div class="question-text">${questionNumber}. ${questionText}</div>`;
        }

        if (question.type === 'multiple-choice' && question.options) {
            html += `<div class="options">`;
            question.options.forEach((option, optIndex) => {
                html += `<div class="option">${String.fromCharCode(65 + optIndex)}. ${option}</div>`;
            });
            html += `</div>`;
        } else if (question.type === 'enumeration') {
            const answerCount = Array.isArray(question.correctAnswer) ? question.correctAnswer.length : 3;
            html += `<div class="enumeration-answers">`;
            for (let i = 1; i <= answerCount; i++) {
                html += `<div class="answer-line">${i}. _________________________________________________</div>`;
            }
            html += `</div>`;
        }

        html += `</div>`;
        return html;
    }
} 