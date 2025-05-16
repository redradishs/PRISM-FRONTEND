import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import * as mammoth from 'mammoth';

declare const pdfjsLib: any;

interface AIResponse {
  success: boolean;
  payload: {
    timestamp: string;
    data: string;
    dev: {
      API_OWNER: string;
      company: string;
      API: string;
    };
  };
  message: string;
  rawResponse: string;
  questions: string;
}

interface AIQuestion {
  question: string;
  type: string;
  difficulty: string;
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: string | boolean | string[];
}

interface Question {
  type: string;
  id: number;
  question: string;
  questionNumber: number;
  answer: string | string[] | boolean;
  options?: { [key: string]: string };
  points: number;
  requiredItems?: number;
}

interface NewQuestion {
  type: string;
  count: number;
  selectedTypes: { [key: string]: boolean };
  counts: { [key: string]: number };
}

@Component({
  selector: 'app-create-assessment',
  imports: [CommonModule, SidebarComponent, FormsModule],
  templateUrl: './create-assessment.component.html',
  styleUrl: './create-assessment.component.css',
})
export class CreateAssessmentComponent implements OnInit {
  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  @ViewChild(SidebarComponent)
  sidebar!: SidebarComponent;
  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  assessmentData = {
    title: '',
    category: '',
    passingScore: '70',
  };

  aiGeneration = {
    topic: '',
    difficulty: 'medium',
    questionCount: '5',
    instructions: '',
  };
  defaultPoints = {
    'multiple-choice': 1,
    'short-answer': 1,
    'true-false': 1,
    enumeration: 1,
  }
  username: string = '';
  userId: number = 0;
  multipleChoiceOptions: string[] = Array(4).fill('');
  enumerationItems: string[] = Array(5).fill('');
  selectedTypes: string[] = [];
  errorMessage: string | null = null;
  trueFalseAnswer: string = 'true';
  questions: Question[] = [];
  nextId = 1;
  generated = false;
  isGenerating = false;
  loading = false;
  step = 1;
  isMenuOpen = false;
  editingQuestionId: number | null = null;
  showAddDialog = false;
  newQuestion: NewQuestion = {
    type: 'multiple-choice',
    count: 1,
    selectedTypes: {
      'multiple-choice': false,
      'enumeration': false,
      'short-answer': false,
      'true-false': false
    },
    counts: {
      'multiple-choice': 1,
      'enumeration': 1,
      'short-answer': 1,
      'true-false': 1
    }
  };
  basicInfoError: string | null = null;
  extractedText: string = '';
  selectedFileName: string = '';
  showUploadSection = false;
  showCategories = false;

  questionTypes = [
    {
      value: 'multiple-choice',
      label: 'Multiple Choice',
      desc: 'Questions with several options',
      icon: 'fas fa-file-text',
      color: '#4f46e5'
    },
    {
      value: 'enumeration',
      label: 'Enumeration',
      desc: 'List-based answers',
      icon: 'fas fa-list',
      color: '#9333ea'
    },
    {
      value: 'short-answer',
      label: 'Short Answer',
      desc: 'Brief text responses',
      icon: 'fas fa-comment',
      color: '#ec4899'
    },
    {
      value: 'true-false',
      label: 'True/False',
      desc: 'Binary choice questions',
      icon: 'fas fa-check',
      color: '#22c55e'
    }
  ];

  categoryOptions = [
    { value: 'programming', label: 'Programming Fundamentals', selected: false },
    { value: 'datastructures', label: 'Data Structures', selected: false },
    { value: 'algorithms', label: 'Algorithms', selected: false },
    { value: 'networking', label: 'Networking', selected: false },
    { value: 'os', label: 'Operating Systems', selected: false },
    { value: 'databases', label: 'Databases', selected: false },
    { value: 'webdevelopment', label: 'Web Development', selected: false },
    { value: 'cybersecurity', label: 'Cybersecurity', selected: false },
    { value: 'softwareengineering', label: 'Software Engineering', selected: false },
    { value: 'discrete', label: 'Discrete Mathematics', selected: false },
    { value: 'ai', label: 'Artificial Intelligence', selected: false },
    { value: 'machinelearning', label: 'Machine Learning', selected: false },
    { value: 'humancomputerinteraction', label: 'Human-Computer Interaction', selected: false },
    { value: 'itfundamentals', label: 'IT Fundamentals', selected: false },
    { value: 'mobiledevelopment', label: 'Mobile Development', selected: false },
    { value: 'cloudcomputing', label: 'Cloud Computing', selected: false },
    { value: 'devops', label: 'DevOps', selected: false },
    { value: 'ethics', label: 'Ethics and IT Law', selected: false },
    { value: 'iot', label: 'Internet of Things (IoT)', selected: false },
    { value: 'robotics', label: 'Robotics', selected: false }
  ];

  constructor(
    private api: ApiService,
    private router: Router,
    private auth: AuthService,
    private titleService: Title
  ) {
    this.titleService.setTitle('PRISM | Create');
  }

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe(
      (user: any) => {
        this.userId = user.id;
        this.username = user.name;
        console.log(this.userId);
      },
      (error: any) => {
        console.error('Error getting current user', error);
      }
    );
  }

  generateNow() {
    if (!this.aiGeneration.topic) {
      this.errorMessage = 'Please enter a topic';
      return;
    }
    if (this.selectedTypes.length === 0) {
      this.errorMessage = 'Please select at least one question type';
      return;
    }

    if (Number(this.aiGeneration.questionCount) > 50) {
      this.errorMessage =
        'You have unlimited generation of questions. PRISM recommends to generate maximum of 50 questions per request.';
      return;
    }

    this.showUploadSection = false;
    this.isGenerating = true;
    this.errorMessage = null;
    this.generated = false;

    // 3. Set up batch processing variables
    const questionsPerBatch = 5; // Generate 5 questions at a time
    const totalQuestions = Number(this.aiGeneration.questionCount);
    let questionsGenerated = 0;
    let retryAttempts = 0;
    const maxRetries = 2;

    // 4. Function to generate one batch of questions
    const generateQuestionBatch = () => {
      const remainingQuestions = totalQuestions - questionsGenerated;
      if (remainingQuestions <= 0) {
        this.isGenerating = false;
        this.generated = true;
        return;
      }

      const questionsToGenerate = Math.min(
        questionsPerBatch,
        remainingQuestions
      );

      this.api
        .generateQuizAssessment(
          questionsToGenerate,
          this.aiGeneration.difficulty as 'easy' | 'medium' | 'hard',
          this.promptMaker(questionsToGenerate)
        )
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.handleGeneratedQuestions(response);
              questionsGenerated += questionsToGenerate;

              if (questionsGenerated < totalQuestions) {
                generateQuestionBatch();
              } else {
                this.isGenerating = false;
                this.generated = true;
                Swal.fire({
                  title: 'Questions Generated',
                  text: 'Questions generated successfully',
                  icon: 'success',
                  toast: true,
                  position: 'top-end',
                  showConfirmButton: false,
                  timer: 2000,
                  timerProgressBar: true,
                  background: '#fff',
                  iconColor: '#3b82f6'
                });
              }
            } else {
              this.handleGenerationFailure(
                'Generation failed',
                retryAttempts,
                maxRetries,
                generateQuestionBatch
              );
            }
          },
          error: (error: any) => {
            this.handleGenerationFailure(
              'Error during generation',
              retryAttempts,
              maxRetries,
              generateQuestionBatch
            );
            console.error('Generation error:', error);
          },
        });
    };

    this.handleGenerationFailure = this.handleGenerationFailure.bind(this);
    generateQuestionBatch();
  }

  private promptMaker(batchSize: number) {
    const typeMapping = {
      mc: 'Multiple Choice',
      sa: 'Short Answer',
      tf: 'True/False',
      enum: 'Enumeration',
    };

    const selectedTypesText = this.selectedTypes
      .map((type) => typeMapping[type as keyof typeof typeMapping])
      .join(', ');

    if (this.extractedText && this.extractedText.trim()) {
      return [
        'IMPORTANT: You are a strict question generator. Follow these instructions EXACTLY:',
        `1. Generate exactly ${batchSize} ${this.aiGeneration.difficulty} difficulty questions.`,
        `2. Only use these question types: ${selectedTypesText}.`,
        `3. Focus ONLY on content that matches these criteria: ${
          this.aiGeneration.instructions || 'None'
        }.`,
        '',
        'STRICT RULES:',
        '- Generate questions ONLY about topics explicitly mentioned in the instructions',
        "- If a topic isn't directly related to the instructions, DO NOT create questions about it",
        "- Ignore any content in the document that doesn't match the instructions",
        '- Quality over quantity: If you cannot generate the requested number of questions while staying on topic, generate fewer questions',
        '',
        'Document content for reference:',
        this.extractedText.trim(),
      ].join('\n');
    }

    return [
      `Topic: ${this.aiGeneration.topic}`,
      `1. Generate ${batchSize} ${this.aiGeneration.difficulty} difficulty questions`,
      `2. Use only these question types: ${selectedTypesText}`,
      `3. Additional requirements: ${this.aiGeneration.instructions || 'None'}`,
    ].join('\n');
  }

  private mapQuestionType(aiType: string): string {
    const typeMap: { [key: string]: string } = {
      'multiple choice': 'multiple-choice',
      'short answer': 'short-answer',
      enumeration: 'enumeration',
      'true/false': 'true-false',
      'true-false': 'true-false',
    };
    return typeMap[aiType.toLowerCase()] || aiType;
  }

  private handleGeneratedQuestions(response: AIResponse): void {
    if (!response.success) {
      const message = response.rawResponse;
      this.errorMessage =
        `${message} please add additional instructions or upload your document and i will help you generate your questions.` ||
        'Failed to generate questions';
      return;
    }
    if (!response.questions || response.questions.length === 0) {
      const message = response.rawResponse;
      this.errorMessage =
        `${message} please add additional instructions or upload your document and i will help you generate your questions.` ||
        'Failed to generate questions';
      return;
    }

    try {
      const questions = response.questions;

      if (Array.isArray(questions)) {
        questions.forEach((question: AIQuestion) => {
          const questionType = this.mapQuestionType(question.type);
          const formattedQuestion: Question = {
            type: questionType,
            id: this.nextId++,
            questionNumber: this.questions.length + 1,
            question: question.question,
            options:
              question.type.toLowerCase() === 'multiple choice'
                ? {
                    A: question.options?.A || '',
                    B: question.options?.B || '',
                    C: question.options?.C || '',
                    D: question.options?.D || '',
                  }
                : undefined,
            answer:
              question.type.toLowerCase() === 'true/false'
                ? String(question.answer)
                : question.answer,
            points: this.defaultPoints[questionType as keyof typeof this.defaultPoints] || 1,
          };

          if (
            formattedQuestion.type === 'multiple-choice' &&
            question.options
          ) {
            this.multipleChoiceOptions = [
              question.options.A,
              question.options.B,
              question.options.C,
              question.options.D,
            ];
          }

          // For enumeration, set the enumeration items
          if (
            formattedQuestion.type === 'enumeration' &&
            Array.isArray(question.answer)
          ) {
            this.enumerationItems = question.answer;
          }

          // For true/false, set the answer
          if (formattedQuestion.type === 'true-false') {
            this.trueFalseAnswer = String(question.answer).toLowerCase();
          }

          this.questions.push(formattedQuestion);
        });
        this.updateQuestionNumbers();
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      this.errorMessage = 'Error processing the generated questions';
    }
  }


  private updateQuestionNumbers() {
    // First sort by ID to maintain stable order
    this.questions.sort((a, b) => a.id - b.id);
    
    // Then update question numbers sequentially
    let currentNumber = 1;
    this.questions.forEach((q) => {
      q.questionNumber = currentNumber++;
    });
  }
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleType(type: string): void {
    const index = this.selectedTypes.indexOf(type);
    if (index === -1) {
      this.selectedTypes.push(type);
    } else {
      this.selectedTypes.splice(index, 1);
    }
  }

  isTypeSelected(type: string): boolean {
    return this.selectedTypes.includes(type);
  }

  getQuestionsByType(type: string): Question[] {
    return this.questions
      .filter((q) => q.type === type)
      .sort((a, b) => a.questionNumber - b.questionNumber);
  }

  getQuestionTypeCount(type: string): number {
    return this.getQuestionsByType(type).length;
  }

  getTotalPointsByType(type: string): number {
    return this.questions
      .filter((q) => q.type === type)
      .reduce((sum, q) => sum + (q.points || 0), 0);
  }

  getTotalQuestions(): number {
    return this.questions.length;
  }

  getPointLabel(type: string): string {
    const totalPoints = this.getTotalPointsByType(type);

    return totalPoints === 1 ? 'point' : 'points';
  }

  isArray(value: any): value is string[] {
    return Array.isArray(value);
  }

  deleteQuestion(questionId: number) {
    const index = this.questions.findIndex((q) => q.id === questionId);
    if (index !== -1) {
      this.questions.splice(index, 1);
      this.updateQuestionNumbers();
    }
  }

  updateQuestionPoints(questionId: number, newPoints: number) {
    const question = this.questions.find((q) => q.id === questionId);
    if (question) {
      question.points = Math.max(1, Math.round(newPoints));
    }
  }

  toggleEditAndSave(question: any): void {
    const questionId = question.id;
    
    if (this.editingQuestionId === questionId) {
      // Save the question
      this.editingQuestionId = null;
      // Optional: Add any validation or save logic here
      console.log('Saved question:', question);
    } else {
      // Start editing
      this.editingQuestionId = questionId;
    }
  }

  isEditing(questionId: number): boolean {
    return this.editingQuestionId === questionId;
  }

  preventClose(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  handleKeyPress(event: any, questionId: number, type?: string, key?: string, index?: number) {
    // Cast event to KeyboardEvent inside the method
    const keyEvent = event as KeyboardEvent;
    
    if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
      event.preventDefault();
      
      // Get the value from the event target
      const value = (event.target as HTMLTextAreaElement)?.value;
      
      // Save changes based on the type of input
      const question = this.questions.find(q => q.id === questionId);
      if (!question) return;

      if (type === 'option' && key && value !== undefined) {
        if (question.options) {
          question.options[key] = value;
        }
      } else if (type === 'enum' && index !== undefined && value !== undefined) {
        if (Array.isArray(question.answer)) {
          question.answer[index] = value;
        }
      } else if (type === 'question' && value !== undefined) {
        question.question = value;
      }

      // Exit edit mode
      this.toggleEditAndSave(question);
    }
  }

  getEnumAnswer(answer: string | boolean | string[], index: number): string {
    return Array.isArray(answer) ? answer[index] : '';
  }

  setEnumAnswer(question: Question, index: number, value: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (Array.isArray(question.answer)) {
      question.answer[index] = value;
    }
  }

  setOptionAnswer(question: Question, key: string, value: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (question.options) {
      console.log(`Setting option ${key} to "${value}"`); // Debug log
      question.options[key] = value;
    }
  }

  addNewQuestions() {
    const startId = this.questions.length + 1;
    let added = 0;

    Object.keys(this.newQuestion.selectedTypes).forEach(type => {
      if (this.newQuestion.selectedTypes[type]) {
        const count = Math.max(1, Math.round(this.newQuestion.counts[type] || 1));
        for (let i = 0; i < count; i++) {
          const question: Question = {
            id: startId + added,
            questionNumber: this.questions.length + 1 + added,
            type: type,
            question: '',
            points: this.defaultPoints[type as keyof typeof this.defaultPoints] || 1,
            answer:
              type === 'true-false'
                ? 'True'
                : type === 'enumeration'
                ? []
                : '',
            options:
              type === 'multiple-choice'
                ? {
                    A: '',
                    B: '',
                    C: '',
                    D: '',
                  }
                : undefined,
          };
          this.questions.push(question);
          added++;
        }
      }
    });

    this.showAddDialog = false;
    this.resetModalQuestions();
    this.updateQuestionNumbers();
  }
  resetModalQuestions() {
    this.newQuestion = {
      type: 'multiple-choice',
      count: 1,
      selectedTypes: {
        'multiple-choice': false,
        'enumeration': false,
        'short-answer': false,
        'true-false': false
      },
      counts: {
        'multiple-choice': 1,
        'enumeration': 1,
        'short-answer': 1,
        'true-false': 1
      }
    };
  }

  confirmPublish() {
    const title = this.assessmentData.title;
    Swal.fire({
      title: 'Save Assessment title?',
      text: `Are you sure you want to save ${title}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, save it!',
      cancelButtonText: 'No, keep editing',
      confirmButtonColor: '#6366f1',
      cancelButtonColor: '#8b5cf6',
      customClass: {
        confirmButton: 'swal2-confirm',
        cancelButton: 'swal2-cancel',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.publishAssessment();
      }
    });
  }

  publishAssessment() {
    if (
      this.assessmentData.title === '' ||
      this.getSelectedCount() === 0 ||
      this.assessmentData.passingScore === ''
    ) {
      this.basicInfoError = 'Please fill in all fields';
      return;
    }

    const categoryString = this.categoryOptions
      .filter(cat => cat.selected)
      .map(cat => cat.label)
      .join(', ');

    const format = this.questions.map((q) => {
      const base = {
        type: q.type,
        questionText: q.question,
        correctAnswer: q.answer,
        points: q.points,
        options: [],
      };

      if (q.type === 'multiple-choice' && q.options) {
        return {
          ...base,
          options: [
            q.options['A'],
            q.options['B'],
            q.options['C'],
            q.options['D'],
          ],
        };
      }

      return base;
    });
    
    const totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 0), 0);

    const assessmentData = {
      title: this.assessmentData.title,
      passingScore: this.assessmentData.passingScore,
      category: categoryString,
      questions: format,
      totalPoints: totalPoints,
      createdBy: this.userId,
      status: 'draft',
    };

    this.api.createAssessment(assessmentData).subscribe({
      next: (resp: any) => {
        console.log('Response ng assessment', resp);
        Swal.fire({
          title: 'Success!',
          text: `${assessmentData.title} has been successfully created!`,
          icon: 'success',
          confirmButtonColor: '#6366f1',
          customClass: {
            confirmButton: 'swal2-confirm'
          }
        }).then(() => {
          this.assessmentData = {
            title: '',
            category: '',
            passingScore: '70',
          };

          this.aiGeneration = {
            topic: '',
            difficulty: 'medium',
            questionCount: '5',
            instructions: '',
          };

          this.questions = [];
          this.selectedTypes = [];
          this.extractedText = '';
          this.selectedFileName = '';
          this.showUploadSection = false;
          this.generated = false;
          this.errorMessage = null;
          this.basicInfoError = null;
          this.nextId = 1;
        });
      },
      error: (error: any) => {
        console.error('Error creating assessment', error);
        Swal.fire({
          title: 'Error!',
          text: error.message || 'Failed to create assessment. Please try again.',
          icon: 'error',
          confirmButtonColor: '#6366f1',
          customClass: {
            confirmButton: 'swal2-confirm'
          }
        });
      }
    });
  }

  private handleGenerationFailure(
    errorMsg: string,
    retryAttempts: number,
    maxRetries: number,
    generateQuestionBatch: () => void
  ) {
    if (retryAttempts < maxRetries) {
      retryAttempts++;
      console.log(`Retrying... Attempt ${retryAttempts} of ${maxRetries}`);
      generateQuestionBatch();
    } else {
      this.isGenerating = false;
      this.errorMessage = `${errorMsg}. Please try again.`;
    }
  }

  //for the upload document function
  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.onFileSelected(file);
    this.errorMessage = '';
    this.extractedText = '';
    this.selectedFileName = file.name;

    console.log('File selected:', file);
    console.log('File type:', file.type);
    console.log('File name:', file.name);

    try {
      if (file.type === 'application/pdf') {
        await this.extractPdfText(file);
      } else if (
        file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        await this.extractDocxText(file);
      } else {
        this.errorMessage = 'Please select a PDF or DOCX file.';
      }
    } catch (error: any) {
      console.error('Error extracting text:', error);
      this.errorMessage =
        error.message || 'Error extracting text from file. Please try again.';
    }
  }

  private async extractPdfText(file: File): Promise<void> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);

      const pdfDoc = await pdfjsLib.getDocument({ data: typedArray }).promise;
      let text = '';

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        text += `Page ${i}:\n${pageText}\n\n`;
      }

      if (!text.trim()) {
        throw new Error(
          'No text could be extracted from the PDF. The file might be scanned or protected.'
        );
      }

      this.extractedText = text;
      console.log('Extracted text:', this.extractedText);
    } catch (error: any) {
      console.error('PDF extraction error:', error);
      throw new Error(
        'Failed to extract text from PDF. Please make sure the file is not corrupted or password protected.'
      );
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
      console.log('Extracted text:', this.extractedText);
    } catch (error: any) {
      console.error('DOCX extraction error:', error);
      throw new Error(
        'Failed to extract text from DOCX file. Please make sure the file is not corrupted.'
      );
    }
  }

  toggleUploadSection() {
    this.showUploadSection = !this.showUploadSection;
  }

  deleteFile() {
    this.selectedFileName = '';
    this.extractedText = '';
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  toggleNewQuestionType(type: string) {
    this.newQuestion.selectedTypes[type] = !this.newQuestion.selectedTypes[type];
  }

  addEnumItem(question: Question) {
    if (Array.isArray(question.answer)) {
      question.answer.push('');
    }
  }
  removeEnumItem(question: Question, index: number) {
    if (Array.isArray(question.answer) && question.answer.length > 1) {
      question.answer.splice(index, 1);
    }
  }

  updateHiddenInput(value: string, hiddenInputId: string) {
    const hiddenInput = document.getElementById(hiddenInputId) as HTMLInputElement;
    if (hiddenInput) {
      hiddenInput.value = value;
    }
  }

  toggleCategories() {
    this.showCategories = !this.showCategories;
  }

  getSelectedCount(): number {
    return this.categoryOptions.filter(c => c.selected).length;
  }

  getSelectedCategories(): string[] {
    return this.categoryOptions
      .filter(c => c.selected)
      .map(c => c.label)
      .slice(0, 3); // Show only first 3 in pills
  }

  deselectCategory(label: string) {
    const category = this.categoryOptions.find(c => c.label === label);
    if (category) {
      category.selected = false;
    }
  }

  getTotalQuestionsBefore(type: string): number {
    const questionTypes = ['multiple-choice', 'enumeration', 'short-answer', 'true-false'];
    let count = 0;
    for (const t of questionTypes) {
      if (t === type) break;
      count += this.getQuestionsByType(t).length;
    }
    return count;
  }
}
