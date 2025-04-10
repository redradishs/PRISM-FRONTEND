import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  apiUrl = 'https://prismapi2.onrender.com/student';
  // apiUrl = 'http://localhost:8000/student';

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
