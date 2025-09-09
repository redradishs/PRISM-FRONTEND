import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import * as mammoth from 'mammoth';
declare const pdfjsLib: any;

interface Question {
  type: string;
  id: number;
  question: string;
  questionNumber: number;
  answer: string | string[] | boolean;
  options?: { [key: string]: string };
  points: number;
  requiredItems?: number;
  verified?: boolean;
}

interface NewQuestion {
  type: string;
  count: number;
  selectedTypes: { [key: string]: boolean };
  counts: { [key: string]: number };
}

@Component({
  selector: 'app-final-generate-assessment',
  imports: [FormsModule, CommonModule, SidebarComponent, ReactiveFormsModule],
  templateUrl: './final-generate-assessment.component.html',
  styleUrl: './final-generate-assessment.component.css'
})
export class FinalGenerateAssessmentComponent implements OnInit, OnDestroy {
  isMobile = window.innerWidth < 768;
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }
  @ViewChild(SidebarComponent)
  sidebar!: SidebarComponent;
  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
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
  userId: string = '';
  profile: string = '';
  enableGeneration: boolean = true;
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
  step: number = 1;
  isMenuOpen = false;
  editingQuestionId: number | null = null;
  showAddDialog = false;
  fabOpen = false;
  fabActive = false;
  fabFaded = false;
  private fabTimeoutId: any = null;
  private readonly FAB_TIMEOUT_DURATION = 10000;
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

  constructor(private api: ApiService, private router: Router, private auth: AuthService, private titleService: Title) {
    this.titleService.setTitle('PRISM | Create');
  }

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe(
      (user: any) => {
        this.userId = user.id;
        this.username = user.name;
        this.profile = user.profilePicture;
        this.enableGeneration = user.enableQuestionGeneration;
      },
      (error: any) => {
        console.error('Error getting current user', error);
      }
    );
  }

  ngOnDestroy(): void {
    if (this.fabTimeoutId) {
      clearTimeout(this.fabTimeoutId);
    }
  }

  clearQuestions() {
    Swal.fire({
      title: 'Are you sure you want to clear all questions?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, clear all questions',
      cancelButtonText: 'No, keep questions'
    }).then((result) => {
      if (result.isConfirmed) {
        this.questions = [];
        this.nextId = 1;
        this.errorMessage = null;
        this.showAddDialog = false;
        this.editingQuestionId = null;
      }
    });
  }

  generateQuestions(): void {
    if (!this.aiGeneration.topic) {
      this.errorMessage = 'Please enter a topic';
      return;
    }
    if (this.selectedTypes.length === 0) {
      this.errorMessage = 'Please select at least one question type';
      return;
    }
    if (Number(this.aiGeneration.questionCount) > 50) {
      this.errorMessage = 'You have unlimited generation of questions. PRISM recommends to generate maximum of 50 questions per request.';
      return;
    }

    this.showUploadSection = false;
    this.isGenerating = true;
    this.errorMessage = null;
    this.generated = false;

    // Map selected types to API format
    const questionTypes = this.selectedTypes.map(type => {
      const typeMapping = {
        'mc': 'multiple choice',
        'sa': 'short answer',
        'enum': 'enumeration',
        'tf': 'true/false'
      };
      return typeMapping[type as keyof typeof typeMapping];
    }).filter(type => type);

    // prepare data
    const requestData: any = {
      topic: this.aiGeneration.topic,
      numberOfQuestions: Number(this.aiGeneration.questionCount),
      questionTypes: questionTypes,
      difficulty: this.aiGeneration.difficulty
    };
    if (this.extractedText && this.extractedText.trim() !== '') {
      requestData.context = this.extractedText;
    }
    if (this.aiGeneration.instructions && this.aiGeneration.instructions.trim() !== '') {
      requestData.additionalInstructions = this.aiGeneration.instructions;
    }

    // console.log('Sending request data:', requestData);
    this.generateQuestionsWithRetry(requestData, 5);
  }

  validGeneration(): boolean {
    if (!this.aiGeneration.topic || this.selectedTypes.length === 0 || (Number(this.aiGeneration.questionCount) > 50)) {
      return false;
    }
    return true;
  }

  private generateQuestionsWithRetry(requestData: any, maxRetries: number, currentAttempt: number = 1): void {
    const questionCount = Number(this.aiGeneration.questionCount);
    const apiCall = questionCount > 20
      ? this.api.bulkfinalGenerateAssessment(requestData)
      : this.api.finalGenerateAssessment(requestData);

    apiCall.subscribe({
      next: (response: any) => {
        try {
          console.log(`API Response (Attempt ${currentAttempt}):`, response);
          if (response.success && response.data && response.data.questions && Array.isArray(response.data.questions)) {
            this.handleGeneratedQuestions(response.data);
            this.generated = true;
            this.showSuccessMessage();
          } else if (response.questions && Array.isArray(response.questions)) {
            this.handleGeneratedQuestions(response);
            this.generated = true;
            this.showSuccessMessage();
          } else if (response.success === false && response.error && currentAttempt < maxRetries) {
            console.log(`Attempt ${currentAttempt} failed, retrying... (${maxRetries - currentAttempt} attempts left)`);
            this.showRetryMessage(currentAttempt, maxRetries);
            setTimeout(() => {
              this.generateQuestionsWithRetry(requestData, maxRetries, currentAttempt + 1);
            }, 2000);
            return;
          } else {
            console.error('Invalid response structure:', response);
            this.errorMessage = response.error || 'Invalid response format from AI';
          }
        } catch (error) {
          console.error('Error parsing AI response:', error);
          this.errorMessage = 'Error processing the generated questions';
        }
        this.isGenerating = false;
      },
      error: (error) => {
        console.error(`Error generating questions (Attempt ${currentAttempt}):`, error);

        if (currentAttempt < maxRetries) {
          console.log(`Attempt ${currentAttempt} failed, retrying... (${maxRetries - currentAttempt} attempts left)`);
          this.showRetryMessage(currentAttempt, maxRetries);
          setTimeout(() => {
            this.generateQuestionsWithRetry(requestData, maxRetries, currentAttempt + 1);
          }, 5000);
          return;
        } else {
          this.errorMessage = 'Failed to generate questions after multiple attempts. Please try again later.';
          this.isGenerating = false;
        }
      }
    });
  }

  private showSuccessMessage(): void {
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

  private showRetryMessage(currentAttempt: number, maxRetries: number): void {
    Swal.fire({
      title: 'Retrying...',
      text: `Attempt ${currentAttempt} of ${maxRetries} failed. Retrying in 5 seconds...`,
      icon: 'info',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      background: '#fff',
      iconColor: '#3b82f6'
    });
  }

  private handleGeneratedQuestions(response: any): void {
    try {
      const questions = response.questions;
      if (!Array.isArray(questions)) {
        throw new Error('Invalid questions array format');
      }
      const expectedCount = Number(this.aiGeneration.questionCount);
      console.log(`Expected ${expectedCount} questions, got ${questions.length}`);
      const questionToAddOnly = questions.slice(0, expectedCount);

      if (Array.isArray(questionToAddOnly)) {
        questionToAddOnly.forEach((question: any) => {
          const formattedQuestion = {
            type: this.mapQuestionType(question.type),
            id: this.nextId++,
            questionNumber: this.questions.length + 1,
            question: question.question,
            options: question.type === 'multiple choice' ? {
              A: question.options?.A || '',
              B: question.options?.B || '',
              C: question.options?.C || '',
              D: question.options?.D || ''
            } : undefined,
            answer: question.type === 'true/false'
              ? String(question.answer).toLowerCase()
              : question.type === 'enumeration'
                ? (Array.isArray(question.answer) ? question.answer : [])
                : question.answer,
            difficulty: question.difficulty,
            points: 1
          };

          if (formattedQuestion.type === 'multiple-choice' && question.options) {
            this.multipleChoiceOptions = [
              question.options.A,
              question.options.B,
              question.options.C,
              question.options.D
            ];
          }

          if (formattedQuestion.type === 'enumeration') {
            if (Array.isArray(question.answer) && question.answer.length > 0) {
              this.enumerationItems = question.answer;
            } else {
              formattedQuestion.answer = ['', '', ''];
            }
          }

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

  toggleFab(): void {
    this.fabOpen = !this.fabOpen;
    this.setFabActive();
  }

  closeFab(): void {
    this.fabOpen = false;
    this.setFabActive();
  }

  private setFabActive(): void {
    this.fabActive = true;
    this.fabFaded = false;

    if (this.fabTimeoutId) {
      clearTimeout(this.fabTimeoutId);
    }

    if (!this.fabOpen) {
      this.fabTimeoutId = setTimeout(() => {
        this.fabActive = false;
        this.fabFaded = true;
      }, this.FAB_TIMEOUT_DURATION);
    }
  }

  onFabInteraction(): void {
    if (!this.fabOpen) {
      this.setFabActive();
    }
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

  //used this function to sort the numbers in order, there was a bug before and this fixed it.
  private updateQuestionNumbers() {
    this.questions.sort((a, b) => a.id - b.id);
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
      .filter((q) => q.type === type);
  }

  getUnverifiedQuestionCount(): number {
    return this.questions.filter(q => !q.verified).length;
  }

  getVerifiedQuestionCount(): number {
    return this.questions.filter(q => q.verified).length;
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
      this.editingQuestionId = null;
      // console.log('Saved question:', question);
    } else {
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


  //function to edit the questions, each question type has its own editing option
  handleKeyPress(event: any, questionId: number, type?: string, key?: string, index?: number) {
    const keyEvent = event as KeyboardEvent;

    if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
      event.preventDefault();
      const value = (event.target as HTMLTextAreaElement)?.value;
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
      this.toggleEditAndSave(question);
    }
  }

  getEnumAnswer(question: Question, index: number): string {
    return Array.isArray(question.answer) ? (question.answer[index] || '') : '';
  }

  setEnumAnswer(question: Question, index: number, value: string): void {
    if (Array.isArray(question.answer)) {
      question.answer[index] = value;
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByQuestionId(index: number, question: Question): number {
    return question.id;
  }

  //ADDED TO FIX THE MULTIPLE CHOICE OPTIONS BUG, PASSING THE ANSWER OR CHANGES
  //FROM HANDLE OPTION BLUR THEN OPTION BLUR CALLS THE SETOPTION ANSWER
  public setOptionAnswer(question: any, optionKey: string, newValue: string, browserEvent?: Event): void {

    if (this.isEditing(question.id)) {
      if (!question.options) {
        question.options = {};
      }
      const updatedOptions = { ...question.options };
      updatedOptions[optionKey] = newValue;
      question.options = updatedOptions;
      if (browserEvent && typeof browserEvent.stopPropagation === 'function') {
        browserEvent.stopPropagation();
      }
    }
  }

  public handleOptionBlur(question: any, optionKey: string, event: FocusEvent): void {
    const target = event.target as HTMLTextAreaElement;
    if (target && typeof target.value === 'string') {
      const newValue = target.value;
      this.setOptionAnswer(question, optionKey, newValue, event);
    }
  }

  addNewQuestions() {
    let added = 0;

    Object.keys(this.newQuestion.selectedTypes).forEach(type => {
      if (this.newQuestion.selectedTypes[type]) {
        const count = Math.max(1, Math.round(this.newQuestion.counts[type] || 1));
        for (let i = 0; i < count; i++) {
          const question: Question = {
            id: this.nextId++,
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
            verified: false
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
        correctAnswer: q.type === 'enumeration' && Array.isArray(q.answer)
          ? q.answer.map(a => (a ?? '').toString().trim()).filter(a => a !== '')
          : q.answer,
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
          showDenyButton: true,
          denyButtonText: 'Assign',
          denyButtonColor: '#10b981',
          customClass: {
            confirmButton: 'swal2-confirm',
            denyButton: 'swal2-deny',
          }
        }).then((result) => {
          if (result.isConfirmed) {
            this.resetForm();
          } else if (result.isDenied) {
            this.router.navigate(['/instructor/assign']);
            this.resetForm();
          }
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

  //for the upload document function
  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.errorMessage = '';
    this.extractedText = '';
    this.selectedFileName = file.name;
    // console.log('File selected:', file);
    // console.log('File type:', file.type);
    // console.log('File name:', file.name);
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
      // console.log('Extracted text:', this.extractedText);
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
      // console.log('Extracted text:', this.extractedText);
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

  scrollToSection(section: number) {
    if (section === 1) {
      this.step = section;
      const sectionElement = document.getElementById('start');
      if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (section === 2) {

      if (this.questions.length === 0) {
        Swal.fire({
          title: 'Error!',
          text: 'Please add at least one question to proceed.',
          icon: 'error',
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
          timer: 1000
        });
        return;
      }
      const sectionElement = document.getElementById('start');
      this.step = section;
      if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: 'smooth' });
      }
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
      .slice(0, 3);
  }

  deselectCategory(label: string) {
    const category = this.categoryOptions.find(c => c.label === label);
    if (category) {
      category.selected = false;
    }
  }





  //for verifying the questions, we first take the array of questions and filter out the ones that are not verified.
  exportQuestionsAsJson() {
    if (this.questions.length === 0) {
      Swal.fire({
        title: 'No Questions',
        text: 'Please add questions first',
        icon: 'warning',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        background: '#fff',
        iconColor: '#f59e0b'
      });
      return;
    }
    const unverifiedQuestions = this.questions.filter(q => !q.verified);

    if (unverifiedQuestions.length === 0) {
      Swal.fire({
        title: 'All Verified',
        text: 'All questions have already been verified.',
        icon: 'info',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#fff',
        iconColor: '#6366f1'
      });
      return;
    }
    Swal.fire({
      title: 'Verifying Questions',
      text: `Verifying ${unverifiedQuestions.length} questions...`,
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const formattedQuestions = unverifiedQuestions.map(question => {
      const base: any = {
        question: question.question,
        type: this.formatQuestionType(question.type),
        difficulty: this.aiGeneration.difficulty
      };

      if (question.type === 'multiple-choice' && question.options) {
        base.options = {
          A: question.options['A'],
          B: question.options['B'],
          C: question.options['C'],
          D: question.options['D']
        };
        base.answer = question.answer as string;
      } else if (question.type === 'true-false') {
        base.answer = question.answer === 'true' || question.answer === true;
      } else if (question.type === 'enumeration') {
        base.answer = question.answer as string[];
      } else {
        base.answer = question.answer as string;
      }

      return base;
    });
    const exportData = {
      questions: formattedQuestions
    };

    this.api.verifyQuestions(exportData).subscribe({
      next: (resp: any) => {
        console.log('Response from verification:', resp);

        if (resp.success) {
          Swal.close();

          if (resp.verification && resp.verification.length > 0) {
            const unverifiedIds = unverifiedQuestions.map(q => q.id);
            this.questions = this.questions.filter(q => !unverifiedIds.includes(q.id));
            resp.verification.forEach((verifiedQuestion: any, index: number) => {

              const { options, updatedAnswer } = this.getOptionsForQuestion(verifiedQuestion);

              const question: Question = {
                id: this.nextId++,
                questionNumber: this.questions.length + index + 1,
                type: this.mapQuestionType(verifiedQuestion.type),
                question: verifiedQuestion.question,
                answer: verifiedQuestion.type.toLowerCase() === 'multiple choice'
                  ? updatedAnswer
                  : this.convertAnswer(verifiedQuestion.type, verifiedQuestion.answer),
                points: 1,
                options: options,
                verified: true
              };

              this.questions.push(question);
            });

            this.updateQuestionNumbers();

            Swal.fire({
              title: 'Questions Verified',
              text: `${resp.verification.length} verified questions have been added. ${resp.duplicates?.count || 0} duplicates were removed.`,
              icon: 'success',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
              background: '#fff',
              iconColor: '#22c55e'
            });
          } else {
            Swal.fire({
              title: 'No Valid Questions',
              text: 'No verified questions were found. Your questions may have issues.',
              icon: 'warning',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              background: '#fff',
              iconColor: '#f59e0b'
            });
          }
        } else {
          console.error('Verification failed:', resp);
          Swal.fire({
            title: 'Error',
            text: 'Failed to verify questions',
            icon: 'error',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            background: '#fff',
            iconColor: '#ef4444'
          });
        }
      },
      error: (error: any) => {
        console.error('Error verifying questions', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to verify questions',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          background: '#fff',
          iconColor: '#ef4444'
        });
      }
    });
    console.log(JSON.stringify(exportData, null, 4));
  }

  //helper method to save the api response to the mapped response i have in the ts.
  private convertAnswer(type: string, answer: any): string | string[] | boolean {
    if (type.toLowerCase() === 'true/false') {
      return answer === true ? 'true' : 'false';
    }
    return answer;
  }

  // Helper method to extract options for multiple choice questions, if an option E exists
  private getOptionsForQuestion(verifiedQuestion: any): { options: { [key: string]: string } | undefined, updatedAnswer: string | boolean | string[] } {
    let updatedAnswer = verifiedQuestion.answer;

    if (verifiedQuestion.type.toLowerCase() === 'multiple choice' && verifiedQuestion.options) {

      const hasOptionE = verifiedQuestion.options.E !== undefined;

      const options: { [key: string]: string } = {
        A: verifiedQuestion.options.A || '',
        B: verifiedQuestion.options.B || '',
        C: verifiedQuestion.options.C || '',
        D: verifiedQuestion.options.D || ''
      };

      if (hasOptionE) {
        console.log('Found question with option E:', verifiedQuestion.question);
        console.log('Original options:', JSON.stringify(verifiedQuestion.options));
        console.log('Original answer:', verifiedQuestion.answer);

        const originalB = options['B'];

        options['B'] = verifiedQuestion.options.E || '';

        if (updatedAnswer === 'E') {
          updatedAnswer = 'B';
          console.log('Answer updated from E to B');
        }
        else if (updatedAnswer === 'B' && originalB !== options['B']) {
          console.log('Warning: Answer was B but option B content was replaced with option E');
        }

        console.log('Final options:', JSON.stringify(options));
        console.log('Final answer:', updatedAnswer);
      }

      return { options, updatedAnswer };
    }

    return { options: undefined, updatedAnswer };
  }

  // Helper to format question type strings to match the example format
  private formatQuestionType(type: string): string {
    switch (type) {
      case 'multiple-choice':
        return 'multiple choice';
      case 'true-false':
        return 'true/false';
      case 'short-answer':
        return 'short answer';
      default:
        return type;
    }
  }

  private resetForm(): void {
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
  }

  decreaseQuantity(type: string): void {
    if (this.newQuestion.counts[type] > 1) {
      this.newQuestion.counts[type]--;
    }
  }

  increaseQuantity(type: string): void {
    if (this.newQuestion.counts[type] < 20) {
      this.newQuestion.counts[type]++;
    }
  }

  getSelectedQuestionTypesCount(): number {
    return Object.values(this.newQuestion.selectedTypes).filter(selected => selected).length;
  }

  getSelectedQuestionTypes(): Array<{ label: string, count: number }> {
    const selectedTypes: Array<{ label: string, count: number }> = [];

    Object.keys(this.newQuestion.selectedTypes).forEach(type => {
      if (this.newQuestion.selectedTypes[type]) {
        const questionType = this.questionTypes.find(qt => qt.value === type);
        if (questionType) {
          selectedTypes.push({
            label: questionType.label,
            count: this.newQuestion.counts[type] || 1
          });
        }
      }
    });

    return selectedTypes;
  }

  getTotalSelectedQuestions(): number {
    let total = 0;
    Object.keys(this.newQuestion.selectedTypes).forEach(type => {
      if (this.newQuestion.selectedTypes[type]) {
        total += this.newQuestion.counts[type] || 1;
      }
    });
    return total;
  }

  autoResize(event: any): void {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}
