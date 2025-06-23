import { Component, HostListener, ViewChild } from '@angular/core';
import { SidebarComponent } from '../../adons/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TitleService } from '../../services/title.service';

@Component({
  selector: 'app-edit-assessment',
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './edit-assessment.component.html',
  styleUrl: './edit-assessment.component.css'
})
export class EditAssessmentComponent {
  userId: string = '';
  username: string = '';
  profile: string = '';
  isMobile = window.innerWidth < 768;
  isLoading: boolean = true;
  assessmentId: string = '';
  questions: any[] = [];
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  constructor(private api: ApiService, private auth: AuthService, private router: Router, private title: TitleService) {
    this.title.setTitle('PRISM | Edit');
    this.assessmentId = "6826ab840973a13da6d13dfa"

    // const navigation = this.router.getCurrentNavigation();
    // if (navigation && navigation.extras.state) {
    //   // this.assessmentId = navigation.extras.state['assessmentId'];
    //   this.assessmentId = "6826ab840973a13da6d13dfa"
    // } else {
    //   // this.router.navigate(['/instructor/dashboard']);
    // }

  }

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe(user => [
      this.userId = user.id,
      this.username = user.name,
      this.profile = user.profilePicture,
      this.retrieveData()
    ])
  }

  retrieveData() {
    const data = {
      assessmentId: this.assessmentId,
      userId: this.userId
    }
    this.api.retrieveAssessmentData(data).subscribe({
      next: (resp: any) => {
        console.log('Retrieved assessment data:', resp);
        this.questions = resp.data.questions;
        this.isLoading = false;
      }, error: (error: any) => {
        console.error('Error retrieving assessment data', error);
      }
    })
  }

  updateAssessment() {
    const data = {
      assessmentId: this.assessmentId,
      userId: this.userId,
      questions: this.questions.map(question => ({
        type: question.type,
        questionText: question.questionText,
        options: question.options || [],
        correctAnswer: question.correctAnswer,
        points: question.points,
        _id: question._id
      }))
    };
    this.api.updateAssessmentData(data).subscribe({
      next: (resp: any) => {
        Swal.fire({
          title: 'Assessment Updated!',
          text: 'Your assessment has been updated successfully.',
          icon: 'success',
          toast: true,
          position: 'top-end',
          timer: 2000,
        })
      }, error: (error: any) => {
        Swal.fire({
          title: 'Error Saving!',
          text: 'You have assigned this assessment to a class, this action cannot be completed.',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        })
      }
    })
  }


  getAssessmentTypeIcon(assessment: string): string {
    switch (assessment) {
      case 'mastery':
        return 'fa-trophy';
      case 'public assessment':
        return 'fa-globe';
      case 'assessment':
        return 'fa-clipboard-check';
      default:
        return 'fa-clipboard-check';
    }
  }

  getAssessmentTypeColor(assessment: string): string {
    switch (assessment) {
      case 'mastery':
        return '#d97706';
      case 'public assessment':
        return '#2563eb';
      case 'assessment':
        return '#4f46e5';
      default:
        return '#4f46e5';
    }
  }

  getQuestionTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'multiple-choice':
        return 'fa-list-ul';
      case 'enumeration':
        return 'fa-list-ol';
      default:
        return 'fa-question';
    }
  }

  formatAnswer(answer: string | string[]): string {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return answer;
  }

  getFriendlyTypeName(type: string): string {
    return type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  editQuestion(index: number): void {
    this.questions[index].originalData = JSON.parse(JSON.stringify(this.questions[index]));
    this.questions[index].isEditing = true;
  }

  deleteQuestion(index: number): void {
    this.questions.splice(index, 1);
    Swal.fire({
      title: 'Question Removed!',
      text: 'Question removed locally',
      icon: 'info',
      toast: true,
      position: 'top-end',
      timer: 3000,
      showConfirmButton: false
    });
  }

  saveQuestion(index: number): void {
    // Clean up the question data before saving
    const question = this.questions[index];

    // Ensure enumeration answers are properly formatted
    if (question.type === 'enumeration' && Array.isArray(question.correctAnswer)) {
      question.correctAnswer = question.correctAnswer.filter((answer: string) => answer.trim() !== '');
    }

    // Format true/false answer properly
    if (question.type === 'true-false') {
      question.correctAnswer = question.correctAnswer.toLowerCase();
    }

    question.isEditing = false;
    delete question.originalData;

    Swal.fire({
      title: 'Question Saved!',
      text: 'Question changes saved locally',
      icon: 'success',
      toast: true,
      position: 'top-end',
      timer: 3000,
      showConfirmButton: false
    });
  }

  cancelEdit(index: number): void {
    // Restore original data
    const originalData = this.questions[index].originalData;
    Object.keys(originalData).forEach(key => {
      if (key !== 'originalData') {
        this.questions[index][key] = originalData[key];
      }
    });

    this.questions[index].isEditing = false;
    delete this.questions[index].originalData;
  }

  getEnumerationAnswers(correctAnswer: any): string[] {
    if (Array.isArray(correctAnswer)) {
      return correctAnswer;
    }
    if (typeof correctAnswer === 'string') {
      return correctAnswer.split(',').map(answer => answer.trim());
    }
    return [''];
  }

  addEnumerationAnswer(question: any): void {
    if (!Array.isArray(question.correctAnswer)) {
      question.correctAnswer = this.getEnumerationAnswers(question.correctAnswer);
    }
    question.correctAnswer.push('');
  }

  removeEnumerationAnswer(question: any, index: number): void {
    if (Array.isArray(question.correctAnswer) && question.correctAnswer.length > 1) {
      question.correctAnswer.splice(index, 1);
    }
  }

  // TrackBy functions to prevent DOM recreation
  trackByQuestionIndex(index: number, question: any): any {
    return question._id || index;
  }

  trackByOptionIndex(index: number, option: any): any {
    return index;
  }

  trackByAnswerIndex(index: number, answer: any): any {
    return index;
  }





  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  createNewAssessment() {
    this.router.navigate(['/instructor/generate']);
  }

  getAssessmentTypeLabel(assessment: any): string {
    return assessment.type || 'Assessment';
  }

}
