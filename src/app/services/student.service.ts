import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  apiUrl = 'https://prismapi2.onrender.com/student';
  Assessment = 'https://prismapi2.onrender.com/submission';
  // apiUrl = 'http://localhost:8000/student';
  // Assessment = 'http://localhost:8000/submission';


  constructor(private http: HttpClient) {}

  //dashboad page
  getDashboardData(id: string) {
    return this.http.get(`${this.apiUrl}/statistics/${id}`);
  }

  //conformation page
  getConfirmationData(data: any) {
    return this.http.post(`${this.apiUrl}/assessmentConfirmation`, data);
  }
  recordStartTime(data: any) {
    return this.http.post(`${this.apiUrl}/recordStartTime`, data);
  }

  //Assessment Take Page

  getAssessmentData(id: string, studentId: string) {
    return this.http.get(
      `${this.apiUrl}/assessmentQuestions/${id}/${studentId}`
    );
  }

  submitAssessment(data: any) {
    return this.http.post(`${this.apiUrl}/submitAssessment`, data);
  }


  //Assessment Secure Page
  getSecureData(studentId: String, AssessmentId: string) {
    return this.http.get(`${this.Assessment}/assessment/progress/${studentId}/${AssessmentId}/data`);
  }

  nextQuestionGrabber(assessmentId: string, studentId: string) {
    return this.http.get(`${this.Assessment}/assessment/question/${assessmentId}/${studentId}/next`);
  }

  submitAnswer(data: any) {
    return this.http.post(`${this.Assessment}/assessment/push`, data);
  }

  finalizeAssessment(studentId: string, assessmentId: string) {
    return this.http.post(`${this.Assessment}/assessment/${studentId}/${assessmentId}/finalize`, {});
  }

  //result page
  getResultData(assessmentId: string, studentId: string) {
    return this.http.get(`${this.apiUrl}/assessment/result/${assessmentId}/${studentId}`);
  }
  getPerformanceData(assessmentId: string, studentId: string) {
    return this.http.get(`${this.apiUrl}/assessment/performance/${assessmentId}/${studentId}`);
  }
  getQuestionOverview(assessmentId: string, studentId: string) {
    return this.http.get(`${this.apiUrl}/assessment/review/${assessmentId}/${studentId}`);
  }


}
